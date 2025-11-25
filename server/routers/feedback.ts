import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  feedbackSchema,
  polishFeedbackSchema,
  deleteFeedbackSchema,
  getFeedbackForUserSchema,
} from '@/lib/validations/feedback';
import { container } from '@/src/infrastructure/di/container';

/**
 * Feedback router for peer feedback management
 * Uses Clean Architecture with DI Container and Use Cases
 *
 * REFACTORED: Now uses dependency injection container for all operations.
 * Each endpoint delegates to a specific use case through the container.
 */
export const feedbackRouter = router({
  /**
   * Create new feedback entry
   */
  create: protectedProcedure
    .input(
      feedbackSchema.extend({
        polishedContent: z.string().optional(),
        isPolished: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return container.createFeedbackUseCase.execute({
        giverId: ctx.session.userId,
        receiverId: input.receiverId,
        content: input.content,
        polishedContent: input.polishedContent,
        isPolished: input.isPolished,
      });
    }),

  /**
   * Get all feedback for a specific user
   */
  getForUser: protectedProcedure
    .input(getFeedbackForUserSchema)
    .query(async ({ ctx, input }) => {
      const result = await container.getFeedbackUseCase.execute({
        userId: ctx.session.userId,
        targetUserId: input.userId,
        asReceiver: true,
      });
      return result.feedback;
    }),

  /**
   * Get feedback given by current user
   */
  getGiven: protectedProcedure.query(async ({ ctx }) => {
    const result = await container.getFeedbackUseCase.execute({
      userId: ctx.session.userId,
      targetUserId: ctx.session.userId,
      asReceiver: false,
    });
    return result.feedback;
  }),

  /**
   * Get feedback received by current user
   */
  getReceived: protectedProcedure.query(async ({ ctx }) => {
    const result = await container.getFeedbackUseCase.execute({
      userId: ctx.session.userId,
      targetUserId: ctx.session.userId,
      asReceiver: true,
    });
    return result.feedback;
  }),

  /**
   * Polish feedback content using AI
   */
  polishWithAI: protectedProcedure
    .input(polishFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      return container.polishFeedbackUseCase.execute({
        feedbackId: input.feedbackId,
        content: input.content,
        userId: ctx.session.userId,
      });
    }),

  /**
   * Delete feedback entry
   */
  delete: protectedProcedure
    .input(deleteFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      await container.deleteFeedbackUseCase.execute({
        feedbackId: input.id,
        userId: ctx.session.userId,
      });
      return { success: true };
    }),

  /**
   * Get feedback statistics for a user
   * Note: This is available through GetDashboardMetricsUseCase
   */
  getStats: protectedProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Get dashboard metrics which includes feedback stats
      const metrics = await container.getDashboardMetricsUseCase.execute({
        userId: input.userId,
      });

      return {
        totalReceived: metrics.feedback.totalReceived,
        totalGiven: metrics.feedback.totalGiven,
        polishedCount: metrics.feedback.polishedCount,
      };
    }),
});
