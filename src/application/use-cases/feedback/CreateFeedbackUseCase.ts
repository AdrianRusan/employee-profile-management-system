import { IFeedbackRepository } from '../../../domain/repositories/IFeedbackRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';
import { Feedback } from '../../../domain/entities/Feedback';
import { FeedbackDTO } from '../../dtos/FeedbackDTO';

export interface CreateFeedbackInput {
  giverId: string;
  receiverId: string;
  content: string;
  polishedContent?: string;
  isPolished?: boolean;
}

/**
 * Create Feedback Use Case
 * Creates new feedback from one user to another
 */
export class CreateFeedbackUseCase {
  constructor(
    private readonly feedbackRepository: IFeedbackRepository,
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: CreateFeedbackInput): Promise<FeedbackDTO> {
    this.logger.info({ giverId: input.giverId, receiverId: input.receiverId }, 'Creating feedback');

    // Verify both users exist
    const giver = await this.userRepository.findById(input.giverId);
    if (!giver) {
      throw new Error('Giver not found');
    }

    const receiver = await this.userRepository.findById(input.receiverId);
    if (!receiver) {
      throw new Error('Receiver not found');
    }

    if (giver.isDeleted() || receiver.isDeleted()) {
      throw new Error('Cannot create feedback for deleted users');
    }

    // Create feedback entity (validates business rules)
    const feedback = Feedback.create(input.giverId, input.receiverId, input.content);

    // Apply polished content if provided
    if (input.polishedContent && input.isPolished) {
      feedback.polishContent(input.polishedContent);
    }

    // Save
    const saved = await this.feedbackRepository.save(feedback);

    this.logger.info({ feedbackId: saved.id }, 'Feedback created successfully');

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
}
