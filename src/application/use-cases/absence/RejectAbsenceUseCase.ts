import { IAbsenceRepository } from '../../../domain/repositories/IAbsenceRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';
import { AbsenceDTO } from '../../dtos/AbsenceDTO';

export interface RejectAbsenceInput {
  absenceId: string;
  rejectorId: string;
}

/**
 * Reject Absence Use Case
 *
 * Rejects a pending absence request.
 *
 * Business Rules:
 * - Only users with approval permissions can reject absences
 * - Managers can only reject absences in their department
 * - Only pending absences can be rejected
 * - Rejector cannot be the absence requester
 */
export class RejectAbsenceUseCase {
  constructor(
    private readonly absenceRepository: IAbsenceRepository,
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: RejectAbsenceInput): Promise<AbsenceDTO> {
    this.logger.info(
      { absenceId: input.absenceId, rejectorId: input.rejectorId },
      'Rejecting absence request'
    );

    // 1. Verify rejector exists and has permission
    const rejector = await this.userRepository.findById(input.rejectorId);
    if (!rejector) {
      throw new Error('Rejector not found');
    }

    if (rejector.isDeleted()) {
      throw new Error('Rejector account is deleted');
    }

    if (!rejector.canApproveAbsences()) {
      throw new Error('User does not have permission to reject absences');
    }

    // 2. Get absence
    const absence = await this.absenceRepository.findById(input.absenceId);
    if (!absence) {
      throw new Error('Absence not found');
    }

    if (absence.isDeleted()) {
      throw new Error('Cannot reject deleted absence');
    }

    // 3. Get absence owner
    const owner = await this.userRepository.findById(absence.userId);
    if (!owner) {
      throw new Error('Absence owner not found');
    }

    // 4. Check if rejector can reject this specific absence
    // Managers can only reject absences in their department
    if (rejector.isManager()) {
      if (rejector.department !== owner.department) {
        throw new Error('Managers can only reject absences in their department');
      }
    }

    // 5. Prevent self-rejection
    if (rejector.id === owner.id) {
      throw new Error('Cannot reject your own absence request');
    }

    // 6. Reject absence (this validates it's in pending status)
    absence.reject();

    // 7. Save
    const saved = await this.absenceRepository.save(absence);

    this.logger.info(
      { absenceId: saved.id, status: saved.status },
      'Absence request rejected successfully'
    );

    // 8. Return DTO
    return {
      id: saved.id,
      userId: saved.userId,
      startDate: saved.dateRange.start,
      endDate: saved.dateRange.end,
      reason: saved.reason,
      status: saved.status,
      workingDays: saved.getWorkingDays(),
      totalDays: saved.getTotalDays(),
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
      deletedAt: saved.deletedAt,
    };
  }
}
