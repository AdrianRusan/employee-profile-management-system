import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';
import { IEncryption } from '../../ports/IEncryption';
import { EncryptedField } from '../../../domain/value-objects/EncryptedField';
import { UserDTO } from '../../dtos/UserDTO';

export interface UpdateSensitiveFieldsInput {
  userId: string; // User to update
  requesterId: string; // User making the request
  salary?: number;
  ssn?: string; // Plain text SSN (will be encrypted)
  dateOfBirth?: Date;
  performanceRating?: number;
}

/**
 * Update Sensitive Fields Use Case
 * Updates sensitive user fields (only by authorized managers in same department)
 *
 * Business Rules:
 * - Managers can only update sensitive fields for users in their department
 * - Users cannot update their own sensitive fields
 * - SSN is encrypted before storage
 */
export class UpdateSensitiveFieldsUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly encryption: IEncryption,
    private readonly logger: ILogger
  ) {}

  async execute(input: UpdateSensitiveFieldsInput): Promise<UserDTO> {
    this.logger.info(
      { userId: input.userId, requesterId: input.requesterId },
      'Updating sensitive fields'
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

    // Check permissions - Only managers can update sensitive fields
    if (!requester.isManager()) {
      throw new Error('You do not have permission to update sensitive fields');
    }

    // Managers can only update their department
    if (requester.department !== targetUser.department) {
      throw new Error('You can only update sensitive fields for users in your department');
    }

    // Users cannot update their own sensitive fields (requires Manager approval)
    if (requester.id === targetUser.id) {
      throw new Error('You cannot update your own sensitive fields');
    }

    // Prepare updates
    const updates: {
      salary?: number;
      ssn?: EncryptedField<string>;
      performanceRating?: number;
    } = {};

    if (input.salary !== undefined) {
      updates.salary = input.salary;
    }

    if (input.ssn !== undefined) {
      // Create encrypted field for SSN
      updates.ssn = EncryptedField.fromPlaintext(input.ssn);
    }

    if (input.performanceRating !== undefined) {
      updates.performanceRating = input.performanceRating;
    }

    // Apply updates (domain validation happens here)
    targetUser.updateSensitiveFields(updates);

    // Save
    const saved = await this.userRepository.save(targetUser);

    this.logger.info({ userId: saved.id }, 'Sensitive fields updated successfully');

    // Return DTO (without sensitive fields)
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
