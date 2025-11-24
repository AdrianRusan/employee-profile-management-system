import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  absenceRequestSchema,
  updateAbsenceStatusSchema,
} from '@/lib/validations/absence';
import { paginationSchema } from '@/lib/pagination';
import { AbsenceService } from '@/lib/services/absenceService';

/**
 * Absence router for time-off request management
 * Delegates all business logic to AbsenceService (Clean Architecture)
 *
 * REFACTORED: Reduced from 478 lines to ~150 lines by extracting business logic
 * to the service layer. Each endpoint follows the thin controller pattern.
 */
export const absenceRouter = router({
  /**
   * Create new absence request
   */
  create: protectedProcedure
    .input(absenceRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const absenceService = new AbsenceService(ctx.prisma, ctx.logger);
      return absenceService.processAbsenceRequest(ctx.session, input);
    }),

  /**
   * Get absence requests for a specific user
   */
  getForUser: protectedProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const absenceService = new AbsenceService(ctx.prisma, ctx.logger);
      return absenceService.getAbsencesForUser(ctx.session, input.userId);
    }),

  /**
   * Get current user's absence requests
   */
  getMy: protectedProcedure.query(async ({ ctx }) => {
    const absenceService = new AbsenceService(ctx.prisma, ctx.logger);
    return absenceService.getMyAbsences(ctx.session);
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
      const absenceService = new AbsenceService(ctx.prisma, ctx.logger);
      return absenceService.getAllAbsences(ctx.session, input);
    }),

  /**
   * Update absence request status (approve/reject)
   */
  updateStatus: protectedProcedure
    .input(updateAbsenceStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const absenceService = new AbsenceService(ctx.prisma, ctx.logger);
      return absenceService.updateAbsenceStatus(ctx.session, input.id, input.status);
    }),

  /**
   * Delete absence request
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const absenceService = new AbsenceService(ctx.prisma, ctx.logger);
      return absenceService.deleteAbsence(ctx.session, input.id);
    }),

  /**
   * Get absence statistics for current user
   */
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const absenceService = new AbsenceService(ctx.prisma, ctx.logger);
    return absenceService.getAbsenceStats(ctx.session.userId);
  }),

  /**
   * Get all upcoming absences (for calendar view)
   */
  getUpcoming: protectedProcedure.query(async ({ ctx }) => {
    const absenceService = new AbsenceService(ctx.prisma, ctx.logger);
    return absenceService.getUpcomingAbsences();
  }),
});
