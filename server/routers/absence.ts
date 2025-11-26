import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import {
  absenceRequestSchema,
  updateAbsenceStatusSchema,
} from '@/lib/validations/absence';
import { paginationSchema } from '@/lib/pagination';
import { container } from '@/src/infrastructure/di/container';
import { AbsenceStatus } from '@/src/domain/entities/Absence';
import {
  sendAbsenceStatusEmail,
  sendAbsenceRequestEmail,
} from '@/lib/email/send-emails';

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
      const absence = await container.createAbsenceUseCase.execute({
        userId: ctx.session.userId,
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason,
      });

      // Get employee info for email
      const employee = await container.userRepository.findById(ctx.session.userId);

      // Notify managers via email about new absence request
      if (employee) {
        // Find managers in the same department or all managers if no department
        const { users: managers } = await container.userRepository.findAll({
          department: employee.department || undefined,
        });

        // Filter to only managers
        const departmentManagers = managers.filter((u) => u.isManager());

        // Send emails and notifications in parallel for better performance
        const notificationPromises = departmentManagers.map(async (manager) => {
          // Send email (non-blocking, log failures)
          const emailPromise = sendAbsenceRequestEmail(
            manager.email.value,
            manager.name,
            employee.name,
            input.startDate,
            input.endDate,
            input.reason,
            absence.id
          ).then((emailResult) => {
            if (!emailResult.success) {
              ctx.logger.warn(
                { managerId: manager.id, error: emailResult.error },
                'Failed to send absence request email to manager'
              );
            }
          });

          // Create notification
          const notificationPromise = container.createNotificationUseCase.execute({
            userId: manager.id,
            type: 'ABSENCE_PENDING',
            title: 'New Time Off Request',
            message: `${employee.name} has requested time off`,
            data: { absenceId: absence.id, employeeId: ctx.session.userId },
          });

          return Promise.all([emailPromise, notificationPromise]);
        });

        // Wait for all parallel operations (use allSettled to not fail on individual errors)
        await Promise.allSettled(notificationPromises);
      }

      return absence;
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
   * Requires MANAGER role to view all team absences
   */
  getAll: managerProcedure
    .input(
      paginationSchema.extend({
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get current user to check department
      const currentUser = await container.userRepository.findById(ctx.session.userId);

      // Determine if we need to filter by department
      // Only managers (not admins) should be filtered by their department
      const shouldFilterByDepartment =
        ctx.session.role === 'MANAGER' &&
        currentUser?.department;

      return container.getAbsencesUseCase.execute({
        status: input.status ? AbsenceStatus[input.status] : undefined,
        skip: input.skip,
        take: input.limit,
        includeUser: true,
        department: shouldFilterByDepartment ? currentUser.department : undefined,
      });
    }),

  /**
   * Update absence request status (approve/reject)
   * Requires MANAGER role - enforced at router level for early rejection
   */
  updateStatus: managerProcedure
    .input(updateAbsenceStatusSchema)
    .mutation(async ({ ctx, input }) => {
      let result;
      let notificationType: 'ABSENCE_APPROVED' | 'ABSENCE_REJECTED';
      let notificationTitle: string;
      let notificationMessage: string;

      if (input.status === 'APPROVED') {
        result = await container.approveAbsenceUseCase.execute({
          absenceId: input.id,
          approverId: ctx.session.userId,
        });
        notificationType = 'ABSENCE_APPROVED';
        notificationTitle = 'Time Off Approved';
        notificationMessage = `Your time off request has been approved`;
      } else if (input.status === 'REJECTED') {
        result = await container.rejectAbsenceUseCase.execute({
          absenceId: input.id,
          rejectorId: ctx.session.userId,
        });
        notificationType = 'ABSENCE_REJECTED';
        notificationTitle = 'Time Off Rejected';
        notificationMessage = `Your time off request has been rejected`;
      } else {
        throw new Error('Invalid status');
      }

      // Create notification for the absence request owner
      await container.createNotificationUseCase.execute({
        userId: result.userId,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        data: { absenceId: input.id },
      });

      // Send email notification to the employee about status change
      const employee = await container.userRepository.findById(result.userId);
      const manager = await container.userRepository.findById(ctx.session.userId);

      if (employee && manager) {
        const emailResult = await sendAbsenceStatusEmail(
          employee.email.value,
          employee.name,
          input.status === 'APPROVED' ? 'approved' : 'rejected',
          result.startDate,
          result.endDate,
          manager.name
        );
        if (!emailResult.success) {
          ctx.logger.warn(
            { employeeId: result.userId, error: emailResult.error },
            'Failed to send absence status email'
          );
        }
      }

      return result;
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
   * Uses optimized repository query that filters by date at database level
   */
  getUpcoming: protectedProcedure.query(async () => {
    // Use repository's optimized findUpcoming() instead of fetching all and filtering in-memory
    const absences = await container.absenceRepository.findUpcoming(10);

    return absences.map((absence) => ({
      id: absence.id,
      userId: absence.userId,
      startDate: absence.dateRange.start,
      endDate: absence.dateRange.end,
      reason: absence.reason,
      status: absence.status,
      workingDays: absence.getWorkingDays(),
      totalDays: absence.getTotalDays(),
      createdAt: absence.createdAt,
      updatedAt: absence.updatedAt,
    }));
  }),
});
