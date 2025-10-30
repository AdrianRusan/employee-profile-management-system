import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import {
  feedbackSchema,
  polishFeedbackSchema,
  deleteFeedbackSchema,
  getFeedbackForUserSchema,
} from '@/lib/validations/feedback';
import { canViewFeedback, canDeleteFeedback } from '@/lib/permissions';
import { polishFeedback } from '@/lib/ai/huggingface';

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

      // Verify receiver exists
      const receiver = await ctx.prisma.user.findUnique({
        where: { id: receiverId },
      });

      if (!receiver) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Receiver not found',
        });
      }

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
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      });

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

      // Fetch all feedback for the user
      const allFeedback = await ctx.prisma.feedback.findMany({
        where: { receiverId: userId },
        include: {
          giver: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Filter feedback based on permissions
      const filteredFeedback = allFeedback.filter((feedback) => {
        return canViewFeedback(
          ctx.session.role,
          ctx.session.userId,
          feedback.receiverId,
          feedback.giverId
        );
      });

      return filteredFeedback;
    }),

  /**
   * Get feedback given by current user
   * Shows all feedback the current user has given to others
   */
  getGiven: protectedProcedure.query(async ({ ctx }) => {
    const feedback = await ctx.prisma.feedback.findMany({
      where: { giverId: ctx.session.userId },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
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
      where: { receiverId: ctx.session.userId },
      include: {
        giver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
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
    .mutation(async ({ input }) => {
      const { content } = input;

      try {
        // Call HuggingFace API to polish the feedback
        const polished = await polishFeedback(content);

        return {
          original: content,
          polished,
          success: true,
        };
      } catch (error) {
        console.error('Error polishing feedback:', error);

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

      // Find the feedback entry
      const feedback = await ctx.prisma.feedback.findUnique({
        where: { id },
      });

      if (!feedback) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Feedback not found',
        });
      }

      // Check if user has permission to delete this feedback
      if (
        !canDeleteFeedback(
          ctx.session.role,
          ctx.session.userId,
          feedback.giverId
        )
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this feedback',
        });
      }

      // Delete the feedback
      await ctx.prisma.feedback.delete({
        where: { id },
      });

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

      // Count feedback given
      const givenCount = await ctx.prisma.feedback.count({
        where: { giverId: userId },
      });

      // Count feedback received
      const receivedCount = await ctx.prisma.feedback.count({
        where: { receiverId: userId },
      });

      // Count polished feedback
      const polishedCount = await ctx.prisma.feedback.count({
        where: {
          receiverId: userId,
          isPolished: true,
        },
      });

      return {
        given: givenCount,
        received: receivedCount,
        polished: polishedCount,
      };
    }),
});
