import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from './logger';

// In-memory store for development (not suitable for production multi-instance deployments)
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();

  async limit(identifier: string, tokens: number, window: number): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const windowStart = now - window;

    // Get existing requests for this identifier
    const timestamps = this.requests.get(identifier) || [];

    // Filter out requests outside the window
    const validTimestamps = timestamps.filter(ts => ts > windowStart);

    // Check if limit exceeded
    const success = validTimestamps.length < tokens;

    if (success) {
      validTimestamps.push(now);
      this.requests.set(identifier, validTimestamps);
    }

    return {
      success,
      limit: tokens,
      remaining: Math.max(0, tokens - validTimestamps.length),
      reset: now + window,
    };
  }

  async reset(identifier: string): Promise<void> {
    this.requests.delete(identifier);
  }
}

// Create rate limiters based on environment
const createRateLimiter = () => {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    logger.info('Using Upstash Redis for rate limiting');
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    return {
      login: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
        analytics: true,
        prefix: 'ratelimit:login',
      }),
      upload: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 uploads per hour
        analytics: true,
        prefix: 'ratelimit:upload',
      }),
      api: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
        analytics: true,
        prefix: 'ratelimit:api',
      }),
      mutation: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 mutations per minute
        analytics: true,
        prefix: 'ratelimit:mutation',
      }),
    };
  }

  // Fallback to in-memory for development
  logger.warn('Using in-memory rate limiting (not suitable for production)');
  const memoryLimiter = new InMemoryRateLimiter();

  return {
    login: {
      limit: async (identifier: string) => memoryLimiter.limit(identifier, 5, 15 * 60 * 1000),
    },
    upload: {
      limit: async (identifier: string) => memoryLimiter.limit(identifier, 10, 60 * 60 * 1000),
    },
    api: {
      limit: async (identifier: string) => memoryLimiter.limit(identifier, 100, 60 * 1000),
    },
    mutation: {
      limit: async (identifier: string) => memoryLimiter.limit(identifier, 30, 60 * 1000),
    },
  };
};

export const rateLimit = createRateLimiter();

/**
 * Get identifier for rate limiting from request
 * Uses IP address or user ID if authenticated
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer authenticated user ID
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return `ip:${ip}`;
}

/**
 * Check rate limit and return appropriate response if exceeded
 */
export async function checkRateLimit(
  limiter: { limit: (identifier: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> },
  identifier: string,
  actionName: string
): Promise<{ allowed: true } | { allowed: false; response: Response }> {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      const resetDate = new Date(reset);
      logger.warn({
        identifier,
        action: actionName,
        limit,
        reset: resetDate,
      }, 'Rate limit exceeded');

      return {
        allowed: false,
        response: new Response(
          JSON.stringify({
            error: 'Too many requests',
            message: `Rate limit exceeded. Try again after ${resetDate.toISOString()}`,
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': String(remaining),
              'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
            },
          }
        ),
      };
    }

    logger.debug({
      identifier,
      action: actionName,
      remaining,
    }, 'Rate limit check passed');

    return { allowed: true };
  } catch (error) {
    // If rate limiting fails, allow the request but log the error
    logger.error({ error, identifier, action: actionName }, 'Rate limit check failed, allowing request');
    return { allowed: true };
  }
}
