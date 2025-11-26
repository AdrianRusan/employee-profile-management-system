import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { container } from '@/src/infrastructure/di/container';

/**
 * Notification router for managing user notifications
 * Uses Clean Architecture with DI Container and Use Cases
 */
export const notificationRouter = router({
  /**
   * Get notifications for current user
   */
  getAll: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().optional().default(false),
        limit: z.number().min(1).max(50).optional().default(20),
        cursor: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await container.getNotificationsUseCase.execute({
        userId: ctx.session.userId,
        unreadOnly: input.unreadOnly,
        skip: input.cursor,
        take: input.limit,
      });

      return {
        notifications: result.notifications,
        total: result.total,
        unreadCount: result.unreadCount,
        nextCursor:
          result.notifications.length === input.limit
            ? (input.cursor || 0) + input.limit
            : undefined,
      };
    }),

  /**
   * Get unread notification count for current user
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const result = await container.getNotificationsUseCase.execute({
      userId: ctx.session.userId,
      unreadOnly: true,
      take: 1,
    });

    return { count: result.unreadCount };
  }),

  /**
   * Mark a single notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return container.markNotificationReadUseCase.execute({
        notificationId: input.notificationId,
        userId: ctx.session.userId,
      });
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return container.markAllNotificationsReadUseCase.execute({
      userId: ctx.session.userId,
    });
  }),
});
