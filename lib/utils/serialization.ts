import { Prisma } from '@prisma/client';

/**
 * Serializes a Prisma Decimal to a string for client components
 * Prevents serialization errors when sending data to the client
 *
 * @param value - Decimal value to serialize
 * @returns String representation or null
 */
export function serializeDecimal(value: Prisma.Decimal | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
}

/**
 * Serializes a Date to ISO string for client components
 *
 * @param value - Date value to serialize
 * @returns ISO string or null
 */
export function serializeDate(value: Date | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value.toISOString();
}

/**
 * Generic user serializer that handles Decimal types
 * Converts Prisma Decimal types to strings to avoid serialization errors
 *
 * @param user - User object with potential Decimal fields
 * @returns Serialized user object
 */
export function serializeUser<T extends Record<string, unknown>>(
  user: T
): T & { salary?: string | null } {
  if ('salary' in user && user.salary !== undefined && user.salary !== null) {
    return {
      ...user,
      salary: String(user.salary),
    };
  }
  return user;
}

/**
 * Serializes an array of users
 *
 * @param users - Array of user objects
 * @returns Array of serialized user objects
 */
export function serializeUsers<T extends Record<string, unknown>>(
  users: T[]
): (T & { salary?: string | null })[] {
  return users.map(user => serializeUser(user));
}

/**
 * Generic object serializer that handles all special Prisma types
 *
 * @param obj - Object to serialize
 * @returns Serialized object
 */
export function serializeObject<T extends Record<string, unknown>>(obj: T): T {
  const serialized = { ...obj };

  for (const [key, value] of Object.entries(serialized)) {
    if (value instanceof Prisma.Decimal) {
      (serialized as Record<string, unknown>)[key] = String(value);
    } else if (value instanceof Date) {
      (serialized as Record<string, unknown>)[key] = value.toISOString();
    }
  }

  return serialized;
}
