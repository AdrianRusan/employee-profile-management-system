import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { ILogger } from '../../ports/ILogger';
import { NotificationListDTO, NotificationDTO } from '../../dtos/NotificationDTO';

export interface GetNotificationsInput {
  userId: string;
  unreadOnly?: boolean;
  skip?: number;
  take?: number;
}

/**
 * Get Notifications Use Case
 * Retrieves notifications for a user with pagination
 */
export class GetNotificationsUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: GetNotificationsInput): Promise<NotificationListDTO> {
    this.logger.info({ userId: input.userId }, 'Fetching notifications');

    const [result, unreadCount] = await Promise.all([
      this.notificationRepository.findByUserId(input.userId, {
        unreadOnly: input.unreadOnly,
        skip: input.skip,
        take: input.take,
      }),
      this.notificationRepository.getUnreadCount(input.userId),
    ]);

    const notifications: NotificationDTO[] = result.notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      data: n.data,
      userId: n.userId,
      createdAt: n.createdAt,
    }));

    return {
      notifications,
      total: result.total,
      unreadCount,
    };
  }
}
