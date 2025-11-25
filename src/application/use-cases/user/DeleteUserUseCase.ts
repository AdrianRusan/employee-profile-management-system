import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';
import { UserDTO } from '../../dtos/UserDTO';

export interface DeleteUserInput {
  userId: string; // User to delete
  requesterId: string; // User making the request
}

/**
 * Delete User Use Case
 * Soft deletes a user account
 *
 * Business Rules:
 * - Managers can only delete users in their department
 * - Users cannot delete themselves
 * - Deleted users can be restored later (soft delete)
 */
export class DeleteUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: DeleteUserInput): Promise<UserDTO> {
    this.logger.info(
      { userId: input.userId, requesterId: input.requesterId },
      'Deleting user'
    );

    // Get requester
    const requester = await this.userRepository.findById(input.requesterId);
    if (!requester) {
      throw new Error('Requester not found');
    }

    // Get target user
    const targetUser = await this.userRepository.findById(input.userId);
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Check if user is already deleted
    if (targetUser.isDeleted()) {
      throw new Error('User is already deleted');
    }

    // Check permissions using domain logic
    if (!requester.canDeleteUser(targetUser)) {
      throw new Error('You do not have permission to delete this user');
    }

    // Soft delete the user (domain logic)
    targetUser.softDelete();

    // Save
    const saved = await this.userRepository.save(targetUser);

    this.logger.info({ userId: saved.id }, 'User deleted successfully');

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
