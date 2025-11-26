import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { ILogger } from '../../ports/ILogger';
import { Notification, NotificationType } from '../../../domain/entities/Notification';
import { NotificationDTO } from '../../dtos/NotificationDTO';
import { getCurrentTenant } from '@/lib/tenant-context';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Create Notification Use Case
 * Creates a new notification for a user
 */
export class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: CreateNotificationInput): Promise<NotificationDTO> {
    this.logger.info({ userId: input.userId, type: input.type }, 'Creating notification');

    // Get organization context
    const tenant = getCurrentTenant();

    const notification = Notification.create(
      tenant.organizationId,
      input.userId,
      input.type,
      input.title,
      input.message,
      input.data
    );

    const saved = await this.notificationRepository.save(notification);

    this.logger.info({ notificationId: saved.id }, 'Notification created successfully');

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
