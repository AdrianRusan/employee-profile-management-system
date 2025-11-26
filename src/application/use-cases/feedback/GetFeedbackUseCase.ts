import { IFeedbackRepository } from '../../../domain/repositories/IFeedbackRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';
import { FeedbackWithUsersDTO } from '../../dtos/FeedbackDTO';
import { Feedback } from '../../../domain/entities/Feedback';

export interface GetFeedbackInput {
  userId: string; // User requesting the feedback
  targetUserId?: string; // Optional: get feedback for specific user
  asGiver?: boolean; // Get feedback given by targetUserId
  asReceiver?: boolean; // Get feedback received by targetUserId
  skip?: number;
  take?: number;
}

export interface GetFeedbackOutput {
  feedback: FeedbackWithUsersDTO[];
  total: number;
}

/**
 * Get Feedback Use Case
 * Retrieves feedback with appropriate filtering and user enrichment
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

    let result: { feedbacks: Feedback[]; total: number };

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

    // Collect unique user IDs to fetch
    const userIds = new Set<string>();
    result.feedbacks.forEach((f) => {
      userIds.add(f.giverId);
      userIds.add(f.receiverId);
    });

    // Batch fetch all users
    const usersMap = new Map<string, { id: string; name: string; email: string; avatar?: string }>();
    await Promise.all(
      Array.from(userIds).map(async (id) => {
        const fetchedUser = await this.userRepository.findById(id);
        if (fetchedUser) {
          usersMap.set(id, {
            id: fetchedUser.id,
            name: fetchedUser.name,
            email: fetchedUser.email.value,
            avatar: fetchedUser.avatar,
          });
        }
      })
    );

    // Enrich feedback with user data
    const feedback: FeedbackWithUsersDTO[] = result.feedbacks.map((f) => {
      const giver = usersMap.get(f.giverId);
      const receiver = usersMap.get(f.receiverId);

      return {
        id: f.id,
        giverId: f.giverId,
        receiverId: f.receiverId,
        content: f.content,
        polishedContent: f.polishedContent,
        isPolished: f.isPolished,
        deletedAt: f.deletedAt,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        giver: giver || { id: f.giverId, name: 'Unknown User', email: '' },
        receiver: receiver || { id: f.receiverId, name: 'Unknown User', email: '' },
      };
    });

    return { feedback, total: result.total };
  }
}
