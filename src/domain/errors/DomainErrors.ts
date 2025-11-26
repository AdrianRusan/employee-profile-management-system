/**
 * Domain Error Types
 *
 * Provides typed error classes for domain-specific errors.
 * These errors are thrown from use cases and domain services,
 * and can be programmatically handled by the presentation layer.
 *
 * Error Codes:
 * - USER_* : User-related errors (1xxx)
 * - AUTH_* : Authentication errors (2xxx)
 * - PERM_* : Permission errors (3xxx)
 * - VALID_* : Validation errors (4xxx)
 * - ABSENCE_* : Absence-related errors (5xxx)
 * - FEEDBACK_* : Feedback-related errors (6xxx)
 * - NOTIF_* : Notification errors (7xxx)
 * - SYS_* : System errors (9xxx)
 */

/**
 * Base domain error class
 * All domain-specific errors extend this class
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert to JSON-serializable object for API responses
   */
  toJSON(): { code: string; message: string; details?: unknown } {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

// =============================================================================
// User Errors (1xxx)
// =============================================================================

/**
 * User not found in the system
 */
export class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(userId: string) {
    super(`User not found: ${userId}`);
  }
}

/**
 * User already exists (e.g., duplicate email)
 */
export class UserAlreadyExistsError extends DomainError {
  readonly code = 'USER_ALREADY_EXISTS';
  readonly httpStatus = 409;

  constructor(email: string) {
    super(`User with email ${email} already exists`);
  }
}

/**
 * User account has been deleted
 */
export class UserDeletedError extends DomainError {
  readonly code = 'USER_DELETED';
  readonly httpStatus = 410;

  constructor(userId: string) {
    super(`User account has been deleted: ${userId}`);
  }
}

/**
 * Cannot perform operation on self
 */
export class CannotModifySelfError extends DomainError {
  readonly code = 'USER_CANNOT_MODIFY_SELF';
  readonly httpStatus = 403;

  constructor(operation: string) {
    super(`Cannot ${operation} your own account`);
  }
}

// =============================================================================
// Authentication Errors (2xxx)
// =============================================================================

/**
 * Invalid credentials provided
 */
export class InvalidCredentialsError extends DomainError {
  readonly code = 'AUTH_INVALID_CREDENTIALS';
  readonly httpStatus = 401;

  constructor() {
    super('Invalid email or password');
  }
}

/**
 * Session has expired or is invalid
 */
export class SessionExpiredError extends DomainError {
  readonly code = 'AUTH_SESSION_EXPIRED';
  readonly httpStatus = 401;

  constructor() {
    super('Your session has expired. Please log in again.');
  }
}

/**
 * Authentication required but not provided
 */
export class AuthenticationRequiredError extends DomainError {
  readonly code = 'AUTH_REQUIRED';
  readonly httpStatus = 401;

  constructor() {
    super('Authentication is required to access this resource');
  }
}

/**
 * Account is locked due to too many failed attempts
 */
export class AccountLockedError extends DomainError {
  readonly code = 'AUTH_ACCOUNT_LOCKED';
  readonly httpStatus = 423;

  constructor(
    public readonly unlockAt: Date
  ) {
    super(`Account is locked until ${unlockAt.toISOString()}`);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: { unlockAt: this.unlockAt.toISOString() },
    };
  }
}

// =============================================================================
// Permission Errors (3xxx)
// =============================================================================

/**
 * User lacks permission for the requested action
 */
export class PermissionDeniedError extends DomainError {
  readonly code = 'PERM_DENIED';
  readonly httpStatus = 403;

  constructor(
    action: string,
    public readonly requiredRole?: string
  ) {
    super(`Permission denied: ${action}`);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: this.requiredRole ? { requiredRole: this.requiredRole } : undefined,
    };
  }
}

/**
 * User can only view/edit their own data
 */
export class SelfOnlyAccessError extends DomainError {
  readonly code = 'PERM_SELF_ONLY';
  readonly httpStatus = 403;

  constructor(resource: string) {
    super(`You can only access your own ${resource}`);
  }
}

/**
 * Manager-only operation
 */
export class ManagerOnlyError extends DomainError {
  readonly code = 'PERM_MANAGER_ONLY';
  readonly httpStatus = 403;

  constructor(action: string) {
    super(`Only managers can ${action}`);
  }
}

// =============================================================================
// Validation Errors (4xxx)
// =============================================================================

/**
 * Input validation failed
 */
export class ValidationError extends DomainError {
  readonly code = 'VALID_FAILED';
  readonly httpStatus = 400;

  constructor(
    message: string,
    public readonly fields?: Record<string, string[]>
  ) {
    super(message);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: this.fields ? { fields: this.fields } : undefined,
    };
  }
}

/**
 * Invalid email format
 */
export class InvalidEmailError extends DomainError {
  readonly code = 'VALID_INVALID_EMAIL';
  readonly httpStatus = 400;

  constructor(email: string) {
    super(`Invalid email format: ${email}`);
  }
}

/**
 * Invalid date range
 */
export class InvalidDateRangeError extends DomainError {
  readonly code = 'VALID_INVALID_DATE_RANGE';
  readonly httpStatus = 400;

  constructor(reason: string) {
    super(`Invalid date range: ${reason}`);
  }
}

// =============================================================================
// Absence Errors (5xxx)
// =============================================================================

/**
 * Absence request not found
 */
export class AbsenceNotFoundError extends DomainError {
  readonly code = 'ABSENCE_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(absenceId: string) {
    super(`Absence request not found: ${absenceId}`);
  }
}

/**
 * Absence dates conflict with existing request
 */
export class AbsenceDateConflictError extends DomainError {
  readonly code = 'ABSENCE_DATE_CONFLICT';
  readonly httpStatus = 409;

  constructor(
    startDate: Date,
    endDate: Date,
    public readonly conflictingAbsenceId?: string
  ) {
    super(
      `Absence request conflicts with existing absence from ${startDate.toISOString()} to ${endDate.toISOString()}`
    );
  }
}

/**
 * Cannot modify absence in current status
 */
export class AbsenceStatusError extends DomainError {
  readonly code = 'ABSENCE_INVALID_STATUS';
  readonly httpStatus = 400;

  constructor(
    action: string,
    currentStatus: string
  ) {
    super(`Cannot ${action} absence with status: ${currentStatus}`);
  }
}

/**
 * Cannot approve/reject own absence
 */
export class AbsenceSelfApprovalError extends DomainError {
  readonly code = 'ABSENCE_SELF_APPROVAL';
  readonly httpStatus = 403;

  constructor() {
    super('You cannot approve or reject your own absence request');
  }
}

// =============================================================================
// Feedback Errors (6xxx)
// =============================================================================

/**
 * Feedback not found
 */
export class FeedbackNotFoundError extends DomainError {
  readonly code = 'FEEDBACK_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(feedbackId: string) {
    super(`Feedback not found: ${feedbackId}`);
  }
}

/**
 * Cannot give feedback to self
 */
export class FeedbackSelfError extends DomainError {
  readonly code = 'FEEDBACK_SELF';
  readonly httpStatus = 400;

  constructor() {
    super('You cannot give feedback to yourself');
  }
}

/**
 * Feedback already polished
 */
export class FeedbackAlreadyPolishedError extends DomainError {
  readonly code = 'FEEDBACK_ALREADY_POLISHED';
  readonly httpStatus = 400;

  constructor(feedbackId: string) {
    super(`Feedback has already been polished: ${feedbackId}`);
  }
}

// =============================================================================
// Notification Errors (7xxx)
// =============================================================================

/**
 * Notification not found
 */
export class NotificationNotFoundError extends DomainError {
  readonly code = 'NOTIFICATION_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(notificationId: string) {
    super(`Notification not found: ${notificationId}`);
  }
}

/**
 * Cannot access another user's notification
 */
export class NotificationAccessError extends DomainError {
  readonly code = 'NOTIFICATION_ACCESS_DENIED';
  readonly httpStatus = 403;

  constructor() {
    super('You can only access your own notifications');
  }
}

// =============================================================================
// System Errors (9xxx)
// =============================================================================

/**
 * External service unavailable
 */
export class ExternalServiceError extends DomainError {
  readonly code = 'SYS_EXTERNAL_SERVICE';
  readonly httpStatus = 503;

  constructor(
    service: string,
    cause?: Error
  ) {
    super(`External service unavailable: ${service}`, cause);
  }
}

/**
 * Rate limit exceeded
 */
export class RateLimitExceededError extends DomainError {
  readonly code = 'SYS_RATE_LIMIT';
  readonly httpStatus = 429;

  constructor(
    public readonly retryAfter: number
  ) {
    super(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: { retryAfter: this.retryAfter },
    };
  }
}

/**
 * Database operation failed
 */
export class DatabaseError extends DomainError {
  readonly code = 'SYS_DATABASE';
  readonly httpStatus = 500;

  constructor(
    operation: string,
    cause?: Error
  ) {
    super(`Database operation failed: ${operation}`, cause);
  }
}

/**
 * Encryption/decryption failed
 */
export class EncryptionError extends DomainError {
  readonly code = 'SYS_ENCRYPTION';
  readonly httpStatus = 500;

  constructor(
    operation: 'encrypt' | 'decrypt',
    cause?: Error
  ) {
    super(`Failed to ${operation} sensitive data`, cause);
  }
}

// =============================================================================
// Error Type Guards
// =============================================================================

/**
 * Check if an error is a domain error
 */
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

/**
 * Check if an error is a specific domain error type
 */
export function isDomainErrorWithCode(
  error: unknown,
  code: string
): error is DomainError {
  return isDomainError(error) && error.code === code;
}

/**
 * Get HTTP status code for an error
 */
export function getHttpStatusForError(error: unknown): number {
  if (isDomainError(error)) {
    return error.httpStatus;
  }
  return 500;
}
