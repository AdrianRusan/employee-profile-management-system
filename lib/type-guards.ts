/**
 * Type Guards for Runtime Type Validation
 *
 * Type guards provide both compile-time type narrowing and runtime validation,
 * preventing type assertion bypasses and null/undefined errors.
 *
 * @see https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
 */

import { User } from '@prisma/client';

/**
 * SessionUser represents a user object from the auth store or session
 * Contains essential fields for authentication and authorization
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'COWORKER';
  department: string | null;
  title: string | null;
  avatar: string | null;
}

/**
 * Type guard to check if a value is a valid SessionUser
 *
 * @param value - Unknown value to check
 * @returns true if value is SessionUser, false otherwise
 *
 * @example
 * const user = getUserFromSomewhere();
 * if (isSessionUser(user)) {
 *   // TypeScript now knows user is SessionUser
 *   console.log(user.email);
 * }
 */
export function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const user = value as Record<string, unknown>;

  // Check required string fields
  if (
    typeof user.id !== 'string' ||
    typeof user.email !== 'string' ||
    typeof user.name !== 'string' ||
    typeof user.role !== 'string'
  ) {
    return false;
  }

  // Validate role enum
  if (!(['EMPLOYEE', 'MANAGER', 'COWORKER'] as const).includes(
    user.role as 'EMPLOYEE' | 'MANAGER' | 'COWORKER'
  )) {
    return false;
  }

  // Check optional nullable fields
  if (
    user.department !== null && typeof user.department !== 'string' ||
    user.title !== null && typeof user.title !== 'string' ||
    user.avatar !== null && typeof user.avatar !== 'string'
  ) {
    return false;
  }

  return true;
}

/**
 * Type guard to check if a value is a valid Prisma User
 *
 * @param value - Unknown value to check
 * @returns true if value is User, false otherwise
 *
 * @example
 * const result = await prisma.user.findUnique({ where: { id } });
 * if (isUser(result)) {
 *   // TypeScript now knows result is User (not User | null)
 *   console.log(result.email);
 * } else {
 *   notFound();
 * }
 */
export function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const user = value as Record<string, unknown>;

  // Check required string fields
  if (
    typeof user.id !== 'string' ||
    typeof user.email !== 'string' ||
    typeof user.name !== 'string' ||
    typeof user.role !== 'string'
  ) {
    return false;
  }

  // Validate role enum
  if (!(['EMPLOYEE', 'MANAGER', 'COWORKER'] as const).includes(
    user.role as 'EMPLOYEE' | 'MANAGER' | 'COWORKER'
  )) {
    return false;
  }

  // Check required Date fields
  if (
    !(user.createdAt instanceof Date) ||
    !(user.updatedAt instanceof Date)
  ) {
    return false;
  }

  return true;
}

/**
 * Type guard for File objects (useful in form data handling)
 *
 * @param value - Unknown value to check
 * @returns true if value is File, false otherwise
 *
 * @example
 * const file = formData.get('file');
 * if (isFile(file)) {
 *   // TypeScript knows file is File
 *   console.log(file.size);
 * }
 */
export function isFile(value: unknown): value is File {
  return value instanceof File;
}

/**
 * Type guard to check if a string is a valid Role enum value
 *
 * @param value - String to check
 * @returns true if value is valid Role, false otherwise
 *
 * @example
 * const role = formData.get('role');
 * if (isValidRole(role)) {
 *   // TypeScript knows role is 'EMPLOYEE' | 'MANAGER' | 'COWORKER'
 *   setUserRole(role);
 * }
 */
export function isValidRole(value: unknown): value is 'EMPLOYEE' | 'MANAGER' | 'COWORKER' {
  return (
    typeof value === 'string' &&
    (['EMPLOYEE', 'MANAGER', 'COWORKER'] as const).includes(
      value as 'EMPLOYEE' | 'MANAGER' | 'COWORKER'
    )
  );
}

/**
 * Type guard to check if a value is a non-null string
 *
 * @param value - Value to check
 * @returns true if value is non-null string, false otherwise
 *
 * @example
 * const name = user.name;
 * if (isNonNullString(name)) {
 *   console.log(name.toUpperCase());
 * }
 */
export function isNonNullString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard to check if a value is a non-empty array
 *
 * @param value - Value to check
 * @returns true if value is non-empty array, false otherwise
 *
 * @example
 * const items = getData();
 * if (isNonEmptyArray(items)) {
 *   // TypeScript knows items has at least one element
 *   console.log(items[0]);
 * }
 */
export function isNonEmptyArray<T>(value: unknown): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}
