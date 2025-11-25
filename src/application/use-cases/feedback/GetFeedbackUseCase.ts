import { IFeedbackRepository } from '../../../domain/repositories/IFeedbackRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';
import { FeedbackDTO } from '../../dtos/FeedbackDTO';

export interface GetFeedbackInput {
  userId: string; // User requesting the feedback
  targetUserId?: string; // Optional: get feedback for specific user
  asGiver?: boolean; // Get feedback given by targetUserId
  asReceiver?: boolean; // Get feedback received by targetUserId
  skip?: number;
  take?: number;
}

export interface GetFeedbackOutput {
  feedback: FeedbackDTO[];
  total: number;
}

/**
 * Get Feedback Use Case
 * Retrieves feedback with appropriate filtering
 */
export class GetFeedbackUseCase {
  constructor(
    private readonly feedbackRepository: IFeedbackRepository,
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: GetFeedbackInput): Promise<GetFeedbackOutput> {
    this.logger.debug({ userId: input.userId }, 'Getting feedback');

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    let result: { feedbacks: any[]; total: number };

    if (input.targetUserId) {
      // Get feedback for specific user
      if (input.asGiver) {
        result = await this.feedbackRepository.findByGiverId(input.targetUserId, {
          skip: input.skip,
          take: input.take,
        });
      } else {
        result = await this.feedbackRepository.findByReceiverId(input.targetUserId, {
          skip: input.skip,
          take: input.take,
        });
      }
    } else {
      // Get all feedback (requires manager permissions)
      if (!user.isManager()) {
        throw new Error('Only managers can view all feedback');
      }
      result = await this.feedbackRepository.findAll({
        skip: input.skip,
        take: input.take,
      });
    }

    const feedback = result.feedbacks.map((f: any) => ({
      id: f.id,
      giverId: f.giverId,
      receiverId: f.receiverId,
      content: f.content,
      polishedContent: f.polishedContent,
      isPolished: f.isPolished,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));

    return { feedback, total: result.total };
  }
}
