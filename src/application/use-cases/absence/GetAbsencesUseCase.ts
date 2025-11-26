import { IAbsenceRepository } from '../../../domain/repositories/IAbsenceRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';
import { AbsenceDTO } from '../../dtos/AbsenceDTO';
import { AbsenceStatus } from '../../../domain/entities/Absence';

export interface GetAbsencesInput {
  userId?: string; // If provided, get absences for specific user
  status?: AbsenceStatus;
  includeDeleted?: boolean;
  skip?: number;
  take?: number;
  includeUser?: boolean;
  department?: string;
}

export interface GetAbsencesOutput {
  absences: AbsenceDTO[];
  total: number;
}

/**
 * Get Absences Use Case
 *
 * Retrieves absence requests with optional filtering and pagination.
 * Can retrieve all absences or filter by user and/or status.
 *
 * Business Rules:
 * - Only active users' absences are returned by default
 * - Deleted absences are excluded by default
 * - Results are ordered by start date (most recent first)
 */
export class GetAbsencesUseCase {
  constructor(
    private readonly absenceRepository: IAbsenceRepository,
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: GetAbsencesInput): Promise<GetAbsencesOutput> {
    this.logger.debug({ input }, 'Getting absences');

    let absences: AbsenceDTO[];
    let total: number;

    if (input.userId) {
      // Get absences for specific user
      const user = await this.userRepository.findById(input.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const result = await this.absenceRepository.findByUserId(input.userId, {
        status: input.status,
        includeDeleted: input.includeDeleted,
      });

      // Apply pagination manually since findByUserId doesn't support it directly
      const start = input.skip || 0;
      const end = input.take ? start + input.take : undefined;
      absences = result.slice(start, end).map((absence) => ({
        id: absence.id,
        userId: absence.userId,
        startDate: absence.dateRange.start,
        endDate: absence.dateRange.end,
        reason: absence.reason,
        status: absence.status,
        workingDays: absence.getWorkingDays(),
        totalDays: absence.getTotalDays(),
        createdAt: absence.createdAt,
        updatedAt: absence.updatedAt,
        deletedAt: absence.deletedAt,
      }));
      total = result.length;
    } else {
      // Get all absences
      const result = await this.absenceRepository.findAll({
        status: input.status,
        includeDeleted: input.includeDeleted,
        skip: input.skip,
        take: input.take,
        includeUser: input.includeUser,
        department: input.department,
      });

      absences = result.absences.map((absence, index) => ({
        id: absence.id,
        userId: absence.userId,
        startDate: absence.dateRange.start,
        endDate: absence.dateRange.end,
        reason: absence.reason,
        status: absence.status,
        workingDays: absence.getWorkingDays(),
        totalDays: absence.getTotalDays(),
        createdAt: absence.createdAt,
        updatedAt: absence.updatedAt,
        deletedAt: absence.deletedAt,
        user: result.users?.[index],
      }));
      total = result.total;
    }

    this.logger.info({ count: absences.length, total }, 'Absences retrieved successfully');

    return { absences, total };
  }
}
