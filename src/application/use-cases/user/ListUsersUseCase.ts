import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';
import { UserDTO } from '../../dtos/UserDTO';
import { UserDTOMapper } from '../../mappers/UserDTOMapper';

export interface ListUsersInput {
  requesterId: string;
  department?: string;
  includeDeleted?: boolean;
  includeSensitive?: boolean;
  skip?: number;
  take?: number;
}

export interface ListUsersOutput {
  users: UserDTO[];
  total: number;
  nextCursor?: string;
}

/**
 * List Users Use Case
 * Retrieves all users with filtering and pagination
 */
export class ListUsersUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: ListUsersInput): Promise<ListUsersOutput> {
    this.logger.debug({ requesterId: input.requesterId }, 'Listing users');

    const requester = await this.userRepository.findById(input.requesterId);
    if (!requester) {
      throw new Error('Requester not found');
    }

    const result = await this.userRepository.findAll({
      department: input.department,
      includeDeleted: input.includeDeleted,
      includeSensitive: input.includeSensitive && requester.canViewSensitiveDataOf(requester),
      skip: input.skip,
      take: input.take,
    });

    const users = result.users.map(user => {
      const canViewSensitive = input.includeSensitive && requester.canViewSensitiveDataOf(user);
      return UserDTOMapper.toDTO(user, canViewSensitive);
    });

    // Calculate next cursor for pagination
    const hasMore = (input.skip || 0) + (input.take || 0) < result.total;
    const nextCursor = hasMore && input.take
      ? ((input.skip || 0) + input.take).toString()
      : undefined;

    return { users, total: result.total, nextCursor };
  }
}
