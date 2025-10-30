import { z } from "zod";

/**
 * Feedback validation schema
 * Validates feedback submission data including receiver and content
 */
export const feedbackSchema = z.object({
  receiverId: z.string().cuid("Invalid receiver ID format"),
  content: z
    .string()
    .min(10, "Feedback must be at least 10 characters long")
    .max(2000, "Feedback must not exceed 2000 characters"),
});

/**
 * TypeScript type inferred from feedback schema
 */
export type FeedbackFormData = z.infer<typeof feedbackSchema>;

/**
 * Schema for polishing feedback with AI
 */
export const polishFeedbackSchema = z.object({
  content: z.string().min(10).max(2000),
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
