import { Notification } from '../entities/Notification';

/**
 * Notification Repository Interface
 * Defines contract for notification persistence without implementation details
 */
export interface INotificationRepository {
  /**
   * Find notification by ID
   */
  findById(id: string): Promise<Notification | null>;

  /**
   * Find notifications for a user with pagination
   */
  findByUserId(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      skip?: number;
      take?: number;
    }
  ): Promise<{ notifications: Notification[]; total: number }>;

  /**
   * Get unread notification count for a user
   */
  getUnreadCount(userId: string): Promise<number>;

  /**
   * Save notification (create or update)
   */
  save(notification: Notification): Promise<Notification>;

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string): Promise<void>;

  /**
   * Delete notification permanently
   */
  delete(id: string): Promise<void>;

  /**
   * Delete old notifications (for cleanup)
   */
  deleteOlderThan(date: Date): Promise<number>;
}
