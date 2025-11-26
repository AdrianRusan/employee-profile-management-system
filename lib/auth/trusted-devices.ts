import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/server/db';

const TRUSTED_DEVICE_COOKIE = 'trusted_device';
const TRUST_DURATION_DAYS = 30;

/**
 * Create a trusted device token and store it in the database and cookies
 * @param userId - The user ID to associate with the trusted device
 * @param userAgent - Optional user agent string for device identification
 * @returns The generated device token
 */
export async function createTrustedDevice(userId: string, userAgent?: string): Promise<string> {
  const deviceToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TRUST_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.trustedDevice.create({
    data: {
      userId,
      deviceToken,
      deviceName: userAgent?.substring(0, 255) || 'Unknown Device',
      expiresAt,
    },
  });

  // Set HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(TRUSTED_DEVICE_COOKIE, deviceToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return deviceToken;
}

/**
 * Check if the current device is trusted for the given user
 * @param userId - The user ID to check
 * @returns True if the device is trusted and not expired, false otherwise
 */
export async function checkTrustedDevice(userId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const deviceToken = cookieStore.get(TRUSTED_DEVICE_COOKIE)?.value;

  if (!deviceToken) return false;

  const device = await prisma.trustedDevice.findFirst({
    where: {
      userId,
      deviceToken,
      expiresAt: { gt: new Date() },
    },
  });

  return !!device;
}

/**
 * Clear the current trusted device token from both database and cookies
 */
export async function clearTrustedDevice(): Promise<void> {
  const cookieStore = await cookies();
  const deviceToken = cookieStore.get(TRUSTED_DEVICE_COOKIE)?.value;

  if (deviceToken) {
    await prisma.trustedDevice.deleteMany({ where: { deviceToken } });
    cookieStore.delete(TRUSTED_DEVICE_COOKIE);
  }
}

/**
 * Clean up expired trusted devices for a user
 * @param userId - Optional user ID to clean up devices for. If not provided, cleans all expired devices.
 */
export async function cleanupExpiredDevices(userId?: string): Promise<number> {
  const result = await prisma.trustedDevice.deleteMany({
    where: {
      ...(userId && { userId }),
      expiresAt: { lt: new Date() },
    },
  });

  return result.count;
}

/**
 * Get all trusted devices for a user
 * @param userId - The user ID to get trusted devices for
 * @returns Array of trusted devices
 */
export async function getUserTrustedDevices(userId: string) {
  return prisma.trustedDevice.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Revoke a specific trusted device
 * @param deviceId - The device ID to revoke
 * @param userId - The user ID (for authorization)
 */
export async function revokeTrustedDevice(deviceId: string, userId: string): Promise<void> {
  await prisma.trustedDevice.deleteMany({
    where: {
      id: deviceId,
      userId,
    },
  });
}

/**
 * Revoke all trusted devices for a user
 * @param userId - The user ID to revoke all devices for
 */
export async function revokeAllTrustedDevices(userId: string): Promise<number> {
  const result = await prisma.trustedDevice.deleteMany({
    where: { userId },
  });

  return result.count;
}
