import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  absenceRequestSchema,
  updateAbsenceStatusSchema,
} from '@/lib/validations/absence';
import { paginationSchema } from '@/lib/pagination';
import { container } from '@/src/infrastructure/di/container';
import { AbsenceStatus } from '@/src/domain/entities/Absence';

/**
 * Absence router for time-off request management
 * Uses Clean Architecture with DI Container and Use Cases
 *
 * REFACTORED: Now uses dependency injection container for all operations.
 * Each endpoint delegates to a specific use case through the container.
 */
export const absenceRouter = router({
  /**
   * Create new absence request
   */
  create: protectedProcedure
    .input(absenceRequestSchema)
    .mutation(async ({ ctx, input }) => {
      return container.createAbsenceUseCase.execute({
        userId: ctx.session.userId,
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason,
      });
    }),

  /**
   * Get absence requests for a specific user
   */
  getForUser: protectedProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Get absences for the specified user
      const result = await container.getAbsencesUseCase.execute({
        userId: input.userId,
      });
      return result.absences;
    }),

  /**
   * Get current user's absence requests
   */
  getMy: protectedProcedure.query(async ({ ctx }) => {
    const result = await container.getAbsencesUseCase.execute({
      userId: ctx.session.userId,
    });
    return result.absences;
  }),

  /**
   * Get all pending absence requests (manager-only)
   */
  getAll: protectedProcedure
    .input(
      paginationSchema.extend({
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return container.getAbsencesUseCase.execute({
        status: input.status ? AbsenceStatus[input.status] : undefined,
        skip: input.skip,
        take: input.limit,
      });
    }),

  /**
   * Update absence request status (approve/reject)
   */
  updateStatus: protectedProcedure
    .input(updateAbsenceStatusSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.status === 'APPROVED') {
        return container.approveAbsenceUseCase.execute({
          absenceId: input.id,
          approverId: ctx.session.userId,
        });
      } else if (input.status === 'REJECTED') {
        return container.rejectAbsenceUseCase.execute({
          absenceId: input.id,
          rejectorId: ctx.session.userId,
        });
      }
      throw new Error('Invalid status');
    }),

  /**
   * Delete absence request
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await container.deleteAbsenceUseCase.execute({
        absenceId: input.id,
        userId: ctx.session.userId,
      });
      return { success: true };
    }),

  /**
   * Get absence statistics for current user
   */
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    return container.getAbsenceStatisticsUseCase.execute({
      userId: ctx.session.userId,
    });
  }),

  /**
   * Get all upcoming absences (for calendar view)
   */
  getUpcoming: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const result = await container.getAbsencesUseCase.execute({
      status: AbsenceStatus.APPROVED,
    });

    // Filter for upcoming absences (starting from today)
    const upcomingAbsences = result.absences.filter(
      (absence) => new Date(absence.startDate) >= today
    );

    return upcomingAbsences.slice(0, 10);
  }),
});
