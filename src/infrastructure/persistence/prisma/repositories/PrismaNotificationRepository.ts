import { PrismaClient } from '@prisma/client';
import { INotificationRepository } from '../../../../domain/repositories/INotificationRepository';
import { Notification } from '../../../../domain/entities/Notification';
import { NotificationMapper } from '../mappers/NotificationMapper';
import { getCurrentTenant, getTenantOrNull } from '@/lib/tenant-context';

/**
 * Prisma implementation of INotificationRepository
 * Handles persistence of Notification aggregates using Prisma ORM
 */
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find a notification by ID
   */
  async findById(id: string): Promise<Notification | null> {
    const tenant = getTenantOrNull();
    const prismaNotification = await this.prisma.notification.findFirst({
      where: {
        id,
        ...(tenant && { organizationId: tenant.organizationId }),
      },
    });

    return prismaNotification ? NotificationMapper.toDomain(prismaNotification) : null;
  }

  /**
   * Find notifications for a user with pagination
   */
  async findByUserId(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      skip?: number;
      take?: number;
    }
  ): Promise<{ notifications: Notification[]; total: number }> {
    const tenant = getTenantOrNull();
    const where: any = { userId };

    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

    if (options?.unreadOnly) {
      where.read = false;
    }

    const [prismaNotifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications: prismaNotifications.map((n) => NotificationMapper.toDomain(n)),
      total,
    };
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const tenant = getTenantOrNull();
    const where: any = {
      userId,
      read: false,
    };

    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

    return this.prisma.notification.count({ where });
  }

  /**
   * Save (create or update) a notification
   */
  async save(notification: Notification): Promise<Notification> {
    const tenant = getCurrentTenant(); // Throws if no tenant for mutations
    const data = NotificationMapper.toPrisma(notification);

    // Ensure organizationId matches tenant
    if (data.organizationId !== tenant.organizationId) {
      throw new Error('Notification organizationId must match current tenant');
    }

    const saved = await this.prisma.notification.upsert({
      where: { id: notification.id },
      create: {
        ...data,
        createdAt: notification.createdAt,
      },
      update: {
        ...data,
      },
    });

    return NotificationMapper.toDomain(saved);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const tenant = getCurrentTenant(); // Throws if no tenant for mutations
    await this.prisma.notification.updateMany({
      where: {
        userId,
        organizationId: tenant.organizationId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  /**
   * Permanently delete a notification
   */
  async delete(id: string): Promise<void> {
    const tenant = getCurrentTenant(); // Throws if no tenant for mutations
    await this.prisma.notification.deleteMany({
      where: {
        id,
        organizationId: tenant.organizationId,
      },
    });
  }

  /**
   * Delete notifications older than a specific date (for cleanup)
   * Returns the count of deleted notifications
   */
  async deleteOlderThan(date: Date): Promise<number> {
    const tenant = getTenantOrNull();
    const where: any = {
      createdAt: { lt: date },
    };

    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

    const result = await this.prisma.notification.deleteMany({ where });

    return result.count;
  }
}
