import { z } from "zod";

/**
 * Zod schema for creating an absence request
 * Includes comprehensive validation:
 * - Start date must be today or future (no past dates)
 * - End date must be on or after start date
 * - Absence period cannot exceed 1 year
 * - Reason must be 10-500 characters
 */
export const absenceRequestSchema = z
  .object({
    startDate: z.coerce.date().refine(
      (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      { message: "Start date cannot be in the past" }
    ),
    endDate: z.coerce.date(),
    reason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(500, "Reason must not exceed 500 characters"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      const daysDiff = Math.ceil(
        (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff <= 365;
    },
    {
      message: "Absence period cannot exceed 1 year",
      path: ["endDate"],
    }
  );

/**
 * Schema for form validation (client-side)
 * Uses Date type directly for React Hook Form compatibility
 * Includes same validation rules as backend schema
 */
export const absenceRequestFormSchema = z
  .object({
    startDate: z.date().refine(
      (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      { message: "Start date cannot be in the past" }
    ),
    endDate: z.date(),
    reason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(500, "Reason must not exceed 500 characters"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      const daysDiff = Math.ceil(
        (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff <= 365;
    },
    {
      message: "Absence period cannot exceed 1 year",
      path: ["endDate"],
    }
  );

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
