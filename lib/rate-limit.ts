/**
 * Rate Limiting Configuration
 *
 * Provides rate limiting for API endpoints to prevent abuse and DoS attacks.
 * Supports both Upstash Redis (production) and in-memory (development) stores.
 *
 * @see {@link https://github.com/upstash/ratelimit Upstash Rate Limit}
 * @see {@link https://owasp.org/www-project-api-security/ OWASP API Security}
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from './logger';

/**
 * Rate limit configuration presets
 */
export const RATE_LIMITS = {
  /** General API calls - 100 requests per minute */
  api: {
    requests: 100,
    window: '1 m' as const,
  },
  /** Authentication attempts - 5 per minute (brute force protection) */
  auth: {
    requests: 5,
    window: '1 m' as const,
  },
  /** Strict rate limit - 10 per minute (sensitive operations) */
  strict: {
    requests: 10,
    window: '1 m' as const,
  },
  /** AI operations - 20 per hour (expensive operations) */
  ai: {
    requests: 20,
    window: '1 h' as const,
  },
} as const;

/**
 * In-memory rate limiter for development/fallback
 * Uses a simple sliding window algorithm
 */
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map();

  async limit(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const key = identifier;
    const record = this.requests.get(key);

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    if (!record || now > record.resetAt) {
      // New window
      this.requests.set(key, { count: 1, resetAt: now + windowMs });
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        reset: now + windowMs,
      };
    }

    if (record.count >= maxRequests) {
      // Rate limited
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: record.resetAt,
      };
    }

    // Increment count
    record.count++;
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - record.count,
      reset: record.resetAt,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetAt) {
        this.requests.delete(key);
      }
    }
  }
}

/**
 * Parse window string to milliseconds
 */
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*(s|m|h|d)$/);
  if (!match) return 60000; // Default 1 minute

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 60000;
  }
}

/**
 * Rate limiter instance
 * Uses Upstash Redis if configured, otherwise falls back to in-memory
 */
let rateLimiter: Ratelimit | null = null;
let inMemoryLimiter: InMemoryRateLimiter | null = null;

/**
 * Initialize the rate limiter
 */
function getRateLimiter(): Ratelimit | null {
  if (rateLimiter) return rateLimiter;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const redis = new Redis({
        url: upstashUrl,
        token: upstashToken,
      });

      rateLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(RATE_LIMITS.api.requests, RATE_LIMITS.api.window),
        analytics: true,
        prefix: 'epms:ratelimit',
      });

      logger.info('Rate limiter initialized with Upstash Redis');
      return rateLimiter;
    } catch (error) {
      logger.warn({ error }, 'Failed to initialize Upstash Redis, falling back to in-memory');
    }
  }

  return null;
}

/**
 * Get the in-memory rate limiter (fallback)
 */
function getInMemoryLimiter(): InMemoryRateLimiter {
  if (!inMemoryLimiter) {
    inMemoryLimiter = new InMemoryRateLimiter();
    logger.info('Rate limiter initialized with in-memory store (development mode)');
  }
  return inMemoryLimiter;
}

/**
 * Rate limit result interface
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for an identifier
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param preset - Rate limit preset to use
 * @returns Rate limit result
 *
 * @example
 * ```typescript
 * const result = await checkRateLimit(request.ip, 'api');
 * if (!result.success) {
 *   return new Response('Too Many Requests', { status: 429 });
 * }
 * ```
 */
export async function checkRateLimit(
  identifier: string,
  preset: keyof typeof RATE_LIMITS = 'api'
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[preset];
  const redis = getRateLimiter();

  if (redis) {
    try {
      // Create a custom limiter for this preset
      const customLimiter = new Ratelimit({
        redis: redis as unknown as Redis,
        limiter: Ratelimit.slidingWindow(config.requests, config.window),
        prefix: `epms:ratelimit:${preset}`,
      });

      const result = await customLimiter.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      logger.error({ error }, 'Upstash rate limit check failed, using fallback');
    }
  }

  // Fallback to in-memory
  const memoryLimiter = getInMemoryLimiter();
  const windowMs = parseWindow(config.window);
  return memoryLimiter.limit(`${preset}:${identifier}`, config.requests, windowMs);
}

/**
 * Rate limit middleware result with headers
 */
export interface RateLimitResponse extends RateLimitResult {
  headers: Record<string, string>;
}

/**
 * Get rate limit result with standard headers
 *
 * @param identifier - Unique identifier
 * @param preset - Rate limit preset
 * @returns Rate limit result with headers
 */
export async function getRateLimitWithHeaders(
  identifier: string,
  preset: keyof typeof RATE_LIMITS = 'api'
): Promise<RateLimitResponse> {
  const result = await checkRateLimit(identifier, preset);

  return {
    ...result,
    headers: {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.reset.toString(),
      ...(result.success ? {} : { 'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString() }),
    },
  };
}

/**
 * Create a rate-limited handler wrapper for API routes
 *
 * @param preset - Rate limit preset to use
 * @returns Wrapper function for API handlers
 *
 * @example
 * ```typescript
 * import { withRateLimit } from '@/lib/rate-limit';
 *
 * const handler = withRateLimit('auth')(async (request) => {
 *   // Your handler logic
 * });
 * ```
 */
export function withRateLimit(preset: keyof typeof RATE_LIMITS = 'api') {
  return function <T>(
    handler: (request: Request) => Promise<Response>
  ): (request: Request) => Promise<Response> {
    return async (request: Request): Promise<Response> => {
      // Get identifier from IP or fallback
      const forwardedFor = request.headers.get('x-forwarded-for');
      const identifier = forwardedFor?.split(',')[0]?.trim() || 'anonymous';

      const result = await getRateLimitWithHeaders(identifier, preset);

      if (!result.success) {
        logger.warn(
          { identifier, preset, remaining: result.remaining },
          'Rate limit exceeded'
        );

        return new Response(
          JSON.stringify({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${Math.ceil((result.reset - Date.now()) / 1000)} seconds.`,
            retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...result.headers,
            },
          }
        );
      }

      // Call the original handler
      const response = await handler(request);

      // Add rate limit headers to response
      const newHeaders = new Headers(response.headers);
      Object.entries(result.headers).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    };
  };
}

/**
 * Rate limit presets with numeric values for testing
 */
export const RATE_LIMIT_PRESETS = {
  api: { limit: RATE_LIMITS.api.requests, windowMs: parseWindow(RATE_LIMITS.api.window) },
  auth: { limit: RATE_LIMITS.auth.requests, windowMs: parseWindow(RATE_LIMITS.auth.window) },
  strict: { limit: RATE_LIMITS.strict.requests, windowMs: parseWindow(RATE_LIMITS.strict.window) },
  ai: { limit: RATE_LIMITS.ai.requests, windowMs: parseWindow(RATE_LIMITS.ai.window) },
} as const;

/**
 * Reset rate limit for an identifier (for testing)
 */
export function resetRateLimit(identifier: string): void {
  if (inMemoryLimiter) {
    // Access private map through any cast for testing
    const limiter = inMemoryLimiter as unknown as { requests: Map<string, unknown> };
    // Delete all keys matching this identifier
    for (const preset of Object.keys(RATE_LIMITS)) {
      limiter.requests?.delete?.(`${preset}:${identifier}`);
    }
  }
}
