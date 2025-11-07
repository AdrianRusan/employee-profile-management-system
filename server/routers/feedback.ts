import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  feedbackSchema,
  polishFeedbackSchema,
  deleteFeedbackSchema,
  getFeedbackForUserSchema,
} from '@/lib/validations/feedback';
import { Permissions, assertPermission } from '@/lib/permissions';
import { polishFeedback } from '@/lib/ai/huggingface';
import { USER_FEEDBACK_SELECT } from '@/lib/prisma/selects';
import { findOrThrow } from '@/lib/errors';

/**
 * Feedback router for peer feedback management
 * Handles creating, viewing, polishing, and deleting feedback
 */
export const feedbackRouter = router({
  /**
   * Create new feedback entry
   * Any authenticated user can give feedback to any other user
   */
  create: protectedProcedure
    .input(
      feedbackSchema.extend({
        polishedContent: z.string().optional(),
        isPolished: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { receiverId, content, polishedContent, isPolished } = input;

      ctx.logger.info({
        receiverId,
        isPolished,
        contentLength: content.length,
      }, 'Creating feedback');

      // Verify receiver exists and is not deleted
      void await findOrThrow(
        ctx.prisma.user.findFirst({
          where: {
            id: receiverId,
            deletedAt: null
          },
        }),
        'Receiver',
        receiverId
      );

      // Create feedback entry
      const feedback = await ctx.prisma.feedback.create({
        data: {
          content,
          polishedContent: polishedContent || null,
          isPolished,
          giverId: ctx.session.userId,
          receiverId,
        },
        include: {
          giver: {
            select: USER_FEEDBACK_SELECT,
          },
          receiver: {
            select: USER_FEEDBACK_SELECT,
          },
        },
      });

      ctx.logger.info({
        feedbackId: feedback.id,
        receiverId,
        isPolished,
      }, 'Feedback created successfully');

      return feedback;
    }),

  /**
   * Get all feedback for a specific user
   * Visible to managers, feedback receiver, and feedback givers
   */
  getForUser: protectedProcedure
    .input(getFeedbackForUserSchema)
    .query(async ({ ctx, input }) => {
      const { userId } = input;

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

      // Fetch all feedback for the user (exclude soft-deleted feedback)
      const allFeedback = await ctx.prisma.feedback.findMany({
        where: {
          receiverId: userId,
          deletedAt: null
        },
        include: {
          giver: {
            select: USER_FEEDBACK_SELECT,
          },
          receiver: {
            select: USER_FEEDBACK_SELECT,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Filter feedback based on centralized permissions
      const filteredFeedback = allFeedback.filter((feedback) => {
        return Permissions.feedback.view(ctx.session, feedback);
      });

      return filteredFeedback;
    }),

  /**
   * Get feedback given by current user
   * Shows all feedback the current user has given to others
   */
  getGiven: protectedProcedure.query(async ({ ctx }) => {
    const feedback = await ctx.prisma.feedback.findMany({
      where: {
        giverId: ctx.session.userId,
        deletedAt: null
      },
      include: {
        receiver: {
          select: USER_FEEDBACK_SELECT,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return feedback;
  }),

  /**
   * Get feedback received by current user
   * Shows all feedback the current user has received
   */
  getReceived: protectedProcedure.query(async ({ ctx }) => {
    const feedback = await ctx.prisma.feedback.findMany({
      where: {
        receiverId: ctx.session.userId,
        deletedAt: null
      },
      include: {
        giver: {
          select: USER_FEEDBACK_SELECT,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return feedback;
  }),

  /**
   * Polish feedback content using AI
   * Returns the polished version without saving to database
   */
  polishWithAI: protectedProcedure
    .input(polishFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      const { content } = input;

      ctx.logger.info({
        contentLength: content.length,
      }, 'Polishing feedback with AI');

      try {
        // Call HuggingFace API to polish the feedback
        const polished = await polishFeedback(content);

        ctx.logger.info({
          originalLength: content.length,
          polishedLength: polished.length,
        }, 'Feedback polished successfully');

        return {
          original: content,
          polished,
          success: true,
        };
      } catch (error) {
        ctx.logger.error({ error, contentLength: content.length }, 'Failed to polish feedback with AI');

        // Return original content as fallback
        return {
          original: content,
          polished: content,
          success: false,
          error: 'Failed to polish feedback. Please try again.',
        };
      }
    }),

  /**
   * Delete feedback entry
   * Can be deleted by the feedback giver or by managers
   */
  delete: protectedProcedure
    .input(deleteFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      ctx.logger.info({ feedbackId: id }, 'Deleting feedback');

      // Find the feedback entry
      const feedback = await findOrThrow(
        ctx.prisma.feedback.findUnique({
          where: { id },
        }),
        'Feedback',
        id
      );

      // Check if user has permission to delete this feedback using centralized permissions
      assertPermission(
        Permissions.feedback.delete(ctx.session, feedback),
        'You do not have permission to delete this feedback'
      );

      // Delete the feedback
      await ctx.prisma.feedback.delete({
        where: { id },
      });

      ctx.logger.info({
        feedbackId: id,
        giverId: feedback.giverId,
        receiverId: feedback.receiverId,
      }, 'Feedback deleted successfully');

      return { success: true };
    }),

  /**
   * Get feedback statistics for a user
   * Shows counts of feedback given and received
   */
  getStats: protectedProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const { userId } = input;

      // Count feedback given (exclude soft-deleted)
      const givenCount = await ctx.prisma.feedback.count({
        where: {
          giverId: userId,
          deletedAt: null
        },
      });

      // Count feedback received (exclude soft-deleted)
      const receivedCount = await ctx.prisma.feedback.count({
        where: {
          receiverId: userId,
          deletedAt: null
        },
      });

      // Count polished feedback (exclude soft-deleted)
      const polishedCount = await ctx.prisma.feedback.count({
        where: {
          receiverId: userId,
          isPolished: true,
          deletedAt: null
        },
      });

      return {
        given: givenCount,
        received: receivedCount,
        polished: polishedCount,
      };
    }),
});
