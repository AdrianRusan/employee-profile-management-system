import { IAbsenceRepository } from '../../../domain/repositories/IAbsenceRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';

export interface DeleteAbsenceInput {
  absenceId: string;
  userId: string; // User requesting the deletion
}

/**
 * Delete Absence Use Case
 *
 * Soft deletes an absence request.
 *
 * Business Rules:
 * - Users can delete their own absence requests
 * - Managers can delete absences in their department
 * - Only pending or rejected absences can be deleted
 * - Approved absences require manager approval to delete
 */
export class DeleteAbsenceUseCase {
  constructor(
    private readonly absenceRepository: IAbsenceRepository,
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: DeleteAbsenceInput): Promise<void> {
    this.logger.info(
      { absenceId: input.absenceId, userId: input.userId },
      'Deleting absence request'
    );

    // 1. Verify user exists
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isDeleted()) {
      throw new Error('User account is deleted');
    }

    // 2. Get absence
    const absence = await this.absenceRepository.findById(input.absenceId);
    if (!absence) {
      throw new Error('Absence not found');
    }

    if (absence.isDeleted()) {
      throw new Error('Absence already deleted');
    }

    // 3. Get absence owner
    const owner = await this.userRepository.findById(absence.userId);
    if (!owner) {
      throw new Error('Absence owner not found');
    }

    // 4. Check permissions
    const canDelete = user.canDeleteUser(owner);
    const isOwn = user.id === absence.userId;

    // Business rule: Approved absences can only be deleted by managers
    if (absence.isApproved() && !user.isManager()) {
      throw new Error('Only managers can delete approved absences');
    }

    // Check if user has permission to delete
    if (!isOwn && !canDelete) {
      throw new Error('You do not have permission to delete this absence');
    }

    // 5. Soft delete the absence
    absence.softDelete();

    // 6. Save
    await this.absenceRepository.save(absence);

    this.logger.info(
      { absenceId: absence.id },
      'Absence request deleted successfully'
    );
  }
}
