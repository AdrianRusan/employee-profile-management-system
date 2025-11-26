import { Notification as PrismaNotification, NotificationType as PrismaNotificationType, Prisma } from '@prisma/client';
import { Notification, NotificationType } from '../../../../domain/entities/Notification';

/**
 * NotificationMapper
 * Converts between Prisma models and domain entities
 */
export class NotificationMapper {
  /**
   * Convert Prisma model to domain entity
   */
  static toDomain(prismaNotification: PrismaNotification): Notification {
    return Notification.reconstitute({
      id: prismaNotification.id,
      organizationId: prismaNotification.organizationId,
      type: prismaNotification.type as NotificationType,
      title: prismaNotification.title,
      message: prismaNotification.message,
      read: prismaNotification.read,
      data: prismaNotification.data as Record<string, unknown> | undefined,
      userId: prismaNotification.userId,
      createdAt: prismaNotification.createdAt,
    });
  }

  /**
   * Convert domain entity to Prisma model data for create/update
   */
  static toPrisma(notification: Notification): {
    id: string;
    organizationId: string;
    type: PrismaNotificationType;
    title: string;
    message: string;
    read: boolean;
    data: Prisma.InputJsonValue;
    userId: string;
  } {
    return {
      id: notification.id,
      organizationId: notification.organizationId,
      type: notification.type as PrismaNotificationType,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      data: (notification.data ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      userId: notification.userId,
    };
  }
}
