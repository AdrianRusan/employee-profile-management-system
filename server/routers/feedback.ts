import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  feedbackSchema,
  polishFeedbackSchema,
  deleteFeedbackSchema,
  getFeedbackForUserSchema,
} from '@/lib/validations/feedback';
import { FeedbackService } from '@/lib/services/feedbackService';

/**
 * Feedback router for peer feedback management
 * Delegates all business logic to FeedbackService (Clean Architecture)
 *
 * REFACTORED: Reduced from 293 lines to ~100 lines by extracting business logic
 * to the service layer. Each endpoint follows the thin controller pattern.
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
      const feedbackService = new FeedbackService(ctx.prisma, ctx.logger);
      return feedbackService.submitFeedback(ctx.session, input);
    }),

  /**
   * Get all feedback for a specific user
   */
  getForUser: protectedProcedure
    .input(getFeedbackForUserSchema)
    .query(async ({ ctx, input }) => {
      const feedbackService = new FeedbackService(ctx.prisma, ctx.logger);
      return feedbackService.listFeedbackWithPermissions(ctx.session, input.userId);
    }),

  /**
   * Get feedback given by current user
   */
  getGiven: protectedProcedure.query(async ({ ctx }) => {
    const feedbackService = new FeedbackService(ctx.prisma, ctx.logger);
    return feedbackService.getFeedbackGiven(ctx.session);
  }),

  /**
   * Get feedback received by current user
   */
  getReceived: protectedProcedure.query(async ({ ctx }) => {
    const feedbackService = new FeedbackService(ctx.prisma, ctx.logger);
    return feedbackService.getFeedbackReceived(ctx.session);
  }),

  /**
   * Polish feedback content using AI
   */
  polishWithAI: protectedProcedure
    .input(polishFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      const feedbackService = new FeedbackService(ctx.prisma, ctx.logger);
      return feedbackService.processFeedbackWithAI(input);
    }),

  /**
   * Delete feedback entry
   */
  delete: protectedProcedure
    .input(deleteFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      const feedbackService = new FeedbackService(ctx.prisma, ctx.logger);
      return feedbackService.deleteFeedback(ctx.session, input.id);
    }),

  /**
   * Get feedback statistics for a user
   */
  getStats: protectedProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const feedbackService = new FeedbackService(ctx.prisma, ctx.logger);
      return feedbackService.getFeedbackStats(input.userId);
    }),
});
