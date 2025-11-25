import { User as PrismaUser, Role as PrismaRole, Prisma } from '@prisma/client';
import { User, Role } from '../../../../domain/entities/User';
import { Email } from '../../../../domain/value-objects/Email';
import { EncryptedField } from '../../../../domain/value-objects/EncryptedField';

/**
 * UserMapper
 * Converts between Prisma models and domain entities
 */
export class UserMapper {
  /**
   * Convert Prisma model to domain entity
   */
  static toDomain(prismaUser: PrismaUser): User {
    return User.reconstitute({
      id: prismaUser.id,
      email: Email.create(prismaUser.email),
      name: prismaUser.name,
      role: this.mapRole(prismaUser.role),
      department: prismaUser.department ?? undefined,
      position: prismaUser.position ?? undefined,
      title: prismaUser.title ?? undefined,
      bio: prismaUser.bio ?? undefined,
      avatar: prismaUser.avatar ?? undefined,
      phoneNumber: prismaUser.phoneNumber ?? undefined,
      address: prismaUser.address ?? undefined,
      city: prismaUser.city ?? undefined,
      state: prismaUser.state ?? undefined,
      zipCode: prismaUser.zipCode ?? undefined,
      country: prismaUser.country ?? undefined,
      salary: prismaUser.salary ? Number(prismaUser.salary) : undefined,
      ssn: prismaUser.ssn ? EncryptedField.fromEncrypted(prismaUser.ssn) : undefined,
      dateOfBirth: prismaUser.dateOfBirth ?? undefined,
      hireDate: prismaUser.hireDate ?? undefined,
      emergencyContactName: prismaUser.emergencyContactName ?? undefined,
      emergencyContactPhone: prismaUser.emergencyContactPhone ?? undefined,
      performanceRating: prismaUser.performanceRating ?? undefined,
      deletedAt: prismaUser.deletedAt ?? undefined,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }

  /**
   * Convert domain entity to Prisma model data
   */
  static toPrisma(user: User): Omit<PrismaUser, 'createdAt' | 'updatedAt'> {
    return {
      id: user.id,
      email: user.email.value,
      name: user.name,
      role: this.mapToPrismaRole(user.role),
      department: user.department ?? null,
      position: user.position ?? null,
      title: user.title ?? null,
      bio: user.bio ?? null,
      avatar: user.avatar ?? null,
      phoneNumber: user.phoneNumber ?? null,
      address: user.address ?? null,
      city: user.city ?? null,
      state: user.state ?? null,
      zipCode: user.zipCode ?? null,
      country: user.country ?? null,
      salary: user.salary !== undefined ? new Prisma.Decimal(user.salary) : null,
      ssn: user.ssn ? user.ssn.getEncrypted() : null,
      dateOfBirth: user.dateOfBirth ?? null,
      hireDate: user.hireDate ?? null,
      emergencyContactName: user.emergencyContactName ?? null,
      emergencyContactPhone: user.emergencyContactPhone ?? null,
      performanceRating: user.performanceRating ?? null,
      deletedAt: user.deletedAt ?? null,
    };
  }

  /**
   * Map Prisma role to domain role
   */
  private static mapRole(prismaRole: PrismaRole): Role {
    switch (prismaRole) {
      case 'EMPLOYEE':
        return Role.EMPLOYEE;
      case 'MANAGER':
        return Role.MANAGER;
      case 'COWORKER':
        return Role.COWORKER;
      default:
        throw new Error(`Unknown role: ${prismaRole}`);
    }
  }

  /**
   * Map domain role to Prisma role
   */
  private static mapToPrismaRole(role: Role): PrismaRole {
    switch (role) {
      case Role.EMPLOYEE:
        return 'EMPLOYEE';
      case Role.MANAGER:
        return 'MANAGER';
      case Role.COWORKER:
        return 'COWORKER';
      default:
        throw new Error(`Unknown role: ${role}`);
    }
  }
}
