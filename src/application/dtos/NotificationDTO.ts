import { NotificationType } from '../../domain/entities/Notification';

/**
 * Input DTO for creating notification
 */
export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Output DTO for notification data
 */
export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  userId: string;
  createdAt: Date;
}

/**
 * Output DTO for notification list with pagination
 */
export interface NotificationListDTO {
  notifications: NotificationDTO[];
  total: number;
  unreadCount: number;
}
