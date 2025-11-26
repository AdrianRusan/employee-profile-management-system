import { PrismaClient } from '@prisma/client';
import type { Logger } from 'pino';
import { USER_FEEDBACK_SELECT } from '@/lib/prisma/selects';
import { polishFeedback } from '@/lib/ai/huggingface';
import { AppErrors, findOrThrow } from '@/lib/errors';
import { Permissions, type PermissionUser } from '@/lib/permissions';
import { getCurrentTenant } from '@/lib/tenant-context';

/**
 * Input types for feedback service methods
 */
export interface CreateFeedbackInput {
  receiverId: string;
  content: string;
  polishedContent?: string;
  isPolished?: boolean;
}

export interface PolishFeedbackInput {
  content: string;
}

/**
 * Result type for AI polishing
 */
export interface PolishFeedbackResult {
  original: string;
  polished: string;
  success: boolean;
  error?: string;
}

/**
 * Feedback Service
 * Handles all business logic for peer feedback management
 */
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger?: Logger
  ) {}

  /**
   * Submit new feedback with optional AI polishing
   * @param session - Current user session
   * @param input - Feedback data
   * @returns Created feedback entry
   */
  async submitFeedback(session: PermissionUser, input: CreateFeedbackInput) {
    const { receiverId, content, polishedContent, isPolished } = input;

    this.logger?.info({
      receiverId,
      isPolished,
      contentLength: content.length,
    }, 'Creating feedback');

    // Verify receiver exists and is not deleted
    await findOrThrow(
      this.prisma.user.findFirst({
        where: {
          id: receiverId,
          deletedAt: null
        },
      }),
      'Receiver',
      receiverId
    );

    // Check if user can give feedback (not to themselves)
    if (!Permissions.feedback.give(session, { id: receiverId })) {
      throw AppErrors.badRequest('You cannot give feedback to yourself');
    }

    // Get organization context
    const tenant = getCurrentTenant();

    // Create feedback entry
    const feedback = await this.prisma.feedback.create({
      data: {
        content,
        polishedContent: polishedContent || null,
        isPolished: isPolished || false,
        giverId: session.id,
        receiverId,
        organizationId: tenant.organizationId,
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

    this.logger?.info({
      feedbackId: feedback.id,
      receiverId,
      isPolished,
    }, 'Feedback created successfully');

    return feedback;
  }

  /**
   * Process feedback content with AI polishing
   * Returns polished version without saving to database
   * @param input - Content to polish
   * @returns Polished feedback result
   */
  async processFeedbackWithAI(input: PolishFeedbackInput): Promise<PolishFeedbackResult> {
    const { content } = input;

    this.logger?.info({
      contentLength: content.length,
    }, 'Polishing feedback with AI');

    try {
      // Call HuggingFace API to polish the feedback
      const polished = await polishFeedback(content);

      // Check if polishing actually occurred (not just fallback to original)
      const success = polished !== content;

      if (success) {
        this.logger?.info({
          originalLength: content.length,
          polishedLength: polished.length,
        }, 'Feedback polished successfully');
      } else {
        this.logger?.warn('AI polishing returned original content (fallback)');
      }

      return {
        original: content,
        polished,
        success,
      };
    } catch (error) {
      this.logger?.error({ error, contentLength: content.length }, 'Failed to polish feedback with AI');

      // Return original content as fallback
      return {
        original: content,
        polished: content,
        success: false,
        error: 'Failed to polish feedback. Please try again.',
      };
    }
  }

  /**
   * Get all feedback for a specific user with permission filtering
   * @param session - Current user session
   * @param userId - User ID to get feedback for
   * @returns Filtered list of feedback
   */
  async listFeedbackWithPermissions(session: PermissionUser, userId: string) {
    // Verify user exists and is not deleted
    await findOrThrow(
      this.prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null
        },
      }),
      'User',
      userId
    );

    // Fetch all feedback for the user
    const allFeedback = await this.prisma.feedback.findMany({
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

    // Filter feedback based on permissions
    const filteredFeedback = allFeedback.filter((feedback) => {
      return Permissions.feedback.view(session, feedback);
    });

    return filteredFeedback;
  }

  /**
   * Get feedback given by current user
   * @param session - Current user session
   * @returns List of feedback given by user
   */
  async getFeedbackGiven(session: PermissionUser) {
    return this.prisma.feedback.findMany({
      where: {
        giverId: session.id,
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
  }

  /**
   * Get feedback received by current user
   * @param session - Current user session
   * @returns List of feedback received by user
   */
  async getFeedbackReceived(session: PermissionUser) {
    return this.prisma.feedback.findMany({
      where: {
        receiverId: session.id,
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
  }

  /**
   * Delete feedback entry
   * @param session - Current user session
   * @param feedbackId - Feedback ID to delete
   * @returns Success message
   */
  async deleteFeedback(session: PermissionUser, feedbackId: string) {
    this.logger?.info({ feedbackId }, 'Deleting feedback');

    // Find the feedback entry
    const feedback = await findOrThrow(
      this.prisma.feedback.findUnique({
        where: { id: feedbackId },
      }),
      'Feedback',
      feedbackId
    );

    // Check if user has permission to delete this feedback
    if (!Permissions.feedback.delete(session, feedback)) {
      throw AppErrors.forbidden('You do not have permission to delete this feedback');
    }

    // Delete the feedback
    await this.prisma.feedback.delete({
      where: { id: feedbackId },
    });

    this.logger?.info({
      feedbackId,
      giverId: feedback.giverId,
      receiverId: feedback.receiverId,
    }, 'Feedback deleted successfully');

    return { success: true };
  }

  /**
   * Get feedback statistics for a user
   * @param userId - User ID to get stats for
   * @returns Feedback statistics
   */
  async getFeedbackStats(userId: string) {
    // Count feedback given
    const givenCount = await this.prisma.feedback.count({
      where: {
        giverId: userId,
        deletedAt: null
      },
    });

    // Count feedback received
    const receivedCount = await this.prisma.feedback.count({
      where: {
        receiverId: userId,
        deletedAt: null
      },
    });

    // Count polished feedback
    const polishedCount = await this.prisma.feedback.count({
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
  }
}
