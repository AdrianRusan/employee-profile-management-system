import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { createSession, deleteSession } from '@/lib/session';

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
      // Find user by email
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          title: true,
          avatar: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found with this email'
        });
      }

      // For demo purposes, allow role override if provided
      const roleToUse = input.role || user.role;

      // Create session
      await createSession(user.id, roleToUse);

      return {
        ...user,
        role: roleToUse,
      };
    }),

  // Logout procedure
  logout: protectedProcedure
    .mutation(async () => {
      await deleteSession();
      return { success: true };
    }),

  // Get current user
  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          title: true,
          avatar: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }

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
      // Update session with new role
      await createSession(ctx.session.userId, input.role);

      // Return updated user
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          title: true,
          avatar: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }

      return {
        ...user,
        role: input.role,
      };
    }),
});
