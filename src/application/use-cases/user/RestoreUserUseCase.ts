import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';
import { UserDTO } from '../../dtos/UserDTO';

export interface RestoreUserInput {
  userId: string; // User to restore
  requesterId: string; // User making the request
}

/**
 * Restore User Use Case
 * Restores a soft-deleted user account
 *
 * Business Rules:
 * - Only managers can restore users in their department
 * - User must be soft-deleted to be restored
 */
export class RestoreUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: RestoreUserInput): Promise<UserDTO> {
    this.logger.info(
      { userId: input.userId, requesterId: input.requesterId },
      'Restoring user'
    );

    // Get requester
    const requester = await this.userRepository.findById(input.requesterId);
    if (!requester) {
      throw new Error('Requester not found');
    }

    // Get target user (including deleted)
    const targetUser = await this.userRepository.findById(input.userId);
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Check if user is deleted
    if (!targetUser.isDeleted()) {
      throw new Error('User is not deleted');
    }

    // Check permissions - only managers can restore users
    if (!requester.isManager()) {
      throw new Error('You do not have permission to restore users');
    }

    // Managers can only restore users in their department
    if (requester.department !== targetUser.department) {
      throw new Error('You can only restore users in your department');
    }

    // Restore the user (domain logic)
    targetUser.restore();

    // Save
    const saved = await this.userRepository.save(targetUser);

    this.logger.info({ userId: saved.id }, 'User restored successfully');

    // Return DTO
    return {
      id: saved.id,
      email: saved.email.value,
      name: saved.name,
      role: saved.role,
      department: saved.department,
      position: saved.position,
      title: saved.title,
      bio: saved.bio,
      avatar: saved.avatar,
      phoneNumber: saved.phoneNumber,
      address: saved.address,
      city: saved.city,
      state: saved.state,
      zipCode: saved.zipCode,
      country: saved.country,
      deletedAt: saved.deletedAt,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}
