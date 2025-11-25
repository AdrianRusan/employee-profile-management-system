import { IAbsenceRepository } from '../../../domain/repositories/IAbsenceRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';
import { AbsenceDTO } from '../../dtos/AbsenceDTO';

export interface ApproveAbsenceInput {
  absenceId: string;
  approverId: string;
}

/**
 * Approve Absence Use Case
 *
 * Approves a pending absence request.
 *
 * Business Rules:
 * - Only users with approval permissions can approve absences
 * - Managers can only approve absences in their department
 * - Only pending absences can be approved
 * - Approver cannot be the absence requester
 */
export class ApproveAbsenceUseCase {
  constructor(
    private readonly absenceRepository: IAbsenceRepository,
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: ApproveAbsenceInput): Promise<AbsenceDTO> {
    this.logger.info(
      { absenceId: input.absenceId, approverId: input.approverId },
      'Approving absence request'
    );

    // 1. Verify approver exists and has permission
    const approver = await this.userRepository.findById(input.approverId);
    if (!approver) {
      throw new Error('Approver not found');
    }

    if (approver.isDeleted()) {
      throw new Error('Approver account is deleted');
    }

    if (!approver.canApproveAbsences()) {
      throw new Error('User does not have permission to approve absences');
    }

    // 2. Get absence
    const absence = await this.absenceRepository.findById(input.absenceId);
    if (!absence) {
      throw new Error('Absence not found');
    }

    if (absence.isDeleted()) {
      throw new Error('Cannot approve deleted absence');
    }

    // 3. Get absence owner
    const owner = await this.userRepository.findById(absence.userId);
    if (!owner) {
      throw new Error('Absence owner not found');
    }

    // 4. Check if approver can approve this specific absence
    // Managers can only approve absences in their department
    if (approver.isManager()) {
      if (approver.department !== owner.department) {
        throw new Error('Managers can only approve absences in their department');
      }
    }

    // 5. Prevent self-approval
    if (approver.id === owner.id) {
      throw new Error('Cannot approve your own absence request');
    }

    // 6. Approve absence (this validates it's in pending status)
    absence.approve();

    // 7. Save
    const saved = await this.absenceRepository.save(absence);

    this.logger.info(
      { absenceId: saved.id, status: saved.status },
      'Absence request approved successfully'
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
