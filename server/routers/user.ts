import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import {
  profileSchema,
  sensitiveProfileSchema,
  profileIdSchema,
  profileListSchema
} from '@/lib/validations/user';
import { canViewSensitiveData, canEditProfile } from '@/lib/permissions';

/**
 * User router for profile management
 * Handles CRUD operations with role-based access control
 */
export const userRouter = router({
  /**
   * Get user by ID with role-based field filtering
   * - Managers see all fields
   * - Users see their own complete profile
   * - Coworkers see only non-sensitive fields
   */
  getById: protectedProcedure
    .input(profileIdSchema)
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Check if viewer can see sensitive data
      const canSeeSensitive = canViewSensitiveData(
        ctx.session.role,
        ctx.session.userId,
        user.id
      );

      // Filter sensitive fields if viewer doesn't have permission
      if (!canSeeSensitive) {
        const { salary, ssn, address, performanceRating, ...publicFields } = user;
        return publicFields;
      }

      return user;
    }),

  /**
   * Get paginated list of all users
   * Implements cursor-based pagination for performance
   */
  getAll: protectedProcedure
    .input(profileListSchema)
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search, department, role } = input;

      // Build where clause for filtering
      const where: any = {};

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

      // Fetch users with cursor pagination
      const users = await ctx.prisma.user.findMany({
        where,
        take: limit + 1, // Fetch one extra to determine if there are more
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { name: 'asc' },
      });

      // Determine if there are more results
      let nextCursor: string | undefined = undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem!.id;
      }

      // Filter sensitive data for non-managers
      const filteredUsers = users.map((user) => {
        const canSeeSensitive = canViewSensitiveData(
          ctx.session.role,
          ctx.session.userId,
          user.id
        );

        if (!canSeeSensitive) {
          const { salary, ssn, address, performanceRating, ...publicFields } = user;
          return publicFields;
        }

        return user;
      });

      return {
        users: filteredUsers,
        nextCursor,
      };
    }),

  /**
   * Update non-sensitive profile fields
   * Accessible by user themselves or managers
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        data: profileSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission to edit this profile
      if (!canEditProfile(ctx.session.role, ctx.session.userId, input.id)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to edit this profile',
        });
      }

      // Update user profile
      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.id },
        data: input.data,
      });

      return updatedUser;
    }),

  /**
   * Update sensitive profile fields
   * Only accessible by managers
   */
  updateSensitive: managerProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        data: sensitiveProfileSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Convert salary to Decimal if provided
      const data: any = { ...input.data };
      if (data.salary !== undefined) {
        data.salary = data.salary;
      }

      // Update user profile with sensitive data
      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.id },
        data,
      });

      return updatedUser;
    }),

  /**
   * Get list of unique departments
   * Used for filtering in the UI
   */
  getDepartments: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
      where: {
        department: { not: null },
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
  }),
});
