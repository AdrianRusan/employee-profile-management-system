import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import {
  profileSchema,
  sensitiveProfileSchema,
  profileIdSchema,
  profileListSchema
} from '@/lib/validations/user';
import { container } from '@/src/infrastructure/di/container';

/**
 * User router for profile management
 * Uses Clean Architecture with DI Container and Use Cases
 *
 * REFACTORED: Now uses dependency injection container for all operations.
 * Each endpoint delegates to a specific use case through the container.
 */
export const userRouter = router({
  /**
   * Get user by ID with role-based field filtering
   */
  getById: protectedProcedure
    .input(profileIdSchema)
    .query(async ({ ctx, input }) => {
      return container.getUserUseCase.execute({
        userId: input.id,
        requesterId: ctx.session.userId,
        includeSensitive: ctx.session.role === 'MANAGER',
      });
    }),

  /**
   * Get paginated list of all users
   */
  getAll: protectedProcedure
    .input(profileListSchema)
    .query(async ({ ctx, input }) => {
      return container.listUsersUseCase.execute({
        requesterId: ctx.session.userId,
        department: input.department,
        skip: input.skip,
        take: input.limit,
      });
    }),

  /**
   * Update non-sensitive profile fields
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        data: profileSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return container.updateUserProfileUseCase.execute({
        userId: input.id,
        requesterId: ctx.session.userId,
        name: input.data.name,
        department: input.data.department,
        position: input.data.position,
        title: input.data.title ?? undefined,
        bio: input.data.bio ?? undefined,
        avatar: input.data.avatar ?? undefined,
        phoneNumber: input.data.phoneNumber,
        address: input.data.address,
        city: input.data.city,
        state: input.data.state,
        zipCode: input.data.zipCode,
        country: input.data.country,
      });
    }),

  /**
   * Update sensitive profile fields
   */
  updateSensitive: managerProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        data: sensitiveProfileSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return container.updateSensitiveFieldsUseCase.execute({
        userId: input.id,
        requesterId: ctx.session.userId,
        salary: input.data.salary,
        ssn: input.data.ssn,
        dateOfBirth: input.data.dateOfBirth,
        performanceRating: input.data.performanceRating,
      });
    }),

  /**
   * Get list of unique departments
   */
  getDepartments: protectedProcedure.query(async ({ ctx }) => {
    const result = await container.listUsersUseCase.execute({
      requesterId: ctx.session.userId,
    });

    // Extract unique departments from users
    const departments = [...new Set(result.users.map(u => u.department).filter(Boolean))];
    return departments;
  }),

  /**
   * Soft delete user account
   */
  softDelete: managerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await container.deleteUserUseCase.execute({
        userId: input.id,
        requesterId: ctx.session.userId,
      });
      return { success: true };
    }),

  /**
   * Restore soft-deleted user account
   */
  restore: managerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return container.restoreUserUseCase.execute({
        userId: input.id,
        requesterId: ctx.session.userId,
      });
    }),

  /**
   * Update user role (managers only)
   */
  updateRole: managerProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        role: z.enum(['EMPLOYEE', 'MANAGER', 'COWORKER']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent changing own role
      if (input.id === ctx.session.userId) {
        throw new Error('Cannot change your own role');
      }

      // SECURITY: First verify the target user belongs to the same organization
      const targetUser = await ctx.prisma.user.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.session.organizationId, // Enforce organization boundary
        },
        select: { id: true, role: true },
      });

      if (!targetUser) {
        ctx.logger.warn({
          action: 'cross_org_role_update_attempt',
          targetUserId: input.id,
          attemptedBy: ctx.session.userId,
        }, 'Cross-organization role update attempt blocked');
        throw new Error('User not found in your organization');
      }

      // SECURITY: Use updateMany with organizationId for defense-in-depth
      const result = await ctx.prisma.user.updateMany({
        where: {
          id: input.id,
          organizationId: ctx.session.organizationId,
        },
        data: { role: input.role },
      });

      if (result.count === 0) {
        throw new Error('Failed to update user role');
      }

      ctx.logger.info({
        action: 'role_updated',
        userId: input.id,
        newRole: input.role,
        updatedBy: ctx.session.userId,
      }, 'User role updated');

      return { ...targetUser, role: input.role };
    }),
});
