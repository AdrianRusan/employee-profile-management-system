import { PrismaClient } from '@prisma/client';
import { IFeedbackRepository } from '../../../../domain/repositories/IFeedbackRepository';
import { Feedback } from '../../../../domain/entities/Feedback';
import { FeedbackMapper } from '../mappers/FeedbackMapper';
import { getCurrentTenant, getTenantOrNull } from '@/lib/tenant-context';

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
    const tenant = getTenantOrNull();
    const prismaFeedback = await this.prisma.feedback.findFirst({
      where: {
        id,
        ...(tenant && { organizationId: tenant.organizationId }),
      },
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
    const tenant = getTenantOrNull();
    const where: any = { giverId };

    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

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
    const tenant = getTenantOrNull();
    const where: any = { receiverId };

    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

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
    const tenant = getTenantOrNull();
    const where: any = {};

    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

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
    const tenant = getTenantOrNull();
    const where: any = { deletedAt: null };

    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

    const prismaFeedback = await this.prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return prismaFeedback.map((f) => FeedbackMapper.toDomain(f));
  }

  /**
   * Save (create or update) a feedback
   */
  async save(feedback: Feedback): Promise<Feedback> {
    const tenant = getCurrentTenant(); // Throws if no tenant for mutations
    const data = FeedbackMapper.toPrisma(feedback);

    // Ensure organizationId matches tenant
    if (data.organizationId !== tenant.organizationId) {
      throw new Error('Feedback organizationId must match current tenant');
    }

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
    const tenant = getCurrentTenant(); // Throws if no tenant for mutations
    await this.prisma.feedback.deleteMany({
      where: {
        id,
        organizationId: tenant.organizationId,
      },
    });
  }

  /**
   * Get feedback statistics for a user
   */
  async getStatistics(userId: string): Promise<{
    givenCount: number;
    receivedCount: number;
    polishedCount: number;
  }> {
    const tenant = getTenantOrNull();
    const orgFilter = tenant ? { organizationId: tenant.organizationId } : {};

    // Execute queries in parallel for performance
    const [receivedCount, givenCount, polishedCount] = await Promise.all([
      this.prisma.feedback.count({
        where: {
          ...orgFilter,
          receiverId: userId,
          deletedAt: null,
        },
      }),
      this.prisma.feedback.count({
        where: {
          ...orgFilter,
          giverId: userId,
          deletedAt: null,
        },
      }),
      this.prisma.feedback.count({
        where: {
          ...orgFilter,
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
    const tenant = getTenantOrNull();
    const where: any = {
      giverId,
      receiverId,
      id: excludeId ? { not: excludeId } : undefined,
      deletedAt: null,
    };

    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

    const count = await this.prisma.feedback.count({ where });

    return count > 0;
  }
}
