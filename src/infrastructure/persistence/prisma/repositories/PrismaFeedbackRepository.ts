import { PrismaClient } from '@prisma/client';
import { IFeedbackRepository } from '../../../../domain/repositories/IFeedbackRepository';
import { Feedback } from '../../../../domain/entities/Feedback';
import { FeedbackMapper } from '../mappers/FeedbackMapper';

/**
 * Prisma implementation of IFeedbackRepository
 * Handles persistence of Feedback aggregates using Prisma ORM
 *
 * Responsibilities:
 * - Convert between Domain Feedback entities and Prisma models
 * - Execute database queries through Prisma
 * - Maintain data integrity and consistency
 * - Provide feedback statistics and analytics
 */
export class PrismaFeedbackRepository implements IFeedbackRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find a feedback by ID
   */
  async findById(id: string): Promise<Feedback | null> {
    const prismaFeedback = await this.prisma.feedback.findUnique({
      where: { id },
    });

    return prismaFeedback ? FeedbackMapper.toDomain(prismaFeedback) : null;
  }

  /**
   * Find all feedback given by a specific user
   */
  async findByGiverId(
    giverId: string,
    options?: {
      includeDeleted?: boolean;
      skip?: number;
      take?: number;
    }
  ): Promise<{ feedbacks: Feedback[]; total: number }> {
    const where: any = { giverId };

    // Exclude deleted feedback by default
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    // Execute queries in parallel for performance
    const [prismaFeedback, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      feedbacks: prismaFeedback.map((f) => FeedbackMapper.toDomain(f)),
      total,
    };
  }

  /**
   * Find all feedback received by a specific user
   */
  async findByReceiverId(
    receiverId: string,
    options?: {
      includeDeleted?: boolean;
      skip?: number;
      take?: number;
    }
  ): Promise<{ feedbacks: Feedback[]; total: number }> {
    const where: any = { receiverId };

    // Exclude deleted feedback by default
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    // Execute queries in parallel for performance
    const [prismaFeedback, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      feedbacks: prismaFeedback.map((f) => FeedbackMapper.toDomain(f)),
      total,
    };
  }

  /**
   * Find all feedback with optional filtering and pagination
   */
  async findAll(options?: {
    includeDeleted?: boolean;
    isPolished?: boolean;
    skip?: number;
    take?: number;
  }): Promise<{ feedbacks: Feedback[]; total: number }> {
    const where: any = {};

    // Exclude deleted feedback by default
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    // Filter by polished status if specified
    if (options?.isPolished !== undefined) {
      where.isPolished = options.isPolished;
    }

    // Execute queries in parallel for performance
    const [prismaFeedback, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      feedbacks: prismaFeedback.map((f) => FeedbackMapper.toDomain(f)),
      total,
    };
  }

  /**
   * Find recent feedback with a limit (for dashboards/activity feeds)
   */
  async findRecent(limit: number = 10): Promise<Feedback[]> {
    const prismaFeedback = await this.prisma.feedback.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return prismaFeedback.map((f) => FeedbackMapper.toDomain(f));
  }

  /**
   * Save (create or update) a feedback
   */
  async save(feedback: Feedback): Promise<Feedback> {
    const data = FeedbackMapper.toPrisma(feedback);

    // Use upsert for idempotency (create if doesn't exist, update if it does)
    const saved = await this.prisma.feedback.upsert({
      where: { id: feedback.id },
      create: {
        ...data,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
      },
      update: {
        ...data,
        updatedAt: feedback.updatedAt,
      },
    });

    return FeedbackMapper.toDomain(saved);
  }

  /**
   * Permanently delete a feedback from the database
   * Note: This is a hard delete. For soft deletes, use Feedback.softDelete() then save()
   */
  async delete(id: string): Promise<void> {
    await this.prisma.feedback.delete({ where: { id } });
  }

  /**
   * Get feedback statistics for a user
   */
  async getStatistics(userId: string): Promise<{
    givenCount: number;
    receivedCount: number;
    polishedCount: number;
  }> {
    // Execute queries in parallel for performance
    const [receivedCount, givenCount, polishedCount] = await Promise.all([
      this.prisma.feedback.count({
        where: {
          receiverId: userId,
          deletedAt: null,
        },
      }),
      this.prisma.feedback.count({
        where: {
          giverId: userId,
          deletedAt: null,
        },
      }),
      this.prisma.feedback.count({
        where: {
          receiverId: userId,
          isPolished: true,
          deletedAt: null,
        },
      }),
    ]);

    return {
      givenCount,
      receivedCount,
      polishedCount,
    };
  }

  /**
   * Check if feedback exists between two users (to prevent duplicates)
   */
  async existsBetweenUsers(
    giverId: string,
    receiverId: string,
    excludeId?: string
  ): Promise<boolean> {
    const count = await this.prisma.feedback.count({
      where: {
        giverId,
        receiverId,
        id: excludeId ? { not: excludeId } : undefined,
        deletedAt: null,
      },
    });

    return count > 0;
  }
}
