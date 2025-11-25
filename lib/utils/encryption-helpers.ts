import { decrypt } from '@/lib/encryption';
import type { User } from '@prisma/client';
import type { Logger } from 'pino';

/**
 * Safely decrypt a value, handling errors gracefully
 * Returns null if decryption fails instead of throwing
 *
 * @param encryptedValue - The encrypted value to decrypt
 * @param logger - Optional logger for error tracking
 * @param context - Optional context for logging (e.g., userId)
 * @returns Decrypted string or null if decryption fails
 */
export function decryptSafely(
  encryptedValue: string | null | undefined,
  logger?: Logger,
  context?: Record<string, unknown>
): string | null {
  if (!encryptedValue) {
    return null;
  }

  try {
    return decrypt(encryptedValue);
  } catch (error) {
    if (logger) {
      logger.error(
        { ...context, error },
        'Failed to decrypt value'
      );
    }
    return null;
  }
}

/**
 * Decrypts all sensitive fields in a user object
 * Modifies the user object in place
 *
 * @param user - User object with encrypted sensitive fields
 * @param logger - Optional logger for error tracking
 * @returns The same user object with decrypted fields
 */
export function decryptUserSensitiveFields<T extends Partial<User>>(
  user: T,
  logger?: Logger
): T {
  if ('ssn' in user && user.ssn) {
    user.ssn = decryptSafely(user.ssn as string, logger, { userId: user.id }) as string | null;
  }

  return user;
}

/**
 * Decrypts sensitive fields for an array of users
 *
 * @param users - Array of user objects with encrypted sensitive fields
 * @param logger - Optional logger for error tracking
 * @returns The same array with decrypted fields
 */
export function decryptUsersSensitiveFields<T extends Partial<User>>(
  users: T[],
  logger?: Logger
): T[] {
  return users.map(user => decryptUserSensitiveFields(user, logger));
}
