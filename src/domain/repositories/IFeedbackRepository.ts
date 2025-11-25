import { Feedback } from '../entities/Feedback';

/**
 * Feedback Repository Interface
 * Defines contract for feedback persistence without implementation details
 */
export interface IFeedbackRepository {
  /**
   * Find feedback by ID
   */
  findById(id: string): Promise<Feedback | null>;

  /**
   * Find feedback given by a user
   */
  findByGiverId(
    giverId: string,
    options?: {
      includeDeleted?: boolean;
      skip?: number;
      take?: number;
    }
  ): Promise<{ feedbacks: Feedback[]; total: number }>;

  /**
   * Find feedback received by a user
   */
  findByReceiverId(
    receiverId: string,
    options?: {
      includeDeleted?: boolean;
      skip?: number;
      take?: number;
    }
  ): Promise<{ feedbacks: Feedback[]; total: number }>;

  /**
   * Find all feedback with filtering
   */
  findAll(options?: {
    includeDeleted?: boolean;
    isPolished?: boolean;
    skip?: number;
    take?: number;
  }): Promise<{ feedbacks: Feedback[]; total: number }>;

  /**
   * Save feedback (create or update)
   */
  save(feedback: Feedback): Promise<Feedback>;

  /**
   * Delete feedback permanently
   */
  delete(id: string): Promise<void>;

  /**
   * Get feedback statistics
   */
  getStatistics(userId: string): Promise<{
    givenCount: number;
    receivedCount: number;
    polishedCount: number;
  }>;
}
