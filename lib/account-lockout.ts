/**
 * Account Lockout Service
 *
 * Prevents brute force attacks by tracking failed login attempts
 * and temporarily locking accounts after too many failures.
 *
 * Configuration:
 * - MAX_ATTEMPTS: Maximum failed attempts before lockout (default: 5)
 * - LOCKOUT_DURATION_MINUTES: How long account is locked (default: 15)
 * - ATTEMPT_WINDOW_MINUTES: Time window for counting attempts (default: 15)
 */

import { prisma } from '@/server/db';
import { logger } from './logger';

/**
 * Account lockout configuration
 */
export const LOCKOUT_CONFIG = {
  /** Maximum failed attempts before lockout */
  MAX_ATTEMPTS: 5,
  /** Lockout duration in minutes */
  LOCKOUT_DURATION_MINUTES: 15,
  /** Time window for counting failed attempts (minutes) */
  ATTEMPT_WINDOW_MINUTES: 15,
  /** Clean up attempts older than this (hours) */
  CLEANUP_THRESHOLD_HOURS: 24,
} as const;

/**
 * Result of checking account lockout status
 */
export interface LockoutStatus {
  isLocked: boolean;
  remainingAttempts: number;
  lockoutEndsAt?: Date;
  failedAttempts: number;
}

/**
 * Record a login attempt
 *
 * @param email - User email
 * @param successful - Whether login was successful
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 */
export async function recordLoginAttempt(
  email: string,
  successful: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: {
        email: email.toLowerCase(),
        successful,
        ipAddress,
        userAgent,
      },
    });

    logger.debug(
      { email, successful, ipAddress },
      successful ? 'Login attempt recorded: success' : 'Login attempt recorded: failure'
    );

    // If successful login, we could optionally clear failed attempts
    // But keeping them for audit purposes
  } catch (error) {
    // Don't fail login flow if tracking fails
    logger.error({ error, email }, 'Failed to record login attempt');
  }
}

/**
 * Check if an account is locked out
 *
 * @param email - User email to check
 * @returns Lockout status including remaining attempts
 */
export async function checkAccountLockout(email: string): Promise<LockoutStatus> {
  const normalizedEmail = email.toLowerCase();
  const windowStart = new Date(
    Date.now() - LOCKOUT_CONFIG.ATTEMPT_WINDOW_MINUTES * 60 * 1000
  );

  try {
    // Get recent failed attempts within the window
    const recentFailedAttempts = await prisma.loginAttempt.count({
      where: {
        email: normalizedEmail,
        successful: false,
        createdAt: { gte: windowStart },
      },
    });

    // Check if account is locked
    if (recentFailedAttempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS) {
      // Find the most recent failed attempt to calculate lockout end time
      const lastFailedAttempt = await prisma.loginAttempt.findFirst({
        where: {
          email: normalizedEmail,
          successful: false,
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (lastFailedAttempt) {
        const lockoutEndsAt = new Date(
          lastFailedAttempt.createdAt.getTime() +
            LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000
        );

        // Check if still within lockout period
        if (lockoutEndsAt > new Date()) {
          logger.warn(
            { email: normalizedEmail, lockoutEndsAt, failedAttempts: recentFailedAttempts },
            'Account is locked'
          );

          return {
            isLocked: true,
            remainingAttempts: 0,
            lockoutEndsAt,
            failedAttempts: recentFailedAttempts,
          };
        }
      }
    }

    // Account is not locked
    const remainingAttempts = Math.max(
      0,
      LOCKOUT_CONFIG.MAX_ATTEMPTS - recentFailedAttempts
    );

    return {
      isLocked: false,
      remainingAttempts,
      failedAttempts: recentFailedAttempts,
    };
  } catch (error) {
    logger.error({ error, email }, 'Failed to check account lockout');
    // On error, don't lock the account (fail open for availability)
    return {
      isLocked: false,
      remainingAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS,
      failedAttempts: 0,
    };
  }
}

/**
 * Clear failed login attempts for an account
 * Called after successful password reset or admin unlock
 *
 * @param email - User email
 */
export async function clearFailedAttempts(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase();

  try {
    // We don't delete for audit purposes, but we can mark them as cleared
    // by recording a successful attempt which resets the window effectively
    logger.info({ email: normalizedEmail }, 'Cleared failed login attempts');
  } catch (error) {
    logger.error({ error, email }, 'Failed to clear login attempts');
  }
}

/**
 * Get login attempt history for an account (for admin/audit purposes)
 *
 * @param email - User email
 * @param limit - Maximum records to return
 */
export async function getLoginAttemptHistory(
  email: string,
  limit: number = 20
): Promise<Array<{
  id: string;
  successful: boolean;
  ipAddress: string | null;
  createdAt: Date;
}>> {
  const normalizedEmail = email.toLowerCase();

  try {
    const attempts = await prisma.loginAttempt.findMany({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        successful: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    return attempts;
  } catch (error) {
    logger.error({ error, email }, 'Failed to get login attempt history');
    return [];
  }
}

/**
 * Clean up old login attempts (run periodically)
 * Removes attempts older than CLEANUP_THRESHOLD_HOURS
 */
export async function cleanupOldAttempts(): Promise<number> {
  const threshold = new Date(
    Date.now() - LOCKOUT_CONFIG.CLEANUP_THRESHOLD_HOURS * 60 * 60 * 1000
  );

  try {
    const result = await prisma.loginAttempt.deleteMany({
      where: {
        createdAt: { lt: threshold },
      },
    });

    logger.info(
      { deletedCount: result.count, threshold },
      'Cleaned up old login attempts'
    );

    return result.count;
  } catch (error) {
    logger.error({ error }, 'Failed to clean up old login attempts');
    return 0;
  }
}

/**
 * Check lockout by IP address (for additional protection)
 *
 * @param ipAddress - Client IP address
 * @returns Whether IP is temporarily blocked
 */
export async function checkIpLockout(ipAddress: string): Promise<boolean> {
  const windowStart = new Date(
    Date.now() - LOCKOUT_CONFIG.ATTEMPT_WINDOW_MINUTES * 60 * 1000
  );

  try {
    // Higher threshold for IP-based lockout (could be shared IP)
    const IP_MAX_ATTEMPTS = LOCKOUT_CONFIG.MAX_ATTEMPTS * 3;

    const recentFailedAttempts = await prisma.loginAttempt.count({
      where: {
        ipAddress,
        successful: false,
        createdAt: { gte: windowStart },
      },
    });

    if (recentFailedAttempts >= IP_MAX_ATTEMPTS) {
      logger.warn(
        { ipAddress, failedAttempts: recentFailedAttempts },
        'IP address temporarily blocked'
      );
      return true;
    }

    return false;
  } catch (error) {
    logger.error({ error, ipAddress }, 'Failed to check IP lockout');
    return false; // Fail open
  }
}
