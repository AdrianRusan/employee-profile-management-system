import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';
import { UserDTO } from '../../dtos/UserDTO';

export interface UpdateUserProfileInput {
  userId: string;
  requesterId: string;
  name?: string;
  department?: string;
  position?: string;
  title?: string;
  bio?: string;
  avatar?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/**
 * Update User Profile Use Case
 * Updates non-sensitive user profile information
 */
export class UpdateUserProfileUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: UpdateUserProfileInput): Promise<UserDTO> {
    this.logger.info({ userId: input.userId, requesterId: input.requesterId }, 'Updating user profile');

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const requester = await this.userRepository.findById(input.requesterId);
    if (!requester) {
      throw new Error('Requester not found');
    }

    // Check permissions
    if (!requester.canEditProfile(user)) {
      throw new Error('You do not have permission to edit this profile');
    }

    // Update profile using domain entity method
    user.updateProfile({
      name: input.name,
      department: input.department,
      position: input.position,
      title: input.title,
      bio: input.bio,
      avatar: input.avatar,
      phoneNumber: input.phoneNumber,
      address: input.address,
      city: input.city,
      state: input.state,
      zipCode: input.zipCode,
      country: input.country,
    });

    const saved = await this.userRepository.save(user);

    this.logger.info({ userId: saved.id }, 'User profile updated successfully');

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
