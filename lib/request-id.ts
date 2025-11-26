/**
 * Request ID Middleware
 *
 * Generates unique request IDs for tracing requests through the system.
 * Request IDs are:
 * - Included in all API responses via X-Request-ID header
 * - Added to log entries for correlation
 * - Useful for debugging and support investigations
 *
 * If a client sends X-Request-ID header, it will be used (for distributed tracing).
 * Otherwise, a new UUID is generated.
 */

import { randomUUID } from 'crypto';

/**
 * Header name for request ID
 */
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Get or generate a request ID from headers
 *
 * @param headers - Request headers (Headers object or plain object)
 * @returns Request ID (from header or newly generated)
 */
export function getRequestId(headers: Headers | Record<string, string | string[] | undefined>): string {
  let existingId: string | null = null;

  if (headers instanceof Headers) {
    existingId = headers.get(REQUEST_ID_HEADER);
  } else {
    const headerValue = headers[REQUEST_ID_HEADER];
    existingId = Array.isArray(headerValue) ? headerValue[0] : headerValue || null;
  }

  // Validate existing ID (should be UUID-like, max 64 chars)
  if (existingId && /^[\w-]{1,64}$/.test(existingId)) {
    return existingId;
  }

  return randomUUID();
}

/**
 * Create response headers with request ID
 *
 * @param requestId - The request ID to include
 * @param additionalHeaders - Additional headers to include
 * @returns Headers object with request ID
 */
export function createResponseHeaders(
  requestId: string,
  additionalHeaders?: Record<string, string>
): Headers {
  const headers = new Headers(additionalHeaders);
  headers.set(REQUEST_ID_HEADER, requestId);
  return headers;
}

/**
 * Add request ID to existing headers
 *
 * @param headers - Existing headers object
 * @param requestId - Request ID to add
 */
export function addRequestIdToHeaders(headers: Headers, requestId: string): void {
  headers.set(REQUEST_ID_HEADER, requestId);
}
