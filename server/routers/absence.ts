import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  absenceRequestSchema,
  updateAbsenceStatusSchema,
} from '@/lib/validations/absence';
import { paginationSchema } from '@/lib/pagination';
import { Permissions, assertPermission } from '@/lib/permissions';
import { USER_ABSENCE_SELECT, USER_CARD_SELECT } from '@/lib/prisma/selects';
import { AppErrors, findOrThrow } from '@/lib/errors';
import { Prisma } from '@prisma/client';

/**
 * Absence router for time-off request management
 * Handles creating, viewing, and managing absence requests
 */
export const absenceRouter = router({
  /**
   * Create new absence request
   * Available to all authenticated users
   * Validates no overlapping absences exist
   *
   * RACE CONDITION PROTECTION:
   * Uses serializable transaction isolation to prevent concurrent requests
   * from creating overlapping absences (TOCTOU vulnerability mitigation).
   * The overlap check and insert are atomic - no gap for race conditions.
   */
  create: protectedProcedure
    .input(absenceRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const { startDate, endDate, reason } = input;

      ctx.logger.info({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason,
      }, 'Creating absence request');

      try {
        // Wrap overlap check and create in a serializable transaction
        // This prevents race conditions where two concurrent requests
        // could both pass the overlap check and create conflicting absences
        return await ctx.prisma.$transaction(
          async (tx) => {
            // Check for overlapping absence requests (only PENDING and APPROVED)
            // Rejected requests don't block new requests for the same dates
            // This query locks the relevant rows until transaction commits
            const overlap = await tx.absenceRequest.findFirst({
              where: {
                userId: ctx.session.userId,
                status: { in: ['PENDING', 'APPROVED'] }, // Only check active absences
                deletedAt: null, // Exclude soft-deleted requests
                OR: [
                  {
                    // Scenario 1: New request starts during existing absence
                    startDate: { lte: startDate },
                    endDate: { gte: startDate },
                  },
                  {
                    // Scenario 2: New request ends during existing absence
                    startDate: { lte: endDate },
                    endDate: { gte: endDate },
                  },
                  {
                    // Scenario 3: New request completely contains existing absence
                    startDate: { gte: startDate },
                    endDate: { lte: endDate },
                  },
                  {
                    // Scenario 4: Existing absence completely contains new request
                    startDate: { lte: startDate },
                    endDate: { gte: endDate },
                  },
                ],
              },
            });

            if (overlap) {
              ctx.logger.warn({
                existingStart: overlap.startDate.toISOString(),
                existingEnd: overlap.endDate.toISOString(),
                requestedStart: startDate.toISOString(),
                requestedEnd: endDate.toISOString(),
              }, 'Overlapping absence request detected');

              throw AppErrors.conflict(
                `You already have an absence request from ${overlap.startDate.toLocaleDateString()} to ${overlap.endDate.toLocaleDateString()}`
              );
            }

            // Create absence request within same transaction
            // If two transactions both reach this point, serializable isolation
            // will cause one to fail with a serialization error
            const absenceRequest = await tx.absenceRequest.create({
              data: {
                startDate,
                endDate,
                reason,
                userId: ctx.session.userId,
              },
              include: {
                user: {
                  select: USER_ABSENCE_SELECT,
                },
              },
            });

            ctx.logger.info({
              absenceId: absenceRequest.id,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            }, 'Absence request created successfully');

            return absenceRequest;
          },
          {
            // Serializable isolation prevents phantom reads and race conditions
            // Guarantees that if two transactions conflict, one will be rolled back
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5000, // Maximum time to wait for transaction to start (5 seconds)
            timeout: 10000, // Maximum time for transaction to complete (10 seconds)
          }
        );
      } catch (error) {
        // Handle database serialization failures gracefully
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // P2034: Transaction failed due to write conflict or deadlock
          // This happens when two transactions conflict in serializable mode
          if (error.code === 'P2034') {
            ctx.logger.warn({
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            }, 'Concurrent absence request conflict detected');

            throw AppErrors.conflict(
              'Another absence request is being processed. Please try again in a moment.'
            );
          }
        }
        // Re-throw other errors (validation, conflict, etc.)
        throw error;
      }
    }),

  /**
   * Get absence requests for a specific user
   * Visible to the user themselves and managers
   */
  getForUser: protectedProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const { userId } = input;

      // Check permissions using centralized permissions: user can view their own, managers can view all
      assertPermission(
        Permissions.absence.viewForUser(ctx.session, userId),
        'You do not have permission to view these absence requests'
      );

      // Verify user exists and is not deleted
      await findOrThrow(
        ctx.prisma.user.findFirst({
          where: {
            id: userId,
            deletedAt: null
          },
        }),
        'User',
        userId
      );

      // Fetch absence requests (exclude soft-deleted)
      const absenceRequests = await ctx.prisma.absenceRequest.findMany({
        where: {
          userId,
          deletedAt: null
        },
        include: {
          user: {
            select: USER_ABSENCE_SELECT,
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
      where: {
        userId: ctx.session.userId,
        deletedAt: null
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return absenceRequests;
  }),

  /**
   * Get all pending absence requests
   * Manager-only endpoint for approval workflow
   * Implements cursor-based pagination with max limit enforcement
   */
  getAll: protectedProcedure
    .input(
      paginationSchema.extend({
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Only managers can view all absence requests - using centralized permissions
      assertPermission(
        Permissions.absence.viewAll(ctx.session),
        'Only managers can view all absence requests'
      );

      const { limit, cursor, status } = input;

      // Fetch absence requests with cursor pagination (exclude soft-deleted)
      const absenceRequests = await ctx.prisma.absenceRequest.findMany({
        where: status ? { status, deletedAt: null } : { deletedAt: null },
        take: limit + 1, // Fetch one extra to determine if there are more
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          user: {
            select: USER_ABSENCE_SELECT,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Determine if there are more results
      let nextCursor: string | undefined = undefined;
      if (absenceRequests.length > limit) {
        const nextItem = absenceRequests.pop();
        nextCursor = nextItem!.id;
      }

      return {
        absenceRequests,
        nextCursor,
      };
    }),

  /**
   * Update absence request status (approve/reject)
   * Manager-only endpoint
   */
  updateStatus: protectedProcedure
    .input(updateAbsenceStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input;

      ctx.logger.info({
        absenceId: id,
        newStatus: status,
      }, 'Updating absence request status');

      // Only managers can approve/reject absence requests - using centralized permissions
      assertPermission(
        Permissions.absence.approve(ctx.session),
        'Only managers can approve or reject absence requests'
      );

      // Find the absence request
      const absenceRequest = await findOrThrow(
        ctx.prisma.absenceRequest.findUnique({
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
        }),
        'Absence request',
        id
      );

      // Update status
      const updated = await ctx.prisma.absenceRequest.update({
        where: { id },
        data: { status },
        include: {
          user: {
            select: USER_ABSENCE_SELECT,
          },
        },
      });

      ctx.logger.info({
        absenceId: id,
        oldStatus: absenceRequest.status,
        newStatus: status,
        targetUserId: absenceRequest.userId,
      }, 'Absence request status updated successfully');

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

      ctx.logger.info({ absenceId: id }, 'Deleting absence request');

      // Find the absence request
      const absenceRequest = await findOrThrow(
        ctx.prisma.absenceRequest.findUnique({
          where: { id },
        }),
        'Absence request',
        id
      );

      // Check permissions using centralized permissions
      assertPermission(
        Permissions.absence.delete(ctx.session, absenceRequest),
        'You do not have permission to delete this absence request'
      );

      // Delete the absence request
      await ctx.prisma.absenceRequest.delete({
        where: { id },
      });

      ctx.logger.info({
        absenceId: id,
        targetUserId: absenceRequest.userId,
        status: absenceRequest.status,
      }, 'Absence request deleted successfully');

      return { success: true };
    }),

  /**
   * Get absence statistics for current user
   */
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const total = await ctx.prisma.absenceRequest.count({
      where: {
        userId: ctx.session.userId,
        deletedAt: null
      },
    });

    const pending = await ctx.prisma.absenceRequest.count({
      where: {
        userId: ctx.session.userId,
        status: 'PENDING',
        deletedAt: null
      },
    });

    const approved = await ctx.prisma.absenceRequest.count({
      where: {
        userId: ctx.session.userId,
        status: 'APPROVED',
        deletedAt: null
      },
    });

    const rejected = await ctx.prisma.absenceRequest.count({
      where: {
        userId: ctx.session.userId,
        status: 'REJECTED',
        deletedAt: null
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
          select: USER_CARD_SELECT,
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
