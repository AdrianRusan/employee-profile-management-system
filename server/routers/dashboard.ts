import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { USER_FEEDBACK_SELECT } from '@/lib/prisma/selects';

/**
 * Dashboard router for dashboard-specific data aggregation
 * Handles recent activity feeds and dashboard metrics
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
      const { limit } = input;
      const userId = ctx.session.userId;

      ctx.logger.info({ userId, limit }, 'Fetching recent activity');

      // Fetch recent feedback received (last 5)
      const recentFeedback = await ctx.prisma.feedback.findMany({
        where: {
          receiverId: userId,
          deletedAt: null,
        },
        include: {
          giver: {
            select: USER_FEEDBACK_SELECT,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: Math.ceil(limit / 2), // Take half for feedback
      });

      // Fetch recent absence requests with status updates
      const recentAbsences = await ctx.prisma.absenceRequest.findMany({
        where: {
          userId,
          deletedAt: null,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: Math.ceil(limit / 2), // Take half for absences
      });

      // Transform feedback into activity items
      const feedbackActivity = recentFeedback.map((feedback) => ({
        id: feedback.id,
        type: 'feedback' as const,
        title: 'Received feedback',
        description: `${feedback.giver.name} gave you feedback`,
        timestamp: feedback.createdAt,
        metadata: {
          giverName: feedback.giver.name,
          isPolished: feedback.isPolished,
        },
      }));

      // Transform absences into activity items
      const absenceActivity = recentAbsences.map((absence) => ({
        id: absence.id,
        type: 'absence' as const,
        title: `Time off request ${absence.status.toLowerCase()}`,
        description: `Your time off from ${absence.startDate.toLocaleDateString()} to ${absence.endDate.toLocaleDateString()} was ${absence.status.toLowerCase()}`,
        timestamp: absence.updatedAt,
        metadata: {
          status: absence.status,
          startDate: absence.startDate,
          endDate: absence.endDate,
          reason: absence.reason,
        },
      }));

      // Combine and sort by timestamp (most recent first)
      const allActivity = [...feedbackActivity, ...absenceActivity].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      // Return the most recent items up to the limit
      const recentActivity = allActivity.slice(0, limit);

      ctx.logger.info(
        {
          userId,
          activityCount: recentActivity.length,
          feedbackCount: feedbackActivity.length,
          absenceCount: absenceActivity.length,
        },
        'Recent activity fetched successfully'
      );

      return recentActivity;
    }),

  /**
   * Get dashboard metrics for the current user
   * Returns role-specific metrics (different data for employees vs managers)
   */
  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId;
    const userRole = ctx.session.role;

    ctx.logger.info({ userId, userRole }, 'Fetching dashboard metrics');

    // Common metrics for all users
    const feedbackReceived = await ctx.prisma.feedback.count({
      where: {
        receiverId: userId,
        deletedAt: null,
      },
    });

    const feedbackGiven = await ctx.prisma.feedback.count({
      where: {
        giverId: userId,
        deletedAt: null,
      },
    });

    const absenceStats = await ctx.prisma.absenceRequest.groupBy({
      by: ['status'],
      where: {
        userId,
        deletedAt: null,
      },
      _count: true,
    });

    const totalAbsences = absenceStats.reduce((sum, stat) => sum + stat._count, 0);
    const pendingAbsences = absenceStats.find((s) => s.status === 'PENDING')?._count || 0;
    const approvedAbsences = absenceStats.find((s) => s.status === 'APPROVED')?._count || 0;

    // Manager-specific metrics
    if (userRole === 'MANAGER') {
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { department: true },
      });

      const teamSize = await ctx.prisma.user.count({
        where: {
          department: user?.department || '',
          deletedAt: null,
        },
      });

      const pendingApprovals = await ctx.prisma.absenceRequest.count({
        where: {
          status: 'PENDING',
          deletedAt: null,
        },
      });

      const teamMembers = await ctx.prisma.user.findMany({
        where: {
          department: user?.department || '',
          deletedAt: null,
        },
        select: {
          performanceRating: true,
        },
      });

      const ratingsWithValues = teamMembers.filter((m) => m.performanceRating !== null);
      const avgPerformance =
        ratingsWithValues.length > 0
          ? ratingsWithValues.reduce((sum, m) => sum + (m.performanceRating || 0), 0) /
            ratingsWithValues.length
          : null;

      ctx.logger.info({ userId, teamSize, pendingApprovals }, 'Manager metrics fetched');

      return {
        feedbackReceived,
        feedbackGiven,
        totalAbsences,
        pendingAbsences,
        approvedAbsences,
        // Manager-specific
        teamSize,
        pendingApprovals,
        avgPerformance: avgPerformance ? Math.round(avgPerformance * 10) / 10 : null,
      };
    }

    // Employee metrics
    ctx.logger.info({ userId, feedbackReceived, feedbackGiven }, 'Employee metrics fetched');

    return {
      feedbackReceived,
      feedbackGiven,
      totalAbsences,
      pendingAbsences,
      approvedAbsences,
    };
  }),

  /**
   * Get feedback statistics for charts
   * Returns polished vs unpolished feedback counts
   */
  getFeedbackStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId;

    const polishedCount = await ctx.prisma.feedback.count({
      where: {
        receiverId: userId,
        isPolished: true,
        deletedAt: null,
      },
    });

    const unpolishedCount = await ctx.prisma.feedback.count({
      where: {
        receiverId: userId,
        isPolished: false,
        deletedAt: null,
      },
    });

    return {
      polished: polishedCount,
      unpolished: unpolishedCount,
      total: polishedCount + unpolishedCount,
    };
  }),

  /**
   * Get absence statistics for charts
   * Returns breakdown by status
   */
  getAbsenceStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId;

    const stats = await ctx.prisma.absenceRequest.groupBy({
      by: ['status'],
      where: {
        userId,
        deletedAt: null,
      },
      _count: true,
    });

    const pending = stats.find((s) => s.status === 'PENDING')?._count || 0;
    const approved = stats.find((s) => s.status === 'APPROVED')?._count || 0;
    const rejected = stats.find((s) => s.status === 'REJECTED')?._count || 0;

    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    };
  }),

  /**
   * Get upcoming absences for timeline display
   * Returns approved absences in the next 60 days
   */
  getUpcomingAbsences: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId;
    const today = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);

    const upcomingAbsences = await ctx.prisma.absenceRequest.findMany({
      where: {
        userId,
        status: 'APPROVED',
        startDate: {
          gte: today,
          lte: sixtyDaysFromNow,
        },
        deletedAt: null,
      },
      orderBy: {
        startDate: 'asc',
      },
      take: 10,
    });

    return upcomingAbsences;
  }),
});
