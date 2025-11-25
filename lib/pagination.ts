import { z } from 'zod';

/**
 * Standard pagination limits for all API endpoints
 *
 * These constants ensure consistent pagination behavior across the application
 * and prevent resource exhaustion attacks by limiting maximum fetch sizes.
 *
 * @see {@link https://owasp.org/www-project-api-security/ OWASP API Security}
 */
export const PAGINATION_LIMITS = {
  /** Minimum items per page */
  MIN: 1,
  /** Maximum items that can be requested per page (security limit) */
  MAX: 100,
  /** Default number of items per page */
  DEFAULT: 20,
} as const;

/**
 * Standard pagination input schema for tRPC procedures
 *
 * Enforces safe pagination limits to prevent DoS attacks via unlimited data fetches.
 *
 * @example
 * ```typescript
 * // Use directly for simple pagination
 * getAll: protectedProcedure
 *   .input(paginationSchema)
 *   .query(async ({ ctx, input }) => {
 *     const { limit, cursor } = input;
 *     // ... fetch data with safe limits
 *   })
 *
 * // Or extend with additional filters
 * getAll: protectedProcedure
 *   .input(paginationSchema.extend({
 *     status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
 *   }))
 *   .query(async ({ ctx, input }) => {
 *     // ... fetch filtered data with safe limits
 *   })
 * ```
 */
export const paginationSchema = z.object({
  limit: z
    .number()
    .min(PAGINATION_LIMITS.MIN, `Limit must be at least ${PAGINATION_LIMITS.MIN}`)
    .max(PAGINATION_LIMITS.MAX, `Limit cannot exceed ${PAGINATION_LIMITS.MAX}`)
    .default(PAGINATION_LIMITS.DEFAULT),
  skip: z.number().min(0).default(0).optional(),
  cursor: z.string().optional(),
});

/**
 * Helper type for pagination input
 *
 * Use this type when you need to type pagination parameters
 * in functions or components.
 *
 * @example
 * ```typescript
 * function fetchData(pagination: PaginationInput) {
 *   const { limit, cursor } = pagination;
 *   // ... fetch data
 * }
 * ```
 */
export type PaginationInput = z.infer<typeof paginationSchema>;
