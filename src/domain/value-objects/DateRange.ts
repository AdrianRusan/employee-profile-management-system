/**
 * DateRange Value Object
 * Represents an immutable date range with business rules
 */
export class DateRange {
  private constructor(
    private readonly _start: Date,
    private readonly _end: Date
  ) {
    this.validate();
  }

  /**
   * Factory method to create a DateRange
   */
  static create(start: Date, end: Date): DateRange {
    return new DateRange(new Date(start), new Date(end));
  }

  /**
   * Validates business rules for date range
   */
  private validate(): void {
    if (this._end < this._start) {
      throw new Error('End date must be on or after start date');
    }

    const maxDuration = 365; // days
    if (this.durationInDays() > maxDuration) {
      throw new Error(`Date range cannot exceed ${maxDuration} days`);
    }
  }

  /**
   * Check if this date range overlaps with another
   */
  overlaps(other: DateRange): boolean {
    return this._start <= other._end && this._end >= other._start;
  }

  /**
   * Calculate duration in days (inclusive)
   */
  durationInDays(): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.ceil((this._end.getTime() - this._start.getTime()) / msPerDay) + 1;
  }

  /**
   * Calculate working days (excluding weekends)
   */
  workingDays(): number {
    let count = 0;
    const current = new Date(this._start);

    while (current <= this._end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not Sunday (0) or Saturday (6)
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Check if date range is in the past
   */
  isInPast(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this._start < today;
  }

  /**
   * Check if date range includes today
   */
  includesToday(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this._start <= today && this._end >= today;
  }

  /**
   * Getters for immutable access
   */
  get start(): Date {
    return new Date(this._start);
  }

  get end(): Date {
    return new Date(this._end);
  }

  /**
   * Value object equality
   */
  equals(other: DateRange): boolean {
    return (
      this._start.getTime() === other._start.getTime() &&
      this._end.getTime() === other._end.getTime()
    );
  }

  /**
   * String representation
   */
  toString(): string {
    return `${this._start.toISOString().split('T')[0]} to ${this._end.toISOString().split('T')[0]}`;
  }
}
