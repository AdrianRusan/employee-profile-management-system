import { IAbsenceRepository } from '../../../domain/repositories/IAbsenceRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';
import { Absence } from '../../../domain/entities/Absence';
import { DateRange } from '../../../domain/value-objects/DateRange';
import { CreateAbsenceDTO, AbsenceDTO } from '../../dtos/AbsenceDTO';

/**
 * CreateAbsenceUseCase
 * Handles the business logic for creating an absence request
 *
 * Responsibilities:
 * - Validate user exists and is active
 * - Create absence with business rules validation
 * - Check for overlapping absences
 * - Persist the absence request
 */
export class CreateAbsenceUseCase {
  constructor(
    private readonly absenceRepository: IAbsenceRepository,
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: CreateAbsenceDTO): Promise<AbsenceDTO> {
    this.logger.info(
      { userId: input.userId, startDate: input.startDate, endDate: input.endDate },
      'Creating absence request'
    );

    try {
      // 1. Verify user exists and is active
      const user = await this.userRepository.findById(input.userId);
      if (!user) {
        this.logger.warn({ userId: input.userId }, 'User not found');
        throw new Error('User not found');
      }

      if (user.isDeleted()) {
        this.logger.warn({ userId: input.userId }, 'Cannot create absence for deleted user');
        throw new Error('Cannot create absence for deleted user');
      }

      // 2. Create date range - this validates date business rules
      // (end >= start, max duration, etc.)
      const dateRange = DateRange.create(input.startDate, input.endDate);

      // 3. Create absence entity - this validates reason length, etc.
      const absence = Absence.create(input.userId, dateRange, input.reason);

      // 4. Check for overlapping absences
      this.logger.debug({ userId: input.userId }, 'Checking for overlapping absences');

      const overlapping = await this.absenceRepository.findOverlapping(
        input.userId,
        dateRange
      );

      // Use domain logic to check overlaps
      for (const existing of overlapping) {
        if (absence.overlapsWith(existing)) {
          const errorMsg = `Absence request overlaps with existing ${existing.status} request from ${existing.dateRange.start.toISOString().split('T')[0]} to ${existing.dateRange.end.toISOString().split('T')[0]}`;
          this.logger.warn(
            {
              userId: input.userId,
              conflictingAbsenceId: existing.id,
            },
            'Absence overlap detected'
          );
          throw new Error(errorMsg);
        }
      }

      // 5. Save the absence
      const saved = await this.absenceRepository.save(absence);

      this.logger.info(
        {
          absenceId: saved.id,
          userId: saved.userId,
          workingDays: saved.getWorkingDays(),
        },
        'Absence request created successfully'
      );

      // 6. Return DTO (not domain entity)
      return this.toDTO(saved);
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        'Failed to create absence request'
      );
      throw error;
    }
  }

  /**
   * Convert domain entity to DTO
   */
  private toDTO(absence: Absence): AbsenceDTO {
    return {
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
    };
  }
}
