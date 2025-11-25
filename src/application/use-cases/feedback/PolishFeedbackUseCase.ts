import { IFeedbackRepository } from '../../../domain/repositories/IFeedbackRepository';
import { IAIService } from '../../ports/IAIService';
import { ILogger } from '../../ports/ILogger';
import { FeedbackDTO } from '../../dtos/FeedbackDTO';

export interface PolishFeedbackInput {
  feedbackId?: string;
  content?: string;
  userId: string;
}

/**
 * Polish Feedback Use Case
 * Polishes feedback content using AI to make it more professional
 */
export class PolishFeedbackUseCase {
  constructor(
    private readonly feedbackRepository: IFeedbackRepository,
    private readonly aiService: IAIService,
    private readonly logger: ILogger
  ) {}

  async execute(input: PolishFeedbackInput): Promise<FeedbackDTO | { polishedContent: string }> {
    this.logger.info({ feedbackId: input.feedbackId, userId: input.userId }, 'Polishing feedback');

    if (!this.aiService.isAvailable()) {
      this.logger.warn('AI service not available for polishing');
      throw new Error('AI service is not configured');
    }

    // Case 1: Polish existing feedback (has feedbackId)
    if (input.feedbackId) {
      const feedback = await this.feedbackRepository.findById(input.feedbackId);
      if (!feedback) {
        throw new Error('Feedback not found');
      }

      // Only the giver can polish their own feedback
      if (feedback.giverId !== input.userId) {
        throw new Error('You can only polish your own feedback');
      }

      // Polish using AI service
      const polishedContent = await this.aiService.polishFeedback(feedback.content);

      // Update feedback with polished content
      feedback.polishContent(polishedContent);

      // Save
      const saved = await this.feedbackRepository.save(feedback);

      this.logger.info({ feedbackId: saved.id }, 'Feedback polished successfully');

      return {
        id: saved.id,
        giverId: saved.giverId,
        receiverId: saved.receiverId,
        content: saved.content,
        polishedContent: saved.polishedContent,
        isPolished: saved.isPolished,
        deletedAt: saved.deletedAt,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
    }

    // Case 2: Polish content before creating feedback (has content)
    if (!input.content) {
      throw new Error('Either feedbackId or content must be provided');
    }

    const polishedContent = await this.aiService.polishFeedback(input.content);

    this.logger.info({ userId: input.userId }, 'Content polished successfully');

    return { polishedContent };
  }
}
