/**
 * Domain Errors Module
 *
 * Re-exports all domain error types for convenient importing.
 *
 * @example
 * ```typescript
 * import { UserNotFoundError, PermissionDeniedError } from '@/src/domain/errors';
 *
 * if (!user) {
 *   throw new UserNotFoundError(userId);
 * }
 * ```
 */

export * from './DomainErrors';
