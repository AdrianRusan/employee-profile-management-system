export type NotificationType =
  | 'FEEDBACK_RECEIVED'
  | 'ABSENCE_APPROVED'
  | 'ABSENCE_REJECTED'
  | 'ABSENCE_PENDING'
  | 'SYSTEM';

export interface NotificationProps {
  id: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  userId: string;
  createdAt: Date;
}

/**
 * Notification Aggregate Root
 * Contains all business logic related to notifications
 */
export class Notification {
  private props: NotificationProps;

  private constructor(props: NotificationProps) {
    this.props = props;
    this.validate();
  }

  /**
   * Factory method to create new Notification
   */
  static create(
    organizationId: string,
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>,
    id?: string
  ): Notification {
    return new Notification({
      id: id || crypto.randomUUID(),
      organizationId,
      userId,
      type,
      title,
      message,
      read: false,
      data,
      createdAt: new Date(),
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: NotificationProps): Notification {
    return new Notification(props);
  }

  private validate(): void {
    if (!this.props.title || this.props.title.trim().length === 0) {
      throw new Error('Notification title cannot be empty');
    }

    if (!this.props.message || this.props.message.trim().length === 0) {
      throw new Error('Notification message cannot be empty');
    }

    if (this.props.title.length > 200) {
      throw new Error('Notification title cannot exceed 200 characters');
    }

    if (this.props.message.length > 1000) {
      throw new Error('Notification message cannot exceed 1000 characters');
    }
  }

  /**
   * Business logic: Mark notification as read
   */
  markAsRead(): void {
    this.props.read = true;
  }

  /**
   * Business logic: Mark notification as unread
   */
  markAsUnread(): void {
    this.props.read = false;
  }

  /**
   * Check if notification is for a specific user
   */
  isForUser(userId: string): boolean {
    return this.props.userId === userId;
  }

  /**
   * Getters
   */
  get id(): string {
    return this.props.id;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get type(): NotificationType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get message(): string {
    return this.props.message;
  }

  get read(): boolean {
    return this.props.read;
  }

  get data(): Record<string, unknown> | undefined {
    return this.props.data;
  }

  get userId(): string {
    return this.props.userId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Get all properties (for persistence)
   */
  toObject(): NotificationProps {
    return { ...this.props };
  }
}
