import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { User } from '../../../../domain/entities/User';
import { Email } from '../../../../domain/value-objects/Email';
import { UserMapper } from '../mappers/UserMapper';
import { IEncryption } from '../../../../application/ports/IEncryption';
import { getCurrentTenant, getTenantOrNull } from '@/lib/tenant-context';

/**
 * Prisma implementation of IUserRepository
 * Handles persistence of User aggregates using Prisma ORM
 *
 * Responsibilities:
 * - Convert between Domain User entities and Prisma models
 * - Handle encryption/decryption of sensitive fields (SSN)
 * - Execute database queries through Prisma
 * - Maintain data integrity and consistency
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly encryption: IEncryption
  ) {}

  /**
   * Find a user by ID and decrypt sensitive fields if encryption is available
   */
  async findById(id: string): Promise<User | null> {
    const tenant = getTenantOrNull();
    const prismaUser = await this.prisma.user.findFirst({
      where: {
        id,
        ...(tenant && { organizationId: tenant.organizationId }),
      },
    });

    if (!prismaUser) return null;

    const user = UserMapper.toDomain(prismaUser);

    // Decrypt SSN if present and encryption is available
    if (user.ssn && this.encryption.isAvailable()) {
      try {
        const decrypted = await this.encryption.decrypt(user.ssn.getEncrypted());
        return User.reconstitute({
          ...user.toObject(),
          ssn: user.ssn.withDecrypted(decrypted),
        });
      } catch (error) {
        // Log error but continue with encrypted value
        // This allows the system to function even if decryption fails
        return user;
      }
    }

    return user;
  }

  /**
   * Find a user by email address
   */
  async findByEmail(email: Email): Promise<User | null> {
    const tenant = getTenantOrNull();
    const where: any = { email: email.value };

    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

    const prismaUser = await this.prisma.user.findFirst({ where });

    if (!prismaUser) return null;

    const user = UserMapper.toDomain(prismaUser);

    // Decrypt SSN if present
    if (user.ssn && this.encryption.isAvailable()) {
      try {
        const decrypted = await this.encryption.decrypt(user.ssn.getEncrypted());
        return User.reconstitute({
          ...user.toObject(),
          ssn: user.ssn.withDecrypted(decrypted),
        });
      } catch (error) {
        return user;
      }
    }

    return user;
  }

  /**
   * Find all users with optional filtering and pagination
   */
  async findAll(options?: {
    includeSensitive?: boolean;
    includeDeleted?: boolean;
    department?: string;
    skip?: number;
    take?: number;
  }): Promise<{ users: User[]; total: number }> {
    const tenant = getTenantOrNull();
    const where: any = {};

    // Add tenant isolation
    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

    // Exclude deleted users by default
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    // Filter by department if specified
    if (options?.department) {
      where.department = options.department;
    }

    // Execute queries in parallel for performance
    const [prismaUsers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Convert Prisma models to domain entities
    const users = prismaUsers.map((u) => UserMapper.toDomain(u));

    // Decrypt sensitive fields if requested and encryption is available
    if (options?.includeSensitive && this.encryption.isAvailable()) {
      const decryptedUsers = await Promise.all(
        users.map(async (user) => {
          if (user.ssn) {
            try {
              const decrypted = await this.encryption.decrypt(user.ssn.getEncrypted());
              return User.reconstitute({
                ...user.toObject(),
                ssn: user.ssn.withDecrypted(decrypted),
              });
            } catch (error) {
              return user;
            }
          }
          return user;
        })
      );
      return { users: decryptedUsers, total };
    }

    return { users, total };
  }

  /**
   * Get all unique departments from active users
   */
  async getDepartments(): Promise<string[]> {
    const tenant = getTenantOrNull();
    const where: any = {
      department: { not: null },
      deletedAt: null
    };

    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

    const result = await this.prisma.user.findMany({
      where,
      select: { department: true },
      distinct: ['department'],
    });

    return result
      .map((r) => r.department)
      .filter((d): d is string => d !== null)
      .sort();
  }

  /**
   * Save (create or update) a user
   * Encrypts SSN if needed before persistence
   */
  async save(user: User): Promise<User> {
    const tenant = getCurrentTenant(); // Throws if no tenant for mutations
    const data = UserMapper.toPrisma(user);

    // Ensure organizationId matches tenant
    if (data.organizationId !== tenant.organizationId) {
      throw new Error('User organizationId must match current tenant');
    }

    // Encrypt SSN if it needs encryption and encryption is available
    if (user.ssn && user.ssn.needsEncryption() && this.encryption.isAvailable()) {
      const plaintext = user.ssn.getPlaintext();
      if (plaintext) {
        const encrypted = await this.encryption.encrypt(plaintext);
        data.ssn = encrypted;
      }
    }

    // Use upsert for idempotency (create if doesn't exist, update if it does)
    const saved = await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        ...data,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      update: {
        ...data,
        updatedAt: user.updatedAt,
      },
    });

    return UserMapper.toDomain(saved);
  }

  /**
   * Permanently delete a user from the database
   * Note: This is a hard delete. For soft deletes, use User.softDelete() then save()
   */
  async delete(id: string): Promise<void> {
    const tenant = getCurrentTenant(); // Throws if no tenant for mutations
    await this.prisma.user.deleteMany({
      where: {
        id,
        organizationId: tenant.organizationId,
      },
    });
  }

  /**
   * Check if an email already exists in the system
   * Optionally exclude a specific user ID (useful for update operations)
   */
  async emailExists(email: Email, excludeUserId?: string): Promise<boolean> {
    const tenant = getTenantOrNull();
    const where: any = {
      email: email.value,
      id: excludeUserId ? { not: excludeUserId } : undefined,
    };

    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

    const count = await this.prisma.user.count({ where });

    return count > 0;
  }
}
