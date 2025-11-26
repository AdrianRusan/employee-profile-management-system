/**
 * Integration Tests for Rate Limiting
 *
 * Tests the rate limiting mechanism including:
 * - In-memory rate limiting
 * - Different presets (api, auth, strict, ai)
 * - Rate limit headers
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  checkRateLimit,
  RATE_LIMIT_PRESETS,
  resetRateLimit,
} from '@/lib/rate-limit';

// Mock Upstash to force in-memory mode
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn(),
}));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(),
}));

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all rate limits between tests
    resetRateLimit('test-user');
    resetRateLimit('test-user-2');
    resetRateLimit('test-ip');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('RATE_LIMIT_PRESETS', () => {
    it('should have expected presets', () => {
      expect(RATE_LIMIT_PRESETS).toHaveProperty('api');
      expect(RATE_LIMIT_PRESETS).toHaveProperty('auth');
      expect(RATE_LIMIT_PRESETS).toHaveProperty('strict');
      expect(RATE_LIMIT_PRESETS).toHaveProperty('ai');
    });

    it('should have sensible default values', () => {
      expect(RATE_LIMIT_PRESETS.api.limit).toBeGreaterThan(0);
      expect(RATE_LIMIT_PRESETS.auth.limit).toBeLessThan(RATE_LIMIT_PRESETS.api.limit);
      expect(RATE_LIMIT_PRESETS.ai.windowMs).toBeGreaterThan(RATE_LIMIT_PRESETS.api.windowMs);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const result = await checkRateLimit('test-user', 'api');

      expect(result.success).toBe(true);
      expect(result.remaining).toBeDefined();
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it('should track requests per identifier', async () => {
      const first = await checkRateLimit('test-user', 'api');
      const second = await checkRateLimit('test-user', 'api');

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      expect(second.remaining).toBeLessThan(first.remaining);
    });

    it('should separate limits by identifier', async () => {
      const user1 = await checkRateLimit('test-user', 'api');
      const user2 = await checkRateLimit('test-user-2', 'api');

      expect(user1.success).toBe(true);
      expect(user2.success).toBe(true);
      expect(user1.remaining).toBe(user2.remaining);
    });

    it('should apply different limits for different presets', async () => {
      const apiResult = await checkRateLimit('test-user', 'api');
      resetRateLimit('test-user');
      const authResult = await checkRateLimit('test-user', 'auth');

      // Auth has stricter limits than API
      expect(apiResult.remaining).toBeGreaterThan(authResult.remaining);
    });

    it('should block requests exceeding limit', async () => {
      const strictLimit = RATE_LIMIT_PRESETS.strict.limit;

      // Exhaust the limit
      for (let i = 0; i < strictLimit; i++) {
        const result = await checkRateLimit('test-ip', 'strict');
        expect(result.success).toBe(true);
      }

      // Next request should be blocked
      const blocked = await checkRateLimit('test-ip', 'strict');
      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it('should provide reset time when blocked', async () => {
      const authLimit = RATE_LIMIT_PRESETS.auth.limit;

      // Exhaust the auth limit
      for (let i = 0; i < authLimit; i++) {
        await checkRateLimit('test-user', 'auth');
      }

      const blocked = await checkRateLimit('test-user', 'auth');
      expect(blocked.success).toBe(false);
      expect(blocked.reset).toBeDefined();
      expect(blocked.reset).toBeGreaterThan(Date.now());
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for identifier', async () => {
      // Use some of the limit
      await checkRateLimit('test-user', 'api');
      await checkRateLimit('test-user', 'api');
      const before = await checkRateLimit('test-user', 'api');

      // Reset
      resetRateLimit('test-user');

      // Should be back to full
      const after = await checkRateLimit('test-user', 'api');
      expect(after.remaining).toBeGreaterThan(before.remaining);
    });
  });
});
