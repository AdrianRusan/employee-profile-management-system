import { Prisma } from '@prisma/client';

/**
 * Shared Prisma select constants to eliminate code duplication
 *
 * These constants define which fields to select when querying user data.
 * Using shared constants ensures consistency across the application and
 * reduces maintenance burden when adding/removing user fields.
 *
 * @module lib/prisma/selects
 */

/**
 * Public user fields safe for all users to see
 * Used in: feedback queries, absence requests, profile lists
 */
export const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  department: true,
  title: true,
  role: true,
  avatar: true,
  bio: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.UserSelect;

/**
 * Sensitive user fields only visible to managers and the user themselves
 * Includes all public fields plus sensitive information
 */
export const USER_SENSITIVE_SELECT = {
  ...USER_PUBLIC_SELECT,
  salary: true,
  ssn: true,
  address: true,
  performanceRating: true,
} as const satisfies Prisma.UserSelect;

/**
 * Minimal user fields for cards, lists, and compact displays
 * Used in: absence calendar, user mentions, compact views
 */
export const USER_CARD_SELECT = {
  id: true,
  name: true,
  avatar: true,
  title: true,
  department: true,
} as const satisfies Prisma.UserSelect;

/**
 * User fields for feedback-related queries
 * Includes only fields needed for feedback giver/receiver display
 */
export const USER_FEEDBACK_SELECT = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
} as const satisfies Prisma.UserSelect;

/**
 * User fields for absence request queries
 * Includes fields needed for absence request user display
 */
export const USER_ABSENCE_SELECT = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  department: true,
  title: true,
} as const satisfies Prisma.UserSelect;

// Type helpers for inferred types from select objects

/**
 * Type for public user data (safe for all users)
 */
export type UserPublic = Prisma.UserGetPayload<{
  select: typeof USER_PUBLIC_SELECT;
}>;

/**
 * Type for sensitive user data (managers and self only)
 */
export type UserSensitive = Prisma.UserGetPayload<{
  select: typeof USER_SENSITIVE_SELECT;
}>;

/**
 * Type for user card data (minimal display)
 */
export type UserCard = Prisma.UserGetPayload<{
  select: typeof USER_CARD_SELECT;
}>;

/**
 * Type for user data in feedback context
 */
export type UserFeedback = Prisma.UserGetPayload<{
  select: typeof USER_FEEDBACK_SELECT;
}>;

/**
 * Type for user data in absence request context
 */
export type UserAbsence = Prisma.UserGetPayload<{
  select: typeof USER_ABSENCE_SELECT;
}>;
