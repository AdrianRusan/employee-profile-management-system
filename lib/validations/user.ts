import { z } from 'zod';

/**
 * Validation schema for non-sensitive profile fields
 * Used by employees and managers for basic profile updates
 */
export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters').optional(),
  department: z.string().min(1, 'Department is required').max(100, 'Department must be less than 100 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatar: z.string().nullable().optional(),
});

/**
 * Validation schema for sensitive profile fields
 * Only accessible by managers
 */
export const sensitiveProfileSchema = z.object({
  salary: z.number().positive('Salary must be a positive number').optional(),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'SSN must be in format XXX-XX-XXXX').optional(),
  address: z.string().max(300, 'Address must be less than 300 characters').optional(),
  performanceRating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5').optional(),
});

/**
 * Complete profile schema combining non-sensitive and sensitive fields
 */
export const completeProfileSchema = profileSchema.merge(sensitiveProfileSchema);

/**
 * TypeScript types inferred from Zod schemas
 */
export type ProfileFormData = z.infer<typeof profileSchema>;
export type SensitiveProfileFormData = z.infer<typeof sensitiveProfileSchema>;
export type CompleteProfileFormData = z.infer<typeof completeProfileSchema>;

/**
 * Schema for profile ID parameter
 */
export const profileIdSchema = z.object({
  id: z.string().cuid('Invalid user ID format'),
});

/**
 * Schema for paginated profile list requests
 */
export const profileListSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().cuid().optional(),
  search: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'COWORKER']).optional(),
});

export type ProfileListInput = z.infer<typeof profileListSchema>;
