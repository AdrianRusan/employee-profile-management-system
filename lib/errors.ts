import { TRPCError } from '@trpc/server';

/**
 * Standardized error helpers for consistent error handling across the API
 *
 * These helpers ensure that all errors returned from tRPC endpoints:
 * - Use proper HTTP status codes
 * - Have user-friendly messages
 * - Follow a consistent pattern
 * - Are easy to debug
 *
 * Usage:
 * - throw AppErrors.notFound('User', userId)
 * - throw AppErrors.forbidden('delete this feedback')
 * - throw AppErrors.badRequest('Invalid date range')
 */
export const AppErrors = {
  /**
   * Resource not found (404)
   * Use when a requested resource doesn't exist in the database
   *
   * @param resource - The type of resource (e.g., 'User', 'Feedback', 'Absence request')
   * @param id - Optional ID of the resource
   *
   * @example
   * throw AppErrors.notFound('User', userId)
   * // Returns: "User with ID "abc123" not found"
   *
   * @example
   * throw AppErrors.notFound('Feedback')
   * // Returns: "Feedback not found"
   */
  notFound: (resource: string, id?: string) =>
    new TRPCError({
      code: 'NOT_FOUND',
      message: id
        ? `${resource} with ID "${id}" not found`
        : `${resource} not found`,
    }),

  /**
   * Permission denied (403)
   * Use when a user doesn't have permission to perform an action
   *
   * @param action - Optional description of the action being attempted
   *
   * @example
   * throw AppErrors.forbidden('delete this feedback')
   * // Returns: "You don't have permission to delete this feedback"
   *
   * @example
   * throw AppErrors.forbidden()
   * // Returns: "You don't have permission to perform this action"
   */
  forbidden: (action?: string) =>
    new TRPCError({
      code: 'FORBIDDEN',
      message: action
        ? `You don't have permission to ${action}`
        : `You don't have permission to perform this action`,
    }),

  /**
   * Invalid input or business logic violation (400)
   * Use when the request is malformed or violates business rules
   *
   * @param message - Description of what went wrong
   *
   * @example
   * throw AppErrors.badRequest('End date must be after start date')
   * // Returns: "End date must be after start date"
   */
  badRequest: (message: string) =>
    new TRPCError({
      code: 'BAD_REQUEST',
      message,
    }),

  /**
   * Conflict with existing resource (409)
   * Use when creating/updating would violate a uniqueness constraint or overlap
   *
   * @param message - Description of the conflict
   *
   * @example
   * throw AppErrors.conflict('This absence overlaps with an existing request')
   * // Returns: "This absence overlaps with an existing request"
   */
  conflict: (message: string) =>
    new TRPCError({
      code: 'CONFLICT',
      message,
    }),

  /**
   * Unauthenticated (401)
   * Use when a user must be logged in but isn't
   * Note: This should rarely be needed as protectedProcedure handles this
   *
   * @param message - Optional custom message
   *
   * @example
   * throw AppErrors.unauthorized()
   * // Returns: "You must be logged in to perform this action"
   */
  unauthorized: (message = 'You must be logged in to perform this action') =>
    new TRPCError({
      code: 'UNAUTHORIZED',
      message,
    }),

  /**
   * Internal server error (500)
   * Use sparingly! Only for truly unexpected errors
   * Most errors should use more specific error types above
   *
   * @param message - Optional custom message
   *
   * @example
   * throw AppErrors.internal('Database connection failed')
   * // Returns: "Database connection failed"
   */
  internal: (message = 'An unexpected error occurred') =>
    new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message,
    }),
};

/**
 * Helper to find a resource or throw a standardized NOT_FOUND error
 *
 * This is a common pattern in tRPC endpoints:
 * 1. Query the database for a resource
 * 2. If null, throw NOT_FOUND error
 * 3. Otherwise, continue with the resource
 *
 * This helper simplifies that pattern into one line.
 *
 * @param promise - Prisma query that returns a resource or null
 * @param resourceName - Type of resource for error message
 * @param id - Optional ID for more specific error message
 *
 * @example
 * const user = await findOrThrow(
 *   ctx.prisma.user.findUnique({ where: { id: userId } }),
 *   'User',
 *   userId
 * );
 * // If user is null, throws: "User with ID "abc123" not found"
 * // Otherwise, returns the user (with proper TypeScript typing)
 *
 * @example
 * const feedback = await findOrThrow(
 *   ctx.prisma.feedback.findUnique({ where: { id } }),
 *   'Feedback'
 * );
 * // If feedback is null, throws: "Feedback not found"
 */
export async function findOrThrow<T>(
  promise: Promise<T | null>,
  resourceName: string,
  id?: string
): Promise<T> {
  const result = await promise;
  if (!result) {
    throw AppErrors.notFound(resourceName, id);
  }
  return result;
}
