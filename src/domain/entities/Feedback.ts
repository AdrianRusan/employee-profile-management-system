export interface FeedbackProps {
  id: string;
  organizationId: string;
  giverId: string;
  receiverId: string;
  content: string;
  polishedContent?: string;
  isPolished: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Feedback Aggregate Root
 * Contains all business logic related to feedback
 */
export class Feedback {
  private props: FeedbackProps;

  private constructor(props: FeedbackProps) {
    this.props = props;
    this.validate();
  }

  /**
   * Factory method to create new Feedback
   */
  static create(
    organizationId: string,
    giverId: string,
    receiverId: string,
    content: string,
    id?: string
  ): Feedback {
    return new Feedback({
      id: id || crypto.randomUUID(),
      organizationId,
      giverId,
      receiverId,
      content,
      isPolished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: FeedbackProps): Feedback {
    return new Feedback(props);
  }

  private validate(): void {
    if (this.props.giverId === this.props.receiverId) {
      throw new Error('Cannot give feedback to yourself');
    }

    if (!this.props.content || this.props.content.trim().length < 10) {
      throw new Error('Feedback content must be at least 10 characters');
    }

    if (this.props.content.length > 5000) {
      throw new Error('Feedback content cannot exceed 5000 characters');
    }
  }

  /**
   * Business logic: Polish feedback content with AI
   */
  polishContent(polishedContent: string): void {
    if (this.isDeleted()) {
      throw new Error('Cannot polish deleted feedback');
    }

    if (!polishedContent || polishedContent.trim().length === 0) {
      throw new Error('Polished content cannot be empty');
    }

    this.props.polishedContent = polishedContent;
    this.props.isPolished = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Business logic: Reset polished content
   */
  resetPolish(): void {
    this.props.polishedContent = undefined;
    this.props.isPolished = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Business logic: Update feedback content
   */
  updateContent(newContent: string): void {
    if (this.isDeleted()) {
      throw new Error('Cannot update deleted feedback');
    }

    if (!newContent || newContent.trim().length < 10) {
      throw new Error('Feedback content must be at least 10 characters');
    }

    if (newContent.length > 5000) {
      throw new Error('Feedback content cannot exceed 5000 characters');
    }

    this.props.content = newContent;

    // Reset polished content when original is updated
    if (this.props.isPolished) {
      this.resetPolish();
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Business logic: Soft delete feedback
   */
  softDelete(): void {
    if (this.props.deletedAt) {
      throw new Error('Feedback is already deleted');
    }

    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Get display content (polished if available, otherwise original)
   */
  getDisplayContent(): string {
    return this.props.isPolished && this.props.polishedContent
      ? this.props.polishedContent
      : this.props.content;
  }

  /**
   * Check if feedback is from a specific user
   */
  isFromUser(userId: string): boolean {
    return this.props.giverId === userId;
  }

  /**
   * Check if feedback is for a specific user
   */
  isForUser(userId: string): boolean {
    return this.props.receiverId === userId;
  }

  /**
   * Status checks
   */
  isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
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

  get giverId(): string {
    return this.props.giverId;
  }

  get receiverId(): string {
    return this.props.receiverId;
  }

  get content(): string {
    return this.props.content;
  }

  get polishedContent(): string | undefined {
    return this.props.polishedContent;
  }

  get isPolished(): boolean {
    return this.props.isPolished;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Get all properties (for persistence)
   */
  toObject(): FeedbackProps {
    return { ...this.props };
  }
}
