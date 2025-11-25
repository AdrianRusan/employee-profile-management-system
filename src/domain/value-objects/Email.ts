/**
 * Email Value Object
 * Represents a validated email address
 */
export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(private readonly _value: string) {
    this.validate();
  }

  static create(email: string): Email {
    return new Email(email.toLowerCase().trim());
  }

  private validate(): void {
    if (!this._value) {
      throw new Error('Email cannot be empty');
    }

    if (!Email.EMAIL_REGEX.test(this._value)) {
      throw new Error('Invalid email format');
    }

    if (this._value.length > 255) {
      throw new Error('Email too long');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
