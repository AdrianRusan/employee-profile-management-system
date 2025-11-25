import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { container } from '@/src/infrastructure/di/container';
import { AbsenceStatus } from '@/src/domain/entities/Absence';

/**
 * Dashboard metrics response interface
 */
interface DashboardMetricsResponse {
  feedbackReceived: number;
  feedbackGiven: number;
  totalAbsences: number;
  pendingAbsences: number;
  approvedAbsences: number;
  teamSize?: number;
  pendingApprovals?: number;
  avgPerformance?: number | null;
}

/**
 * Dashboard router for dashboard-specific data aggregation
 * Uses Clean Architecture with DI Container and Use Cases
 *
 * REFACTORED: Now uses dependency injection container for all operations.
 * Each endpoint delegates to a specific use case through the container.
 */
export const dashboardRouter = router({
  /**
   * Get recent activity for the current user
   * Combines recent feedback received and absence request status changes
   */
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      const metrics = await container.getDashboardMetricsUseCase.execute({ userId });

      // Transform recent absences and feedback into activity items
      const feedbackActivity = metrics.recentFeedback.map((feedback) => ({
        id: feedback.id,
        type: 'feedback' as const,
        title: 'Received feedback',
        description: `Received feedback`,
        timestamp: feedback.createdAt.toISOString(),
        metadata: {
          giverId: feedback.giverId,
          receiverId: feedback.receiverId,
        },
      }));

      const absenceActivity = metrics.recentAbsences.map((absence) => ({
        id: absence.id,
        type: 'absence' as const,
        title: `Time off request ${absence.status.toLowerCase()}`,
        description: `Your time off from ${new Date(absence.startDate).toLocaleDateString()} to ${new Date(absence.endDate).toLocaleDateString()} was ${absence.status.toLowerCase()}`,
        timestamp: new Date(absence.startDate).toISOString(),
        metadata: {
          status: absence.status,
          startDate: absence.startDate,
          endDate: absence.endDate,
          totalDays: absence.totalDays,
        },
      }));

      // Combine and sort by timestamp (most recent first)
      const allActivity = [...feedbackActivity, ...absenceActivity].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Return the most recent items up to the limit
      return allActivity.slice(0, input.limit);
    }),

  /**
   * Get dashboard metrics for the current user
   * Returns role-specific metrics (different data for employees vs managers)
   */
  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    const metrics = await container.getDashboardMetricsUseCase.execute({
      userId: ctx.session.userId,
    });

    // Transform to match the expected API response format
    const response: DashboardMetricsResponse = {
      feedbackReceived: metrics.feedback.totalReceived,
      feedbackGiven: metrics.feedback.totalGiven,
      totalAbsences: metrics.absences.totalDays,
      pendingAbsences: metrics.absences.pendingRequests,
      approvedAbsences: metrics.absences.approvedDays,
    };

    // Add manager-specific metrics if available
    if (metrics.managerMetrics) {
      response.teamSize = metrics.managerMetrics.teamSize;
      response.pendingApprovals = metrics.managerMetrics.pendingApprovals;
      response.avgPerformance = metrics.managerMetrics.avgPerformance;
    }

    return response;
  }),

  /**
   * Get feedback statistics for charts
   * Returns polished vs unpolished feedback counts
   */
  getFeedbackStats: protectedProcedure.query(async ({ ctx }) => {
    const metrics = await container.getDashboardMetricsUseCase.execute({
      userId: ctx.session.userId,
    });

    const polished = metrics.feedback.polishedCount;
    const total = metrics.feedback.totalReceived;
    const unpolished = total - polished;

    return {
      polished,
      unpolished,
      total,
    };
  }),

  /**
   * Get absence statistics for charts
   * Returns breakdown by status
   */
  getAbsenceStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await container.getAbsenceStatisticsUseCase.execute({
      userId: ctx.session.userId,
    });

    return {
      pending: stats.pendingRequests,
      approved: stats.approvedDays,
      rejected: stats.rejectedRequests,
      total: stats.totalRequests,
    };
  }),

  /**
   * Get upcoming absences for timeline display
   * Returns approved absences in the next 60 days
   */
  getUpcomingAbsences: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const result = await container.getAbsencesUseCase.execute({
      userId: ctx.session.userId,
      status: AbsenceStatus.APPROVED,
    });

    // Filter for future absences and limit to 10
    const upcomingAbsences = result.absences
      .filter((absence) => new Date(absence.startDate) >= today)
      .slice(0, 10);

    return upcomingAbsences;
  }),
});
