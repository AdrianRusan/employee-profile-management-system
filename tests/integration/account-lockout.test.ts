/**
 * Integration Tests for Account Lockout
 *
 * Tests the brute force protection mechanism including:
 * - Recording login attempts
 * - Account lockout after max failures
 * - IP-based lockout
 * - Lockout expiration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkAccountLockout,
  recordLoginAttempt,
  checkIpLockout,
  LOCKOUT_CONFIG,
  cleanupOldAttempts,
  getLoginAttemptHistory,
} from '@/lib/account-lockout';

// Mock Prisma
vi.mock('@/server/db', () => ({
  prisma: {
    loginAttempt: {
      create: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from '@/server/db';

describe('Account Lockout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LOCKOUT_CONFIG', () => {
    it('should have sensible default values', () => {
      expect(LOCKOUT_CONFIG.MAX_ATTEMPTS).toBe(5);
      expect(LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES).toBe(15);
      expect(LOCKOUT_CONFIG.ATTEMPT_WINDOW_MINUTES).toBe(15);
      expect(LOCKOUT_CONFIG.CLEANUP_THRESHOLD_HOURS).toBe(24);
    });
  });

  describe('recordLoginAttempt', () => {
    it('should record a successful login attempt', async () => {
      vi.mocked(prisma.loginAttempt.create).mockResolvedValue({
        id: 'test-id',
        email: 'test@example.com',
        successful: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
      });

      await recordLoginAttempt('test@example.com', true, '192.168.1.1', 'Mozilla/5.0');

      expect(prisma.loginAttempt.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          successful: true,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });
    });

    it('should record a failed login attempt', async () => {
      vi.mocked(prisma.loginAttempt.create).mockResolvedValue({
        id: 'test-id',
        email: 'test@example.com',
        successful: false,
        ipAddress: '192.168.1.1',
        userAgent: null,
        createdAt: new Date(),
      });

      await recordLoginAttempt('test@example.com', false, '192.168.1.1');

      expect(prisma.loginAttempt.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          successful: false,
          ipAddress: '192.168.1.1',
          userAgent: undefined,
        },
      });
    });

    it('should normalize email to lowercase', async () => {
      vi.mocked(prisma.loginAttempt.create).mockResolvedValue({
        id: 'test-id',
        email: 'test@example.com',
        successful: true,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      });

      await recordLoginAttempt('TEST@EXAMPLE.COM', true);

      expect(prisma.loginAttempt.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          successful: true,
          ipAddress: undefined,
          userAgent: undefined,
        },
      });
    });

    it('should not throw if database operation fails', async () => {
      vi.mocked(prisma.loginAttempt.create).mockRejectedValue(new Error('DB error'));

      await expect(
        recordLoginAttempt('test@example.com', false)
      ).resolves.not.toThrow();
    });
  });

  describe('checkAccountLockout', () => {
    it('should return not locked when no failed attempts', async () => {
      vi.mocked(prisma.loginAttempt.count).mockResolvedValue(0);

      const result = await checkAccountLockout('test@example.com');

      expect(result.isLocked).toBe(false);
      expect(result.remainingAttempts).toBe(LOCKOUT_CONFIG.MAX_ATTEMPTS);
      expect(result.failedAttempts).toBe(0);
    });

    it('should return remaining attempts when some failed', async () => {
      vi.mocked(prisma.loginAttempt.count).mockResolvedValue(3);

      const result = await checkAccountLockout('test@example.com');

      expect(result.isLocked).toBe(false);
      expect(result.remainingAttempts).toBe(2);
      expect(result.failedAttempts).toBe(3);
    });

    it('should lock account after max attempts', async () => {
      const now = new Date();
      vi.mocked(prisma.loginAttempt.count).mockResolvedValue(LOCKOUT_CONFIG.MAX_ATTEMPTS);
      vi.mocked(prisma.loginAttempt.findFirst).mockResolvedValue({
        id: 'test-id',
        email: 'test@example.com',
        successful: false,
        ipAddress: null,
        userAgent: null,
        createdAt: now,
      });

      const result = await checkAccountLockout('test@example.com');

      expect(result.isLocked).toBe(true);
      expect(result.remainingAttempts).toBe(0);
      expect(result.lockoutEndsAt).toBeDefined();
    });

    it('should unlock after lockout duration expires', async () => {
      const pastTime = new Date(
        Date.now() - (LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES + 1) * 60 * 1000
      );
      vi.mocked(prisma.loginAttempt.count).mockResolvedValue(LOCKOUT_CONFIG.MAX_ATTEMPTS);
      vi.mocked(prisma.loginAttempt.findFirst).mockResolvedValue({
        id: 'test-id',
        email: 'test@example.com',
        successful: false,
        ipAddress: null,
        userAgent: null,
        createdAt: pastTime,
      });

      const result = await checkAccountLockout('test@example.com');

      // Lockout has expired, so account should not be locked
      expect(result.isLocked).toBe(false);
    });

    it('should fail open on database error', async () => {
      vi.mocked(prisma.loginAttempt.count).mockRejectedValue(new Error('DB error'));

      const result = await checkAccountLockout('test@example.com');

      expect(result.isLocked).toBe(false);
      expect(result.remainingAttempts).toBe(LOCKOUT_CONFIG.MAX_ATTEMPTS);
    });
  });

  describe('checkIpLockout', () => {
    it('should not lock IP with few failed attempts', async () => {
      vi.mocked(prisma.loginAttempt.count).mockResolvedValue(5);

      const result = await checkIpLockout('192.168.1.1');

      expect(result).toBe(false);
    });

    it('should lock IP after threshold (3x max attempts)', async () => {
      vi.mocked(prisma.loginAttempt.count).mockResolvedValue(
        LOCKOUT_CONFIG.MAX_ATTEMPTS * 3
      );

      const result = await checkIpLockout('192.168.1.1');

      expect(result).toBe(true);
    });

    it('should fail open on database error', async () => {
      vi.mocked(prisma.loginAttempt.count).mockRejectedValue(new Error('DB error'));

      const result = await checkIpLockout('192.168.1.1');

      expect(result).toBe(false);
    });
  });

  describe('getLoginAttemptHistory', () => {
    it('should return login history for user', async () => {
      const mockAttempts = [
        { id: '1', successful: true, ipAddress: '192.168.1.1', createdAt: new Date() },
        { id: '2', successful: false, ipAddress: '192.168.1.2', createdAt: new Date() },
      ];
      vi.mocked(prisma.loginAttempt.findMany).mockResolvedValue(mockAttempts);

      const result = await getLoginAttemptHistory('test@example.com', 10);

      expect(result).toEqual(mockAttempts);
      expect(prisma.loginAttempt.findMany).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          successful: true,
          ipAddress: true,
          createdAt: true,
        },
      });
    });

    it('should return empty array on error', async () => {
      vi.mocked(prisma.loginAttempt.findMany).mockRejectedValue(new Error('DB error'));

      const result = await getLoginAttemptHistory('test@example.com');

      expect(result).toEqual([]);
    });
  });

  describe('cleanupOldAttempts', () => {
    it('should delete old attempts', async () => {
      vi.mocked(prisma.loginAttempt.deleteMany).mockResolvedValue({ count: 100 });

      const result = await cleanupOldAttempts();

      expect(result).toBe(100);
      expect(prisma.loginAttempt.deleteMany).toHaveBeenCalled();
    });

    it('should return 0 on error', async () => {
      vi.mocked(prisma.loginAttempt.deleteMany).mockRejectedValue(new Error('DB error'));

      const result = await cleanupOldAttempts();

      expect(result).toBe(0);
    });
  });
});
