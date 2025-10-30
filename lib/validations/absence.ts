import { z } from "zod";

/**
 * Zod schema for creating an absence request
 * Includes cross-field validation ensuring endDate is after startDate
 */
export const absenceRequestSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(500, "Reason must not exceed 500 characters"),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

/**
 * Schema for form validation (client-side)
 * Uses Date type directly for React Hook Form compatibility
 */
export const absenceRequestFormSchema = z
  .object({
    startDate: z.date(),
    endDate: z.date(),
    reason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(500, "Reason must not exceed 500 characters"),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

/**
 * Zod schema for updating absence request status
 */
export const updateAbsenceStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["APPROVED", "REJECTED"]),
});

/**
 * TypeScript types inferred from Zod schemas
 */
export type AbsenceRequestInput = z.infer<typeof absenceRequestSchema>;
export type AbsenceRequestFormInput = z.infer<typeof absenceRequestFormSchema>;
export type UpdateAbsenceStatusInput = z.infer<typeof updateAbsenceStatusSchema>;
