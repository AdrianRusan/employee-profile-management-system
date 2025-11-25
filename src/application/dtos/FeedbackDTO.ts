/**
 * Input DTO for creating feedback
 */
export interface CreateFeedbackDTO {
  giverId: string;
  receiverId: string;
  content: string;
}

/**
 * Input DTO for polishing feedback
 */
export interface PolishFeedbackDTO {
  feedbackId: string;
  userId: string;
}

/**
 * Output DTO for feedback data
 */
export interface FeedbackDTO {
  id: string;
  giverId: string;
  receiverId: string;
  content: string;
  polishedContent?: string;
  isPolished: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Output DTO for feedback with user information
 */
export interface FeedbackWithUsersDTO extends FeedbackDTO {
  giver: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  receiver: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

/**
 * Output DTO for feedback statistics
 */
export interface FeedbackStatisticsDTO {
  totalGiven: number;
  totalReceived: number;
  polishedCount: number;
}
