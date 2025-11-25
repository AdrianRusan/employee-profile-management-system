import { z } from "zod";
import { countWords } from "@/lib/utils";

/**
 * Feedback validation schema
 * Validates feedback submission data including receiver and content
 * Content requirements:
 * - Minimum 20 characters
 * - Maximum 2000 characters
 * - Minimum 5 words
 * - Cannot be generic single-word feedback
 */
export const feedbackSchema = z.object({
  receiverId: z.string().cuid("Invalid receiver ID format"),
  content: z
    .string()
    .trim()
    .min(20, "Feedback must be at least 20 characters long")
    .max(2000, "Feedback must not exceed 2000 characters")
    .refine(
      (val) => countWords(val) >= 5,
      { message: "Feedback must contain at least 5 words" }
    )
    .refine(
      (val) => !val.match(/^(ok|good|fine|nice|great)$/i),
      { message: "Please provide more detailed feedback" }
    ),
});

/**
 * TypeScript type inferred from feedback schema
 */
export type FeedbackFormData = z.infer<typeof feedbackSchema>;

/**
 * Schema for polishing feedback with AI
 * Uses the same validation rules as feedback submission
 */
export const polishFeedbackSchema = z.object({
  feedbackId: z.string().cuid("Invalid feedback ID format").optional(),
  content: z
    .string()
    .trim()
    .min(20, "Feedback must be at least 20 characters long")
    .max(2000, "Feedback must not exceed 2000 characters")
    .refine(
      (val) => countWords(val) >= 5,
      { message: "Feedback must contain at least 5 words" }
    ),
});

export type PolishFeedbackData = z.infer<typeof polishFeedbackSchema>;

/**
 * Schema for deleting feedback
 */
export const deleteFeedbackSchema = z.object({
  id: z.string().cuid("Invalid feedback ID format"),
});

export type DeleteFeedbackData = z.infer<typeof deleteFeedbackSchema>;

/**
 * Schema for fetching feedback for a specific user
 */
export const getFeedbackForUserSchema = z.object({
  userId: z.string().cuid("Invalid user ID format"),
});

export type GetFeedbackForUserData = z.infer<typeof getFeedbackForUserSchema>;
