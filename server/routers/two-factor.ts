import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  generateTwoFactorSecret,
  generateQRCode,
  verifyTOTP,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
} from '@/lib/auth/two-factor';
import { encrypt, decrypt } from '@/lib/encryption';

/**
 * Two-Factor Authentication Router
 *
 * Handles TOTP-based 2FA operations:
 * - Setup: Generate secret and QR code
 * - Enable: Verify code and activate 2FA
 * - Disable: Turn off 2FA with verification
 * - Status: Check if 2FA is enabled
 * - Regenerate backup codes: Generate new backup codes
 */
export const twoFactorRouter = router({
  /**
   * Initialize 2FA setup
   * Generates a new TOTP secret and QR code for the user
   */
  setup: protectedProcedure.mutation(async ({ ctx }) => {
    // SECURITY: Ensure user exists AND belongs to current organization
    const user = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.session.userId,
        organizationId: ctx.session.organizationId, // Enforce organization boundary
      },
      select: { email: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '2FA is already enabled. Please disable it first if you want to reconfigure.',
      });
    }

    // Generate new TOTP secret
    const secret = generateTwoFactorSecret();
    const qrCode = await generateQRCode(user.email, secret);

    // Store encrypted secret temporarily (not enabled yet until verification)
    // SECURITY: Include organizationId in where clause for defense-in-depth
    await ctx.prisma.user.updateMany({
      where: {
        id: ctx.session.userId,
        organizationId: ctx.session.organizationId,
      },
      data: { twoFactorSecret: encrypt(secret) },
    });

    ctx.logger.info({ userId: ctx.session.userId }, '2FA setup initiated');

    return {
      qrCode, // QR code for easy scanning
      secret, // Secret for manual entry
    };
  }),

  /**
   * Verify and enable 2FA
   * User must provide a valid TOTP code to confirm setup
   */
  enable: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      // SECURITY: Ensure user exists AND belongs to current organization
      const user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.userId,
          organizationId: ctx.session.organizationId,
        },
        select: { twoFactorSecret: true, twoFactorEnabled: true },
      });

      if (!user || !user.twoFactorSecret) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Please start 2FA setup first by calling the setup endpoint.',
        });
      }

      if (user.twoFactorEnabled) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '2FA is already enabled.',
        });
      }

      // Decrypt and verify the TOTP code
      const secret = decrypt(user.twoFactorSecret);
      if (!verifyTOTP(input.code, secret)) {
        ctx.logger.warn({ userId: ctx.session.userId }, '2FA enable failed: invalid code');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid verification code. Please try again.',
        });
      }

      // Generate backup codes
      const backupCodes = generateBackupCodes(10);
      const hashedCodes = await hashBackupCodes(backupCodes);

      // Enable 2FA and store hashed backup codes
      // SECURITY: Include organizationId in where clause
      await ctx.prisma.user.updateMany({
        where: {
          id: ctx.session.userId,
          organizationId: ctx.session.organizationId,
        },
        data: {
          twoFactorEnabled: true,
          backupCodes: hashedCodes,
        },
      });

      ctx.logger.info({ userId: ctx.session.userId }, '2FA enabled successfully');

      // Return plain backup codes (shown only once)
      return { backupCodes };
    }),

  /**
   * Disable 2FA
   * Requires verification with either TOTP code or backup code
   */
  disable: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // SECURITY: Ensure user exists AND belongs to current organization
      const user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.userId,
          organizationId: ctx.session.organizationId,
        },
        select: { twoFactorEnabled: true, twoFactorSecret: true, backupCodes: true },
      });

      if (!user || !user.twoFactorEnabled) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '2FA is not enabled.',
        });
      }

      // Try to verify as TOTP code first
      const secret = decrypt(user.twoFactorSecret!);
      const isValidTOTP = verifyTOTP(input.code, secret);

      let verified = isValidTOTP;

      // If TOTP fails, try as backup code
      if (!isValidTOTP && user.backupCodes && user.backupCodes.length > 0) {
        const { valid } = await verifyBackupCode(input.code, user.backupCodes);
        verified = valid;
      }

      if (!verified) {
        ctx.logger.warn({ userId: ctx.session.userId }, '2FA disable failed: invalid code');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid verification code or backup code.',
        });
      }

      // Disable 2FA and clear all related data
      // SECURITY: Include organizationId in where clause
      await ctx.prisma.user.updateMany({
        where: {
          id: ctx.session.userId,
          organizationId: ctx.session.organizationId,
        },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: [],
        },
      });

      ctx.logger.info({ userId: ctx.session.userId }, '2FA disabled successfully');

      return { success: true };
    }),

  /**
   * Get 2FA status
   * Check if 2FA is enabled for the current user
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    // SECURITY: Ensure user exists AND belongs to current organization
    const user = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.session.userId,
        organizationId: ctx.session.organizationId,
      },
      select: { twoFactorEnabled: true, backupCodes: true },
    });

    return {
      enabled: user?.twoFactorEnabled ?? false,
      hasBackupCodes: (user?.backupCodes?.length ?? 0) > 0,
      backupCodesCount: user?.backupCodes?.length ?? 0,
    };
  }),

  /**
   * Regenerate backup codes
   * Creates new backup codes and invalidates old ones
   * Requires TOTP verification
   */
  regenerateBackupCodes: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      // SECURITY: Ensure user exists AND belongs to current organization
      const user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.userId,
          organizationId: ctx.session.organizationId,
        },
        select: { twoFactorEnabled: true, twoFactorSecret: true },
      });

      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '2FA is not enabled.',
        });
      }

      // Verify TOTP code
      const secret = decrypt(user.twoFactorSecret);
      if (!verifyTOTP(input.code, secret)) {
        ctx.logger.warn({ userId: ctx.session.userId }, 'Backup codes regeneration failed: invalid code');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid verification code.',
        });
      }

      // Generate new backup codes
      const backupCodes = generateBackupCodes(10);
      const hashedCodes = await hashBackupCodes(backupCodes);

      // Update user with new backup codes
      // SECURITY: Include organizationId in where clause
      await ctx.prisma.user.updateMany({
        where: {
          id: ctx.session.userId,
          organizationId: ctx.session.organizationId,
        },
        data: { backupCodes: hashedCodes },
      });

      ctx.logger.info({ userId: ctx.session.userId }, 'Backup codes regenerated successfully');

      return { backupCodes };
    }),
});
