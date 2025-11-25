import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';
import { UserDTO } from '../../dtos/UserDTO';
import { UserDTOMapper } from '../../mappers/UserDTOMapper';

export interface GetUserInput {
  userId: string;
  requesterId: string;
  includeSensitive?: boolean;
}

/**
 * Get User Use Case
 * Retrieves a single user by ID with appropriate permissions
 */
export class GetUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: GetUserInput): Promise<UserDTO> {
    this.logger.debug({ userId: input.userId, requesterId: input.requesterId }, 'Getting user');

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const requester = await this.userRepository.findById(input.requesterId);
    if (!requester) {
      throw new Error('Requester not found');
    }

    // Check permissions for sensitive data
    const canViewSensitive = input.includeSensitive && requester.canViewSensitiveDataOf(user);

    // Use mapper to convert to DTO with proper typing
    return UserDTOMapper.toDTO(user, canViewSensitive);
  }
}
