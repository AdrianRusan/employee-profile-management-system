import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { ILogger } from '../../ports/ILogger';

export interface MarkAllNotificationsReadInput {
  userId: string;
}

/**
 * Mark All Notifications Read Use Case
 * Marks all notifications for a user as read
 */
export class MarkAllNotificationsReadUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: MarkAllNotificationsReadInput): Promise<{ success: boolean }> {
    this.logger.info({ userId: input.userId }, 'Marking all notifications as read');

    await this.notificationRepository.markAllAsRead(input.userId);

    this.logger.info({ userId: input.userId }, 'All notifications marked as read');

    return { success: true };
  }
}
