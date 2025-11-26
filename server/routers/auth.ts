import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { createSession, deleteSession, clearSessionCookie } from '@/lib/session';
import { findOrThrow } from '@/lib/errors';
import { logAuthEvent } from '@/lib/logger';
import {
  checkAccountLockout,
  recordLoginAttempt,
  checkIpLockout,
  LOCKOUT_CONFIG,
} from '@/lib/account-lockout';
import { hashPassword, verifyPassword, generateSlug, generateToken } from '@/lib/password';
import { auditAuthEvent } from '@/lib/audit';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  sendVerificationEmail as sendVerificationEmailService,
  sendPasswordResetEmail as sendPasswordResetEmailService,
  sendWelcomeEmail as sendWelcomeEmailService,
  sendInvitationEmail as sendInvitationEmailService,
} from '@/lib/email/send-emails';
import { checkTrustedDevice, createTrustedDevice } from '@/lib/auth/trusted-devices';

// Token expiration times
const EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY = 1 * 60 * 60 * 1000; // 1 hour
const INVITATION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Get client IP and user agent from request
 */
function getClientInfo(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || 'unknown';
  const userAgent = req.headers.get('user-agent') || undefined;
  return { ipAddress, userAgent };
}

export const authRouter = router({
  /**
   * Register - Create new organization and admin user
   */
  register: publicProcedure
    .input(
      z.object({
        organizationName: z.string().min(2).max(100),
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(12, 'Password must be at least 12 characters'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { ipAddress, userAgent } = getClientInfo(ctx.req);

      // Rate limit registration attempts
      const rateLimitResult = await checkRateLimit(ipAddress, 'auth');
      if (!rateLimitResult.success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many registration attempts. Please try again later.',
        });
      }

      ctx.logger.info({ email: input.email, organizationName: input.organizationName }, 'Registration attempt');

      // Check if email already exists (globally - across all organizations)
      const existingUser = await ctx.prisma.user.findFirst({
        where: { email: input.email },
      });

      if (existingUser) {
        ctx.logger.warn({ email: input.email }, 'Registration failed: email already exists');
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An account with this email already exists',
        });
      }

      // Generate slug from organization name
      const slug = generateSlug(input.organizationName);

      // Check if slug is already taken
      const existingOrg = await ctx.prisma.organization.findUnique({
        where: { slug },
      });

      if (existingOrg) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An organization with this name already exists. Please choose a different name.',
        });
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Create organization and admin user in a transaction
      const result = await ctx.prisma.$transaction(async (tx) => {
        // Create organization
        const organization = await tx.organization.create({
          data: {
            name: input.organizationName,
            slug,
          },
        });

        // Create admin user with MANAGER role
        const user = await tx.user.create({
          data: {
            organizationId: organization.id,
            email: input.email,
            passwordHash,
            name: input.name,
            role: 'MANAGER',
            emailVerified: false,
            status: 'PENDING_VERIFICATION',
          },
        });

        return { user, organization };
      });

      // Send verification email (service creates its own token)
      const emailResult = await sendVerificationEmailService(input.email, input.name);
      if (!emailResult.success) {
        ctx.logger.warn({ email: input.email, error: emailResult.error }, 'Failed to send verification email');
      }

      // Log registration
      await auditAuthEvent(
        'LOGIN_SUCCESS',
        result.user.id,
        input.email,
        ipAddress,
        userAgent,
        { organizationId: result.organization.id, role: 'MANAGER', action: 'registration' }
      );

      ctx.logger.info({ userId: result.user.id, organizationId: result.organization.id }, 'Registration successful');

      return {
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        organizationSlug: slug,
      };
    }),

  /**
   * Login with password - Real password-based authentication
   */
  loginWithPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { ipAddress, userAgent } = getClientInfo(ctx.req);

      // Rate limit login attempts
      const rateLimitResult = await checkRateLimit(ipAddress, 'auth');
      if (!rateLimitResult.success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many login attempts. Please try again later.',
        });
      }

      ctx.logger.info({ email: input.email }, 'Password login attempt');

      // Check IP-based lockout first
      const ipLocked = await checkIpLockout(ipAddress);
      if (ipLocked) {
        ctx.logger.warn({ ipAddress }, 'IP address temporarily blocked');
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many login attempts from this IP. Please try again later.',
        });
      }

      // Check account lockout
      const lockoutStatus = await checkAccountLockout(input.email);
      if (lockoutStatus.isLocked) {
        const remainingMinutes = lockoutStatus.lockoutEndsAt
          ? Math.ceil((lockoutStatus.lockoutEndsAt.getTime() - Date.now()) / 60000)
          : LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES;

        ctx.logger.warn(
          { email: input.email, lockoutEndsAt: lockoutStatus.lockoutEndsAt },
          'Account locked due to too many failed attempts'
        );

        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Account temporarily locked due to too many failed login attempts. Please try again in ${remainingMinutes} minutes.`,
        });
      }

      // Find user by email
      const user = await ctx.prisma.user.findFirst({
        where: {
          email: input.email,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          passwordHash: true,
          emailVerified: true,
          status: true,
          twoFactorEnabled: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          department: true,
          title: true,
          avatar: true,
        },
      });

      // If user not found or no password hash, record failed attempt
      if (!user || !user.passwordHash) {
        await recordLoginAttempt(input.email, false, ipAddress, userAgent);

        ctx.logger.warn({ email: input.email }, 'Login failed: user not found or no password');
        logAuthEvent('login_failed', undefined, { email: input.email, reason: 'user_not_found' });

        // Use generic message to prevent user enumeration
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password.',
        });
      }

      // Verify password
      const isValidPassword = await verifyPassword(input.password, user.passwordHash);

      if (!isValidPassword) {
        await recordLoginAttempt(input.email, false, ipAddress, userAgent);

        ctx.logger.warn({ email: input.email }, 'Login failed: invalid password');
        logAuthEvent('login_failed', user.id, { email: input.email, reason: 'invalid_password' });

        // Use generic message to prevent user enumeration
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password.',
        });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        ctx.logger.warn({ email: input.email }, 'Login failed: email not verified');
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        });
      }

      // Record successful password verification
      await recordLoginAttempt(input.email, true, ipAddress, userAgent);

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Check if device is trusted
        const isTrusted = await checkTrustedDevice(user.id);

        if (isTrusted) {
          ctx.logger.info({ userId: user.id }, 'Device is trusted, skipping 2FA');
          // Skip 2FA and proceed to create session
        } else {
          ctx.logger.info({ userId: user.id }, 'Password verified, 2FA required');
          return {
            requiresTwoFactor: true,
            email: user.email,
            userId: user.id,
          };
        }
      }

      // Update last login time
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Create session
      await createSession(
        user.id,
        user.email,
        user.role,
        user.organizationId,
        user.organization.slug
      );

      // Log successful login
      ctx.logger.info({ userId: user.id, role: user.role, organizationId: user.organizationId }, 'Login successful');
      logAuthEvent('login_success', user.id, { email: input.email, role: user.role });
      await auditAuthEvent('LOGIN_SUCCESS', user.id, user.email, ipAddress, userAgent, {
        organizationId: user.organizationId,
      });

      return {
        requiresTwoFactor: false,
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        title: user.title,
        avatar: user.avatar,
        organization: user.organization,
      };
    }),

  /**
   * Verify two-factor authentication code
   * Completes the login process after password verification
   */
  verifyTwoFactor: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().min(1),
        isBackupCode: z.boolean().default(false),
        trustDevice: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { ipAddress, userAgent } = getClientInfo(ctx.req);

      ctx.logger.info({ email: input.email }, '2FA verification attempt');

      // Find user with 2FA details
      const user = await ctx.prisma.user.findFirst({
        where: {
          email: input.email,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          twoFactorEnabled: true,
          twoFactorSecret: true,
          backupCodes: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          department: true,
          title: true,
          avatar: true,
        },
      });

      if (!user || !user.twoFactorEnabled) {
        ctx.logger.warn({ email: input.email }, '2FA verification failed: 2FA not enabled');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '2FA is not enabled for this account',
        });
      }

      let verified = false;

      if (input.isBackupCode) {
        // Verify backup code
        if (!user.backupCodes || user.backupCodes.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No backup codes available',
          });
        }

        const { verifyBackupCode } = await import('@/lib/auth/two-factor');
        const { valid, index } = await verifyBackupCode(input.code, user.backupCodes);

        if (valid) {
          verified = true;
          // Remove used backup code
          const updatedCodes = [...user.backupCodes];
          updatedCodes.splice(index, 1);
          await ctx.prisma.user.update({
            where: { id: user.id },
            data: { backupCodes: updatedCodes },
          });
          ctx.logger.info({ userId: user.id }, 'Login with backup code successful');
        }
      } else {
        // Verify TOTP code
        if (!user.twoFactorSecret) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: '2FA is enabled but secret is missing',
          });
        }

        const { decrypt } = await import('@/lib/encryption');
        const { verifyTOTP } = await import('@/lib/auth/two-factor');

        const secret = decrypt(user.twoFactorSecret);
        verified = verifyTOTP(input.code, secret);
      }

      if (!verified) {
        ctx.logger.warn({ userId: user.id }, '2FA verification failed: invalid code');
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid verification code',
        });
      }

      // Update last login time
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Create trusted device if requested
      if (input.trustDevice) {
        await createTrustedDevice(user.id, userAgent);
        ctx.logger.info({ userId: user.id }, 'Device marked as trusted');
      }

      // Create session
      await createSession(
        user.id,
        user.email,
        user.role,
        user.organizationId,
        user.organization.slug
      );

      // Log successful login
      ctx.logger.info({ userId: user.id, role: user.role, organizationId: user.organizationId }, '2FA login successful');
      logAuthEvent('login_success', user.id, { email: input.email, role: user.role, twoFactor: true });
      await auditAuthEvent('LOGIN_SUCCESS', user.id, user.email, ipAddress, userAgent, {
        organizationId: user.organizationId,
        twoFactorUsed: true,
        deviceTrusted: input.trustDevice,
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        title: user.title,
        avatar: user.avatar,
        organization: user.organization,
      };
    }),

  /**
   * Verify email with token
   */
  verifyEmail: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      ctx.logger.info('Email verification attempt');

      // Find token
      const verificationToken = await ctx.prisma.verificationToken.findUnique({
        where: { token: input.token },
      });

      if (!verificationToken || verificationToken.type !== 'EMAIL_VERIFICATION') {
        ctx.logger.warn('Email verification failed: invalid token');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired verification token',
        });
      }

      // Check if expired
      if (verificationToken.expiresAt < new Date()) {
        ctx.logger.warn({ identifier: verificationToken.identifier }, 'Email verification failed: token expired');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Verification token has expired. Please request a new one.',
        });
      }

      // Update user and delete token in transaction
      const user = await ctx.prisma.$transaction(async (tx) => {
        // Update user
        const updatedUser = await tx.user.updateMany({
          where: {
            email: verificationToken.identifier,
            emailVerified: false,
          },
          data: {
            emailVerified: true,
            emailVerifiedAt: new Date(),
            status: 'ACTIVE',
          },
        });

        if (updatedUser.count === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User not found or email already verified',
          });
        }

        // Delete the token
        await tx.verificationToken.delete({
          where: { id: verificationToken.id },
        });

        // Get the user for logging
        return tx.user.findFirst({
          where: { email: verificationToken.identifier },
        });
      });

      ctx.logger.info({ email: verificationToken.identifier }, 'Email verified successfully');

      return {
        success: true,
        message: 'Email verified successfully! You can now log in.',
      };
    }),

  /**
   * Resend verification email
   */
  resendVerification: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { ipAddress } = getClientInfo(ctx.req);

      // Rate limit email verification requests
      const rateLimitResult = await checkRateLimit(ipAddress, 'auth');
      if (!rateLimitResult.success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests. Please try again later.',
        });
      }

      ctx.logger.info({ email: input.email }, 'Resend verification request');

      // Find user (always return success for security)
      const user = await ctx.prisma.user.findFirst({
        where: {
          email: input.email,
          deletedAt: null,
        },
      });

      // If user exists and not verified, send new verification email
      if (user && !user.emailVerified) {
        // Delete old verification tokens first
        await ctx.prisma.verificationToken.deleteMany({
          where: {
            identifier: input.email,
            type: 'EMAIL_VERIFICATION',
          },
        });

        // Send verification email (service creates new token)
        const emailResult = await sendVerificationEmailService(input.email, user.name);
        if (!emailResult.success) {
          ctx.logger.warn({ email: input.email, error: emailResult.error }, 'Failed to resend verification email');
        } else {
          ctx.logger.info({ email: input.email }, 'Verification email resent');
        }
      } else if (user && user.emailVerified) {
        ctx.logger.info({ email: input.email }, 'Verification email request for already verified user');
      } else {
        ctx.logger.info({ email: input.email }, 'Verification email request for non-existent user');
      }

      // Always return success (security - don't reveal if email exists)
      return {
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      };
    }),

  /**
   * Forgot password - Request password reset
   */
  forgotPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { ipAddress } = getClientInfo(ctx.req);

      // Rate limit password reset requests
      const rateLimitResult = await checkRateLimit(ipAddress, 'auth');
      if (!rateLimitResult.success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many password reset requests. Please try again later.',
        });
      }

      ctx.logger.info({ email: input.email }, 'Password reset request');

      // Find user
      const user = await ctx.prisma.user.findFirst({
        where: {
          email: input.email,
          deletedAt: null,
        },
      });

      // If user exists, send password reset email (service handles token creation)
      if (user) {
        const emailResult = await sendPasswordResetEmailService(input.email, user.name);
        if (!emailResult.success) {
          ctx.logger.warn({ email: input.email, error: emailResult.error }, 'Failed to send password reset email');
        } else {
          ctx.logger.info({ email: input.email }, 'Password reset email sent');
        }
      } else {
        ctx.logger.info({ email: input.email }, 'Password reset request for non-existent user');
      }

      // Always return success (security - don't reveal if email exists)
      return {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      };
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        password: z.string().min(12, 'Password must be at least 12 characters'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { ipAddress, userAgent } = getClientInfo(ctx.req);

      ctx.logger.info('Password reset attempt');

      // Find token
      const resetToken = await ctx.prisma.verificationToken.findUnique({
        where: { token: input.token },
      });

      if (!resetToken || resetToken.type !== 'PASSWORD_RESET') {
        ctx.logger.warn('Password reset failed: invalid token');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired reset token',
        });
      }

      // Check if expired
      if (resetToken.expiresAt < new Date()) {
        ctx.logger.warn({ identifier: resetToken.identifier }, 'Password reset failed: token expired');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Reset token has expired. Please request a new one.',
        });
      }

      // Hash new password
      const passwordHash = await hashPassword(input.password);

      // Update password and delete token in transaction
      const user = await ctx.prisma.$transaction(async (tx) => {
        // Update user password
        const updatedUser = await tx.user.updateMany({
          where: {
            email: resetToken.identifier,
            deletedAt: null,
          },
          data: {
            passwordHash,
          },
        });

        if (updatedUser.count === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // Delete the token
        await tx.verificationToken.delete({
          where: { id: resetToken.id },
        });

        // Delete all sessions for this user (invalidate all existing sessions)
        await tx.session.deleteMany({
          where: {
            user: {
              email: resetToken.identifier,
            },
          },
        });

        // Get the user for logging
        return tx.user.findFirst({
          where: { email: resetToken.identifier },
        });
      });

      // Clear any existing session cookie (iron-session) in addition to DB sessions
      await clearSessionCookie();

      ctx.logger.info({ email: resetToken.identifier }, 'Password reset successful');
      await auditAuthEvent('LOGIN_SUCCESS', user!.id, user!.email, ipAddress, userAgent, {
        action: 'password_reset',
      });

      return {
        success: true,
        message: 'Password reset successful! You can now log in with your new password.',
      };
    }),

  /**
   * Accept invitation - Create account from invitation
   */
  acceptInvitation: publicProcedure
    .input(
      z.object({
        token: z.string(),
        name: z.string().min(2).max(100),
        password: z.string().min(12, 'Password must be at least 12 characters'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { ipAddress, userAgent } = getClientInfo(ctx.req);

      ctx.logger.info('Invitation acceptance attempt');

      // Find invitation
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { token: input.token },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!invitation) {
        ctx.logger.warn('Invitation not found');
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid invitation token',
        });
      }

      // Check if expired
      if (invitation.expiresAt < new Date()) {
        ctx.logger.warn({ email: invitation.email }, 'Invitation expired');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This invitation has expired. Please request a new one.',
        });
      }

      // Check if already accepted
      if (invitation.acceptedAt) {
        ctx.logger.warn({ email: invitation.email }, 'Invitation already accepted');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This invitation has already been accepted.',
        });
      }

      // Check if user already exists
      const existingUser = await ctx.prisma.user.findFirst({
        where: {
          email: invitation.email,
          organizationId: invitation.organizationId,
        },
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A user with this email already exists in this organization.',
        });
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Create user and mark invitation as accepted
      const result = await ctx.prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            organizationId: invitation.organizationId,
            email: invitation.email,
            passwordHash,
            name: input.name,
            role: invitation.role,
            emailVerified: true, // Auto-verify for invitations
            emailVerifiedAt: new Date(),
            status: 'ACTIVE',
          },
        });

        // Mark invitation as accepted
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        });

        return { user };
      });

      // Send welcome email
      const welcomeResult = await sendWelcomeEmailService(invitation.email, input.name, invitation.organization.name);
      if (!welcomeResult.success) {
        ctx.logger.warn({ email: invitation.email, error: welcomeResult.error }, 'Failed to send welcome email');
      }

      // Create session
      await createSession(
        result.user.id,
        result.user.email,
        result.user.role,
        invitation.organizationId,
        invitation.organization.slug
      );

      // Log successful registration
      ctx.logger.info({ userId: result.user.id, organizationId: invitation.organizationId }, 'Invitation accepted');
      await auditAuthEvent('LOGIN_SUCCESS', result.user.id, result.user.email, ipAddress, userAgent, {
        organizationId: invitation.organizationId,
        role: result.user.role,
        via: 'invitation',
      });

      return {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        organization: invitation.organization,
      };
    }),

  /**
   * Get invitation details (public)
   */
  getInvitation: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      ctx.logger.info('Fetching invitation details');

      const invitation = await ctx.prisma.invitation.findUnique({
        where: { token: input.token },
        include: {
          organization: {
            select: {
              name: true,
              logo: true,
            },
          },
          invitedBy: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        });
      }

      const isExpired = invitation.expiresAt < new Date();
      const isAccepted = !!invitation.acceptedAt;

      return {
        email: invitation.email,
        organizationName: invitation.organization.name,
        organizationLogo: invitation.organization.logo,
        role: invitation.role,
        invitedByName: invitation.invitedBy.name,
        expiresAt: invitation.expiresAt,
        isExpired,
        isAccepted,
      };
    }),

  // ============================================================================
  // Existing procedures (demo login, logout, etc.)
  // ============================================================================

  /**
   * Login procedure - demo authentication without password
   * NOTE: This is for demo purposes only. Use loginWithPassword for production.
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email format'),
        role: z.enum(['EMPLOYEE', 'MANAGER', 'COWORKER']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      ctx.logger.info({ email: input.email }, 'Demo login attempt');

      const { ipAddress, userAgent } = getClientInfo(ctx.req);

      // Check IP-based lockout first (protects against distributed attacks)
      const ipLocked = await checkIpLockout(ipAddress);
      if (ipLocked) {
        ctx.logger.warn({ ipAddress }, 'IP address temporarily blocked');
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many login attempts from this IP. Please try again later.',
        });
      }

      // Check account lockout
      const lockoutStatus = await checkAccountLockout(input.email);
      if (lockoutStatus.isLocked) {
        const remainingMinutes = lockoutStatus.lockoutEndsAt
          ? Math.ceil((lockoutStatus.lockoutEndsAt.getTime() - Date.now()) / 60000)
          : LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES;

        ctx.logger.warn(
          { email: input.email, lockoutEndsAt: lockoutStatus.lockoutEndsAt },
          'Account locked due to too many failed attempts'
        );

        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Account temporarily locked due to too many failed login attempts. Please try again in ${remainingMinutes} minutes.`,
        });
      }

      // Find user by email (exclude soft-deleted users)
      const user = await ctx.prisma.user.findFirst({
        where: {
          email: input.email,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          title: true,
          avatar: true,
          organizationId: true,
          organization: {
            select: {
              slug: true,
            },
          },
        },
      });

      // If user not found, record failed attempt and throw
      if (!user) {
        await recordLoginAttempt(input.email, false, ipAddress, userAgent);

        ctx.logger.warn({ email: input.email }, 'Login failed: user not found');
        logAuthEvent('login_failed', undefined, { email: input.email, reason: 'user_not_found' });

        // Use generic message to prevent user enumeration
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials.',
        });
      }

      // Record successful login
      await recordLoginAttempt(input.email, true, ipAddress, userAgent);

      // For demo purposes, allow role override if provided
      const roleToUse = input.role || user.role;

      // Create session
      await createSession(user.id, user.email, roleToUse, user.organizationId, user.organization.slug);

      ctx.logger.info({ userId: user.id, role: roleToUse }, 'Demo login successful');
      logAuthEvent('login_success', user.id, { email: input.email, role: roleToUse, demo: true });

      return {
        ...user,
        role: roleToUse,
      };
    }),

  /**
   * Logout procedure
   */
  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      ctx.logger.info('Logging out');

      await deleteSession();

      logAuthEvent('logout', ctx.session.userId);
      ctx.logger.info('Logout successful');

      return { success: true };
    }),

  /**
   * Get current user
   */
  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await findOrThrow(
        ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.userId,
            deletedAt: null,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            department: true,
            title: true,
            bio: true,
            avatar: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
              },
            },
          },
        }),
        'User',
        ctx.session.userId
      );

      // Return user with current session role (may differ from DB role for demo)
      return {
        ...user,
        role: ctx.session.role,
      };
    }),

  /**
   * Switch role - demo feature
   */
  switchRole: protectedProcedure
    .input(
      z.object({
        role: z.enum(['EMPLOYEE', 'MANAGER', 'COWORKER']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      ctx.logger.info({
        oldRole: ctx.session.role,
        newRole: input.role,
      }, 'Switching role');

      // Get user with organization info
      const user = await findOrThrow(
        ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.userId,
            deletedAt: null,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            department: true,
            title: true,
            avatar: true,
            organizationId: true,
            organization: {
              select: {
                slug: true,
              },
            },
          },
        }),
        'User',
        ctx.session.userId
      );

      // Update session with new role
      await createSession(
        ctx.session.userId,
        ctx.session.email,
        input.role,
        user.organizationId,
        user.organization.slug
      );

      ctx.logger.info({
        oldRole: ctx.session.role,
        newRole: input.role,
      }, 'Role switched successfully');

      return {
        ...user,
        role: input.role,
      };
    }),

  /**
   * Get connected OAuth providers for the current user
   */
  getConnectedProviders: protectedProcedure.query(async ({ ctx }) => {
    ctx.logger.info({ userId: ctx.session.userId }, 'Fetching connected OAuth providers');

    const oauthAccounts = await ctx.prisma.oAuthAccount.findMany({
      where: {
        userId: ctx.session.userId,
      },
      select: {
        id: true,
        provider: true,
        createdAt: true,
      },
    });

    // Check if user has a password set (to determine if they can disconnect all providers)
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.userId },
      select: { passwordHash: true },
    });

    return {
      providers: oauthAccounts.map((account) => ({
        id: account.id,
        provider: account.provider,
        connectedAt: account.createdAt,
      })),
      hasPassword: !!user?.passwordHash,
    };
  }),

  /**
   * Disconnect an OAuth provider from the current user
   */
  disconnectProvider: protectedProcedure
    .input(
      z.object({
        provider: z.enum(['google', 'github']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      ctx.logger.info(
        { userId: ctx.session.userId, provider: input.provider },
        'Disconnecting OAuth provider'
      );

      // Get user with password and OAuth accounts
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.userId },
        select: {
          passwordHash: true,
          oauthAccounts: {
            select: {
              id: true,
              provider: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Check if user can disconnect this provider
      const hasPassword = !!user.passwordHash;
      const otherProviders = user.oauthAccounts.filter(
        (account) => account.provider !== input.provider
      );

      // User must have either a password or another OAuth provider to disconnect
      if (!hasPassword && otherProviders.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Cannot disconnect this provider. You need at least one login method (password or another OAuth provider).',
        });
      }

      // Find and delete the OAuth account
      const account = user.oauthAccounts.find(
        (a) => a.provider === input.provider
      );

      if (!account) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'This provider is not connected to your account',
        });
      }

      await ctx.prisma.oAuthAccount.delete({
        where: { id: account.id },
      });

      ctx.logger.info(
        { userId: ctx.session.userId, provider: input.provider },
        'OAuth provider disconnected successfully'
      );

      return { success: true };
    }),
});
