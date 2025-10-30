import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import {
  absenceRequestSchema,
  updateAbsenceStatusSchema,
} from '@/lib/validations/absence';

/**
 * Absence router for time-off request management
 * Handles creating, viewing, and managing absence requests
 */
export const absenceRouter = router({
  /**
   * Create new absence request
   * Available to all authenticated users
   * Validates no overlapping absences exist
   */
  create: protectedProcedure
    .input(absenceRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const { startDate, endDate, reason } = input;

      // Check for overlapping absence requests
      const overlap = await ctx.prisma.absenceRequest.findFirst({
        where: {
          userId: ctx.session.userId,
          OR: [
            {
              // New request starts during existing absence
              startDate: { lte: startDate },
              endDate: { gte: startDate },
            },
            {
              // New request ends during existing absence
              startDate: { lte: endDate },
              endDate: { gte: endDate },
            },
            {
              // New request completely contains existing absence
              startDate: { gte: startDate },
              endDate: { lte: endDate },
            },
          ],
        },
      });

      if (overlap) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `You already have an absence request from ${overlap.startDate.toLocaleDateString()} to ${overlap.endDate.toLocaleDateString()}`,
        });
      }

      // Create absence request
      const absenceRequest = await ctx.prisma.absenceRequest.create({
        data: {
          startDate,
          endDate,
          reason,
          userId: ctx.session.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
              department: true,
              title: true,
            },
          },
        },
      });

      return absenceRequest;
    }),

  /**
   * Get absence requests for a specific user
   * Visible to the user themselves and managers
   */
  getForUser: protectedProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const { userId } = input;

      // Check permissions: user can view their own, managers can view all
      if (
        ctx.session.userId !== userId &&
        ctx.session.role !== 'MANAGER'
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view these absence requests',
        });
      }

      // Verify user exists
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Fetch absence requests
      const absenceRequests = await ctx.prisma.absenceRequest.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
              department: true,
              title: true,
            },
          },
        },
        orderBy: {
          startDate: 'desc',
        },
      });

      return absenceRequests;
    }),

  /**
   * Get current user's absence requests
   */
  getMy: protectedProcedure.query(async ({ ctx }) => {
    const absenceRequests = await ctx.prisma.absenceRequest.findMany({
      where: { userId: ctx.session.userId },
      orderBy: {
        startDate: 'desc',
      },
    });

    return absenceRequests;
  }),

  /**
   * Get all pending absence requests
   * Manager-only endpoint for approval workflow
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      // Only managers can view all absence requests
      if (ctx.session.role !== 'MANAGER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only managers can view all absence requests',
        });
      }

      const absenceRequests = await ctx.prisma.absenceRequest.findMany({
        where: input?.status
          ? { status: input.status }
          : undefined,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
              department: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return absenceRequests;
    }),

  /**
   * Update absence request status (approve/reject)
   * Manager-only endpoint
   */
  updateStatus: protectedProcedure
    .input(updateAbsenceStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input;

      // Only managers can approve/reject absence requests
      if (ctx.session.role !== 'MANAGER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only managers can approve or reject absence requests',
        });
      }

      // Find the absence request
      const absenceRequest = await ctx.prisma.absenceRequest.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!absenceRequest) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Absence request not found',
        });
      }

      // Update status
      const updated = await ctx.prisma.absenceRequest.update({
        where: { id },
        data: { status },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
              department: true,
              title: true,
            },
          },
        },
      });

      return updated;
    }),

  /**
   * Delete absence request
   * Users can delete their own pending requests
   * Managers can delete any pending requests
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Find the absence request
      const absenceRequest = await ctx.prisma.absenceRequest.findUnique({
        where: { id },
      });

      if (!absenceRequest) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Absence request not found',
        });
      }

      // Check permissions
      const isOwner = absenceRequest.userId === ctx.session.userId;
      const isManager = ctx.session.role === 'MANAGER';

      if (!isOwner && !isManager) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this absence request',
        });
      }

      // Only allow deletion of pending requests
      if (absenceRequest.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only pending absence requests can be deleted',
        });
      }

      // Delete the absence request
      await ctx.prisma.absenceRequest.delete({
        where: { id },
      });

      return { success: true };
    }),

  /**
   * Get absence statistics for current user
   */
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const total = await ctx.prisma.absenceRequest.count({
      where: { userId: ctx.session.userId },
    });

    const pending = await ctx.prisma.absenceRequest.count({
      where: {
        userId: ctx.session.userId,
        status: 'PENDING',
      },
    });

    const approved = await ctx.prisma.absenceRequest.count({
      where: {
        userId: ctx.session.userId,
        status: 'APPROVED',
      },
    });

    const rejected = await ctx.prisma.absenceRequest.count({
      where: {
        userId: ctx.session.userId,
        status: 'REJECTED',
      },
    });

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }),

  /**
   * Get all upcoming absences (for calendar view)
   * Shows approved absences for all users (public information)
   */
  getUpcoming: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();

    const upcomingAbsences = await ctx.prisma.absenceRequest.findMany({
      where: {
        status: 'APPROVED',
        endDate: { gte: now },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            department: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
      take: 50, // Limit to next 50 upcoming absences
    });

    return upcomingAbsences;
  }),
});
