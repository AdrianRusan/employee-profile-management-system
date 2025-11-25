import { Feedback as PrismaFeedback } from '@prisma/client';
import { Feedback } from '../../../../domain/entities/Feedback';

/**
 * FeedbackMapper
 * Converts between Prisma models and domain entities
 */
export class FeedbackMapper {
  /**
   * Convert Prisma model to domain entity
   */
  static toDomain(prismaFeedback: PrismaFeedback): Feedback {
    return Feedback.reconstitute({
      id: prismaFeedback.id,
      giverId: prismaFeedback.giverId,
      receiverId: prismaFeedback.receiverId,
      content: prismaFeedback.content,
      polishedContent: prismaFeedback.polishedContent ?? undefined,
      isPolished: prismaFeedback.isPolished,
      deletedAt: prismaFeedback.deletedAt ?? undefined,
      createdAt: prismaFeedback.createdAt,
      updatedAt: prismaFeedback.updatedAt,
    });
  }

  /**
   * Convert domain entity to Prisma model data
   */
  static toPrisma(feedback: Feedback): Omit<PrismaFeedback, 'createdAt' | 'updatedAt'> {
    return {
      id: feedback.id,
      giverId: feedback.giverId,
      receiverId: feedback.receiverId,
      content: feedback.content,
      polishedContent: feedback.polishedContent ?? null,
      isPolished: feedback.isPolished,
      deletedAt: feedback.deletedAt ?? null,
    };
  }
}
