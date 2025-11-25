import { User } from '../../domain/entities/User';
import { UserDTO, UserWithSensitiveDTO } from '../dtos/UserDTO';

/**
 * Maps User domain entity to UserDTO
 * Handles both sensitive and non-sensitive field mapping
 */
export class UserDTOMapper {
  /**
   * Maps User to DTO with optional sensitive fields
   * @param user - User domain entity
   * @param includeSensitive - Whether to include sensitive fields
   * @returns UserDTO with appropriate fields based on permissions
   */
  static toDTO(user: User, includeSensitive: boolean = false): UserDTO | UserWithSensitiveDTO {
    const baseDTO: UserDTO = {
      id: user.id,
      email: user.email.value,
      name: user.name,
      role: user.role,
      department: user.department,
      position: user.position,
      title: user.title,
      bio: user.bio,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      country: user.country,
      deletedAt: user.deletedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    if (includeSensitive) {
      return {
        ...baseDTO,
        salary: user.salary,
        ssn: user.ssn?.getPlaintext(),
        dateOfBirth: user.dateOfBirth,
        hireDate: user.hireDate,
        emergencyContactName: user.emergencyContactName,
        emergencyContactPhone: user.emergencyContactPhone,
        performanceRating: user.performanceRating,
      };
    }

    return baseDTO;
  }

  /**
   * Maps array of Users to DTOs
   * @param users - Array of User domain entities
   * @param includeSensitive - Whether to include sensitive fields
   * @returns Array of UserDTOs
   */
  static toDTOArray(users: User[], includeSensitive: boolean = false): UserDTO[] {
    return users.map(user => this.toDTO(user, includeSensitive));
  }
}
