import { IAbsenceRepository } from '../../../domain/repositories/IAbsenceRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';

export interface GetAbsenceStatisticsInput {
  userId: string;
}

export interface GetAbsenceStatisticsOutput {
  totalDays: number;
  approvedDays: number;
  pendingRequests: number;
  rejectedRequests: number;
  totalRequests: number;
}

/**
 * Get Absence Statistics Use Case
 *
 * Retrieves statistics about a user's absence requests.
 *
 * Business Rules:
 * - Statistics include all non-deleted absences
 * - Days are calculated based on working days (excluding weekends)
 * - Approved days count only approved absences
 */
export class GetAbsenceStatisticsUseCase {
  constructor(
    private readonly absenceRepository: IAbsenceRepository,
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: GetAbsenceStatisticsInput): Promise<GetAbsenceStatisticsOutput> {
    this.logger.debug({ userId: input.userId }, 'Getting absence statistics');

    // 1. Verify user exists
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 2. Get statistics from repository
    const stats = await this.absenceRepository.getStatistics(input.userId);

    this.logger.info(
      { userId: input.userId, stats },
      'Absence statistics retrieved successfully'
    );

    return {
      ...stats,
      totalRequests: stats.pendingRequests + stats.rejectedRequests,
    };
  }
}
