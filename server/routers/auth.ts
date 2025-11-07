import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { createSession, deleteSession } from '@/lib/session';
import { AppErrors, findOrThrow } from '@/lib/errors';
import { logAuthEvent } from '@/lib/logger';

export const authRouter = router({
  // Login procedure - demo authentication without password
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email format'),
        role: z.enum(['EMPLOYEE', 'MANAGER', 'COWORKER']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      ctx.logger.info({ email: input.email }, 'Login attempt');

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

      // For demo purposes, allow role override if provided
      const roleToUse = input.role || user.role;

      // Create session
      await createSession(user.id, user.email, roleToUse);

      ctx.logger.info({ userId: user.id, role: roleToUse }, 'Login successful');
      logAuthEvent('login_success', user.id, { email: input.email, role: roleToUse });

      return {
        ...user,
        role: roleToUse,
      };
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
