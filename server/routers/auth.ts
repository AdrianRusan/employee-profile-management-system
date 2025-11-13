import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { createSession, deleteSession } from '@/lib/session';
import { findOrThrow } from '@/lib/errors';
import { logAuthEvent } from '@/lib/logger';
import { rateLimit, getRateLimitIdentifier, checkRateLimit } from '@/lib/rate-limit';

export const authRouter = router({
  // Login procedure - demo authentication without password
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email format'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      ctx.logger.info({ email: input.email }, 'Login attempt');

      // Rate limiting (5 login attempts per 15 minutes)
      const identifier = getRateLimitIdentifier(ctx.req);
      const rateLimitCheck = await checkRateLimit(rateLimit.login, identifier, 'login');
      if (!rateLimitCheck.allowed) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many login attempts. Please try again later.',
        });
      }

      // Find user by email (exclude soft-deleted users)
      const user = await findOrThrow(
        ctx.prisma.user.findFirst({
          where: {
            email: input.email,
            deletedAt: null
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            department: true,
            title: true,
            avatar: true,
          },
        }),
        'User with this email'
      );

      // Create session with user's database role
      await createSession(user.id, user.email, user.role);

      ctx.logger.info({ userId: user.id, role: user.role }, 'Login successful');
      logAuthEvent('login_success', user.id, { email: input.email, role: user.role });

      return user;
    }),

  // Logout procedure
  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      ctx.logger.info('Logging out');

      await deleteSession();

      logAuthEvent('logout', ctx.session.userId);
      ctx.logger.info('Logout successful');

      return { success: true };
    }),

  // Get current user
  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await findOrThrow(
        ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.userId,
            deletedAt: null
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            department: true,
            title: true,
            avatar: true,
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

  // Switch role - demo feature
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

      // Update session with new role
      await createSession(ctx.session.userId, ctx.session.email, input.role);

      // Return updated user (exclude soft-deleted users)
      const user = await findOrThrow(
        ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.userId,
            deletedAt: null
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            department: true,
            title: true,
            avatar: true,
          },
        }),
        'User',
        ctx.session.userId
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
});
