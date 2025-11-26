import { DateRange } from '../value-objects/DateRange';

export enum AbsenceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface AbsenceProps {
  id: string;
  organizationId: string;
  userId: string;
  dateRange: DateRange;
  reason: string;
  status: AbsenceStatus;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Absence Aggregate Root
 * Contains all business logic related to absence requests
 */
export class Absence {
  private props: AbsenceProps;

  private constructor(props: AbsenceProps) {
    this.props = props;
    this.validate();
  }

  /**
   * Factory method to create a new Absence
   */
  static create(
    organizationId: string,
    userId: string,
    dateRange: DateRange,
    reason: string,
    id?: string
  ): Absence {
    return new Absence({
      id: id || crypto.randomUUID(),
      organizationId,
      userId,
      dateRange,
      reason,
      status: AbsenceStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: AbsenceProps): Absence {
    return new Absence(props);
  }

  private validate(): void {
    if (!this.props.reason || this.props.reason.trim().length < 10) {
      throw new Error('Absence reason must be at least 10 characters');
    }

    if (this.props.reason.length > 500) {
      throw new Error('Absence reason cannot exceed 500 characters');
    }

    // Cannot request absence in the past (unless already created)
    if (!this.props.id && this.props.dateRange.isInPast()) {
      throw new Error('Cannot request absence for past dates');
    }
  }

  /**
   * Business logic: Check if this absence overlaps with another
   */
  overlapsWith(other: Absence): boolean {
    // Only check overlaps for the same user
    if (this.props.userId !== other.props.userId) {
      return false;
    }

    // Don't check against rejected or deleted absences
    if (
      other.status === AbsenceStatus.REJECTED ||
      other.isDeleted()
    ) {
      return false;
    }

    // Don't check against self
    if (this.id === other.id) {
      return false;
    }

    return this.props.dateRange.overlaps(other.props.dateRange);
  }

  /**
   * Business logic: Approve absence request
   */
  approve(): void {
    if (this.status !== AbsenceStatus.PENDING) {
      throw new Error('Can only approve pending absence requests');
    }

    if (this.isDeleted()) {
      throw new Error('Cannot approve deleted absence request');
    }

    this.props.status = AbsenceStatus.APPROVED;
    this.props.updatedAt = new Date();
  }

  /**
   * Business logic: Reject absence request
   */
  reject(): void {
    if (this.status !== AbsenceStatus.PENDING) {
      throw new Error('Can only reject pending absence requests');
    }

    if (this.isDeleted()) {
      throw new Error('Cannot reject deleted absence request');
    }

    this.props.status = AbsenceStatus.REJECTED;
    this.props.updatedAt = new Date();
  }

  /**
   * Business logic: Soft delete absence
   */
  softDelete(): void {
    if (this.props.deletedAt) {
      throw new Error('Absence is already deleted');
    }

    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Check if absence is currently active
   */
  isActive(): boolean {
    return (
      this.status === AbsenceStatus.APPROVED &&
      this.props.dateRange.includesToday()
    );
  }

  /**
   * Check if absence can be cancelled
   */
  canBeCancelled(): boolean {
    return (
      this.status === AbsenceStatus.PENDING &&
      !this.isDeleted()
    );
  }

  /**
   * Get duration in working days
   */
  getWorkingDays(): number {
    return this.props.dateRange.workingDays();
  }

  /**
   * Get total duration in days
   */
  getTotalDays(): number {
    return this.props.dateRange.durationInDays();
  }

  /**
   * Status checks
   */
  isPending(): boolean {
    return this.props.status === AbsenceStatus.PENDING;
  }

  isApproved(): boolean {
    return this.props.status === AbsenceStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.props.status === AbsenceStatus.REJECTED;
  }

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

  get userId(): string {
    return this.props.userId;
  }

  get dateRange(): DateRange {
    return this.props.dateRange;
  }

  get reason(): string {
    return this.props.reason;
  }

  get status(): AbsenceStatus {
    return this.props.status;
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
  toObject(): AbsenceProps {
    return { ...this.props };
  }
}
