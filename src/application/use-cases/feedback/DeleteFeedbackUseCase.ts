import { IFeedbackRepository } from '../../../domain/repositories/IFeedbackRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';

export interface DeleteFeedbackInput {
  feedbackId: string;
  userId: string; // User requesting deletion
}

/**
 * Delete Feedback Use Case
 * Soft deletes feedback
 *
 * Business Rules:
 * - Only the feedback giver can delete their own feedback
 * - Managers can delete feedback in their department
 * - Feedback is soft-deleted (can be restored later if needed)
 */
export class DeleteFeedbackUseCase {
  constructor(
    private readonly feedbackRepository: IFeedbackRepository,
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: DeleteFeedbackInput): Promise<void> {
    this.logger.info(
      { feedbackId: input.feedbackId, userId: input.userId },
      'Deleting feedback'
    );

    // Get the user
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get the feedback
    const feedback = await this.feedbackRepository.findById(input.feedbackId);
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    // Check if already deleted
    if (feedback.isDeleted()) {
      throw new Error('Feedback is already deleted');
    }

    // Check permissions
    const isGiver = feedback.isFromUser(user.id);
    const isManager = user.isManager();

    if (!isGiver && !isManager) {
      throw new Error('You do not have permission to delete this feedback');
    }

    // If manager (and not the giver), check if both giver and receiver are in their department
    if (isManager && !isGiver) {
      const giver = await this.userRepository.findById(feedback.giverId);
      const receiver = await this.userRepository.findById(feedback.receiverId);

      if (!giver || !receiver) {
        throw new Error('Associated users not found');
      }

      // SECURITY: Verify organization boundary BEFORE department check
      if (user.organizationId !== giver.organizationId || user.organizationId !== receiver.organizationId) {
        this.logger.warn(
          {
            userId: user.id,
            userOrg: user.organizationId,
            giverOrg: giver.organizationId,
            receiverOrg: receiver.organizationId,
          },
          'Cross-organization feedback deletion attempt blocked'
        );
        throw new Error('Cannot delete feedback from different organizations');
      }

      const isInDepartment =
        (giver.department === user.department) ||
        (receiver.department === user.department);

      if (!isInDepartment) {
        throw new Error('You can only delete feedback within your department');
      }
    }

    // Soft delete the feedback
    feedback.softDelete();

    // Save
    await this.feedbackRepository.save(feedback);

    this.logger.info({ feedbackId: feedback.id }, 'Feedback deleted successfully');
  }
}
