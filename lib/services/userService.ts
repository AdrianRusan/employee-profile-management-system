import { PrismaClient, Prisma, Role } from '@prisma/client';
import type { Logger } from 'pino';
import { USER_PUBLIC_SELECT, USER_SENSITIVE_SELECT } from '@/lib/prisma/selects';
import { encrypt } from '@/lib/encryption';
import { decryptUserSensitiveFields, decryptUsersSensitiveFields } from '@/lib/utils/encryption-helpers';
import { serializeUser, serializeUsers } from '@/lib/utils/serialization';
import { findOrThrow, AppErrors } from '@/lib/errors';
import { Permissions, type PermissionUser } from '@/lib/permissions';
import type { PaginationInput } from '@/lib/pagination';

/**
 * Input types for user service methods
 */
export interface UserListInput extends PaginationInput {
  search?: string;
  department?: string;
  role?: Role;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  department?: string | null;
  title?: string | null;
  bio?: string | null;
  avatar?: string | null;
}

export interface UpdateSensitiveUserInput {
  salary?: string | number | Prisma.Decimal;
  ssn?: string | null;
  address?: string | null;
  performanceRating?: number | null;
}

/**
 * User Service
 * Handles all business logic for user management
 */
export class UserService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger?: Logger
  ) {}

  /**
   * Get paginated list of users with role-based field filtering
   * @param session - Current user session
   * @param input - Pagination and filter parameters
   * @returns Paginated list of users with nextCursor
   */
  async listUsers(session: PermissionUser, input: UserListInput) {
    const { limit, cursor, search, department, role } = input;

    // Build where clause for filtering (exclude soft-deleted users)
    const where: Prisma.UserWhereInput = {
      deletedAt: null
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (department) {
      where.department = department;
    }

    if (role) {
      where.role = role;
    }

    // Determine field selection based on viewer role
    const isManager = session.role === 'MANAGER';
    const selectFields = isManager ? USER_SENSITIVE_SELECT : USER_PUBLIC_SELECT;

    // Fetch users with cursor pagination and role-based field selection
    const users = await this.prisma.user.findMany({
      where,
      select: selectFields,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { name: 'asc' },
    });

    // Determine if there are more results
    let nextCursor: string | undefined = undefined;
    if (users.length > limit) {
      const nextItem = users.pop();
      nextCursor = nextItem!.id;
    }

    // Decrypt SSN for managers and serialize
    const processedUsers = isManager
      ? decryptUsersSensitiveFields(users, this.logger)
      : users;

    const serializedUsers = serializeUsers(processedUsers);

    return {
      users: serializedUsers,
      nextCursor,
    };
  }

  /**
   * Get user by ID with role-based field filtering
   * @param session - Current user session
   * @param userId - ID of user to fetch
   * @returns User object with decrypted and serialized fields
   */
  async getUserById(session: PermissionUser, userId: string) {
    this.logger?.debug({ targetUserId: userId }, 'Fetching user profile');

    const user = await findOrThrow(
      this.prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null
        },
      }),
      'User',
      userId
    );

    // Check if viewer can see sensitive data
    const canSeeSensitive = Permissions.user.viewSensitive(session, user);

    // Decrypt SSN if present and viewer has permission
    const processedUser = canSeeSensitive
      ? decryptUserSensitiveFields(user, this.logger)
      : user;

    // Serialize user data
    const serializedUser = serializeUser(processedUser);

    // Filter sensitive fields if viewer doesn't have permission
    if (!canSeeSensitive) {
      this.logger?.debug({ targetUserId: userId }, 'Returning public profile fields');
      const { salary: _salary, ssn: _ssn, address: _address, performanceRating: _performanceRating, ...publicFields } = serializedUser;
      return publicFields;
    }

    this.logger?.debug({ targetUserId: userId }, 'Returning full profile with sensitive fields');
    return serializedUser;
  }

  /**
   * Update non-sensitive user profile fields
   * @param session - Current user session
   * @param userId - ID of user to update
   * @param data - Update data
   * @returns Updated user object
   */
  async updateUser(session: PermissionUser, userId: string, data: UpdateUserInput) {
    this.logger?.info({
      targetUserId: userId,
      updatedFields: Object.keys(data),
    }, 'Updating user profile');

    // Check if user has permission to edit this profile
    const targetUser = { id: userId };
    const canEdit = Permissions.user.edit(session, targetUser);

    if (!canEdit) {
      throw AppErrors.forbidden('You do not have permission to edit this profile');
    }

    // Update user profile
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    this.logger?.info({
      targetUserId: userId,
      updatedFields: Object.keys(data),
    }, 'User profile updated successfully');

    return serializeUser(updatedUser);
  }

  /**
   * Update sensitive user profile fields (manager only)
   * @param session - Current user session
   * @param userId - ID of user to update
   * @param data - Sensitive update data
   * @returns Updated user object
   */
  async updateSensitiveFields(
    session: PermissionUser,
    userId: string,
    data: UpdateSensitiveUserInput
  ) {
    this.logger?.info({
      targetUserId: userId,
      updatedFields: Object.keys(data),
    }, 'Updating sensitive user profile fields');

    // Check if user has permission (manager only)
    if (!Permissions.user.updateSensitive(session)) {
      throw AppErrors.forbidden('Only managers can update sensitive fields');
    }

    // Prepare update data
    const updateData: Prisma.UserUpdateInput = { ...data };

    // Convert salary to Decimal if provided
    if (updateData.salary != null) {
      const salaryInput = updateData.salary;
      if (typeof salaryInput !== 'string' && typeof salaryInput !== 'number') {
        this.logger?.warn({ targetUserId: userId }, 'Invalid salary type provided');
        throw AppErrors.badRequest('Salary must be a number or string');
      }
      try {
        updateData.salary = new Prisma.Decimal(salaryInput);
      } catch (error) {
        this.logger?.warn({ targetUserId: userId, error }, 'Invalid salary value');
        throw AppErrors.badRequest('Invalid salary value');
      }
    }

    // Encrypt SSN before storing
    if (updateData.ssn != null && typeof updateData.ssn === 'string' && updateData.ssn.trim() !== '') {
      this.logger?.debug({ targetUserId: userId }, 'Encrypting SSN before storage');
      updateData.ssn = encrypt(updateData.ssn);
    }

    // Update user profile with sensitive data
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Decrypt SSN for response
    const processedUser = decryptUserSensitiveFields(updatedUser, this.logger);

    this.logger?.info({
      targetUserId: userId,
      updatedFields: Object.keys(data),
    }, 'Sensitive user profile fields updated successfully');

    return serializeUser(processedUser);
  }

  /**
   * Get list of unique departments
   * @returns Array of department names
   */
  async getDepartments() {
    const users = await this.prisma.user.findMany({
      where: {
        department: { not: null },
        deletedAt: null
      },
      select: {
        department: true,
      },
      distinct: ['department'],
    });

    return users
      .map((u) => u.department)
      .filter((d): d is string => d !== null)
      .sort();
  }

  /**
   * Soft delete user account (manager only)
   * @param session - Current user session
   * @param userId - ID of user to soft delete
   * @returns Success message
   */
  async softDeleteUser(session: PermissionUser, userId: string) {
    this.logger?.info({ targetUserId: userId }, 'Soft deleting user account');

    // Check permission
    if (!Permissions.user.delete(session, { id: userId })) {
      throw AppErrors.forbidden('You do not have permission to delete this user');
    }

    // Verify user exists and is not already deleted
    await findOrThrow(
      this.prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null
        },
      }),
      'User (or already deleted)',
      userId
    );

    // Soft delete user by setting deletedAt timestamp
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    this.logger?.info({ targetUserId: userId }, 'User account soft-deleted successfully');

    return {
      success: true,
      message: 'User account soft-deleted successfully',
    };
  }

  /**
   * Hard delete user account (manager only, irreversible)
   * @param session - Current user session
   * @param userId - ID of user to hard delete
   * @returns Success message
   */
  async hardDeleteUser(session: PermissionUser, userId: string) {
    this.logger?.warn({ targetUserId: userId }, 'Hard deleting user account - IRREVERSIBLE');

    // Check permission
    if (!Permissions.user.delete(session, { id: userId })) {
      throw AppErrors.forbidden('You do not have permission to delete this user');
    }

    // Verify user exists
    await findOrThrow(
      this.prisma.user.findUnique({
        where: { id: userId },
      }),
      'User',
      userId
    );

    // Prevent manager from deleting themselves
    if (userId === session.id) {
      this.logger?.warn({ targetUserId: userId }, 'Manager attempted to delete their own account');
      throw AppErrors.badRequest('Cannot delete your own account');
    }

    // Hard delete user (CASCADE will automatically delete all related data)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    this.logger?.warn({
      targetUserId: userId,
      action: 'hard_delete',
    }, 'User account and all related data permanently deleted');

    return {
      success: true,
      message: 'User account and all related data permanently deleted',
    };
  }

  /**
   * Restore soft-deleted user account (manager only)
   * @param session - Current user session
   * @param userId - ID of user to restore
   * @returns Success message
   */
  async restoreUser(session: PermissionUser, userId: string) {
    this.logger?.info({ targetUserId: userId }, 'Restoring soft-deleted user account');

    // Check permission (manager only)
    if (session.role !== 'MANAGER') {
      throw AppErrors.forbidden('Only managers can restore user accounts');
    }

    // Verify user exists and is soft-deleted
    await findOrThrow(
      this.prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: { not: null }
        },
      }),
      'Deleted user',
      userId
    );

    // Restore user by clearing deletedAt timestamp
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
    });

    this.logger?.info({ targetUserId: userId }, 'User account restored successfully');

    return {
      success: true,
      message: 'User account restored successfully',
    };
  }
}
