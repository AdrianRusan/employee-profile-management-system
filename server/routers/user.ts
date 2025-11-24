import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import {
  profileSchema,
  sensitiveProfileSchema,
  profileIdSchema,
  profileListSchema
} from '@/lib/validations/user';
import { UserService } from '@/lib/services/userService';

/**
 * User router for profile management
 * Delegates all business logic to UserService (Clean Architecture)
 *
 * REFACTORED: Reduced from 393 lines to ~100 lines by extracting business logic
 * to the service layer. Each endpoint now follows the thin controller pattern:
 * 1. Validate input (handled by tRPC)
 * 2. Instantiate service
 * 3. Delegate to service method
 * 4. Return result
 */
export const userRouter = router({
  /**
   * Get user by ID with role-based field filtering
   */
  getById: protectedProcedure
    .input(profileIdSchema)
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.prisma, ctx.logger);
      return userService.getUserById(ctx.session, input.id);
    }),

  /**
   * Get paginated list of all users
   */
  getAll: protectedProcedure
    .input(profileListSchema)
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.prisma, ctx.logger);
      return userService.listUsers(ctx.session, input);
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
      const userService = new UserService(ctx.prisma, ctx.logger);
      return userService.updateUser(ctx.session, input.id, input.data);
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
      const userService = new UserService(ctx.prisma, ctx.logger);
      return userService.updateSensitiveFields(ctx.session, input.id, input.data);
    }),

  /**
   * Get list of unique departments
   */
  getDepartments: protectedProcedure.query(async ({ ctx }) => {
    const userService = new UserService(ctx.prisma, ctx.logger);
    return userService.getDepartments();
  }),

  /**
   * Soft delete user account
   */
  softDelete: managerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService(ctx.prisma, ctx.logger);
      return userService.softDeleteUser(ctx.session, input.id);
    }),

  /**
   * Hard delete user account (irreversible)
   */
  hardDelete: managerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService(ctx.prisma, ctx.logger);
      return userService.hardDeleteUser(ctx.session, input.id);
    }),

  /**
   * Restore soft-deleted user account
   */
  restore: managerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService(ctx.prisma, ctx.logger);
      return userService.restoreUser(ctx.session, input.id);
    }),
});
