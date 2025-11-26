import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { ILogger } from '../../ports/ILogger';
import { NotificationDTO } from '../../dtos/NotificationDTO';

export interface MarkNotificationReadInput {
  notificationId: string;
  userId: string;
}

/**
 * Mark Notification Read Use Case
 * Marks a single notification as read
 */
export class MarkNotificationReadUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: MarkNotificationReadInput): Promise<NotificationDTO> {
    this.logger.info({ notificationId: input.notificationId }, 'Marking notification as read');

    const notification = await this.notificationRepository.findById(input.notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (!notification.isForUser(input.userId)) {
      throw new Error('Not authorized to modify this notification');
    }

    notification.markAsRead();
    const saved = await this.notificationRepository.save(notification);

    this.logger.info({ notificationId: saved.id }, 'Notification marked as read');

    return {
      id: saved.id,
      type: saved.type,
      title: saved.title,
      message: saved.message,
      read: saved.read,
      data: saved.data,
      userId: saved.userId,
      createdAt: saved.createdAt,
    };
  }
}
