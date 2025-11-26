import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// Super admin check middleware
const superAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!superAdminEmails.length || !superAdminEmails.includes(ctx.session.email.toLowerCase())) {
    ctx.logger.warn(
      {
        userId: ctx.session.userId,
        email: ctx.session.email,
      },
      'Unauthorized super admin access attempt'
    );

    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Super admin access required',
    });
  }

  ctx.logger.info(
    {
      userId: ctx.session.userId,
      email: ctx.session.email,
    },
    'Super admin access granted'
  );

  return next({ ctx });
});

export const adminRouter = router({
  /**
   * Check if current user is a super admin
   * Uses protectedProcedure (not superAdminProcedure) so non-admins can check their status
   * without getting an error - the check is done server-side to avoid exposing admin emails
   */
  checkSuperAdmin: protectedProcedure.query(async ({ ctx }) => {
    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const isSuperAdmin = superAdminEmails.length > 0 &&
      superAdminEmails.includes(ctx.session.email.toLowerCase());

    return { isSuperAdmin };
  }),

  // Platform metrics
  getPlatformMetrics: superAdminProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalOrgs, totalUsers, activeUsers, newSignups] = await Promise.all([
      ctx.prisma.organization.count({
        where: { deletedAt: null },
      }),
      ctx.prisma.user.count({
        where: { deletedAt: null },
      }),
      ctx.prisma.user.count({
        where: {
          deletedAt: null,
          lastLoginAt: { gte: thirtyDaysAgo },
        },
      }),
      ctx.prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    ctx.logger.info(
      { totalOrgs, totalUsers, activeUsers, newSignups },
      'Platform metrics retrieved'
    );

    return { totalOrgs, totalUsers, activeUsers, newSignups };
  }),

  // List organizations
  listOrganizations: superAdminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        skip: z.number().default(0),
        take: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: {
        deletedAt: null;
        OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; slug?: { contains: string; mode: 'insensitive' } }>;
      } = {
        deletedAt: null,
      };

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { slug: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      const [organizations, total] = await Promise.all([
        ctx.prisma.organization.findMany({
          where,
          skip: input.skip,
          take: input.take,
          include: {
            _count: {
              select: {
                users: { where: { deletedAt: null } },
                feedback: { where: { deletedAt: null } },
                absenceRequests: { where: { deletedAt: null } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.organization.count({ where }),
      ]);

      ctx.logger.info(
        { count: organizations.length, total, search: input.search },
        'Organizations listed'
      );

      return { organizations, total };
    }),

  // Get organization details
  getOrganization: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const organization = await ctx.prisma.organization.findUnique({
        where: { id: input.id },
        include: {
          users: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
          _count: {
            select: {
              users: { where: { deletedAt: null } },
              feedback: { where: { deletedAt: null } },
              absenceRequests: { where: { deletedAt: null } },
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      ctx.logger.info({ organizationId: input.id }, 'Organization details retrieved');

      return organization;
    }),

  // List all users across organizations
  listAllUsers: superAdminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        organizationId: z.string().optional(),
        role: z.enum(['EMPLOYEE', 'MANAGER', 'COWORKER']).optional(),
        skip: z.number().default(0),
        take: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: {
        deletedAt: null;
        organizationId?: string;
        role?: 'EMPLOYEE' | 'MANAGER' | 'COWORKER';
        OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; email?: { contains: string; mode: 'insensitive' } }>;
      } = {
        deletedAt: null,
      };

      if (input.organizationId) {
        where.organizationId = input.organizationId;
      }

      if (input.role) {
        where.role = input.role;
      }

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { email: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          skip: input.skip,
          take: input.take,
          include: {
            organization: {
              select: { name: true, slug: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.user.count({ where }),
      ]);

      ctx.logger.info(
        {
          count: users.length,
          total,
          filters: {
            search: input.search,
            organizationId: input.organizationId,
            role: input.role,
          },
        },
        'All users listed'
      );

      return { users, total };
    }),

  // Suspend/unsuspend organization
  toggleOrganizationStatus: superAdminProcedure
    .input(z.object({ id: z.string(), suspend: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.prisma.organization.update({
        where: { id: input.id },
        data: {
          deletedAt: input.suspend ? new Date() : null,
        },
      });

      ctx.logger.warn(
        {
          organizationId: input.id,
          suspended: input.suspend,
          performedBy: ctx.session.email,
        },
        `Organization ${input.suspend ? 'suspended' : 'activated'}`
      );

      return organization;
    }),

  // Get recent activity across platform
  getRecentActivity: superAdminProcedure
    .input(
      z.object({
        take: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const activities = await ctx.prisma.auditLog.findMany({
        take: input.take,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: {
            select: { name: true, slug: true },
          },
        },
      });

      ctx.logger.info({ count: activities.length }, 'Recent activity retrieved');

      return activities;
    }),

  // Get organization usage statistics
  getOrganizationStats: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        activeUsers,
        totalFeedback,
        recentFeedback,
        totalAbsences,
        pendingAbsences,
      ] = await Promise.all([
        ctx.prisma.user.count({
          where: {
            organizationId: input.id,
            deletedAt: null,
          },
        }),
        ctx.prisma.user.count({
          where: {
            organizationId: input.id,
            deletedAt: null,
            lastLoginAt: { gte: thirtyDaysAgo },
          },
        }),
        ctx.prisma.feedback.count({
          where: {
            organizationId: input.id,
            deletedAt: null,
          },
        }),
        ctx.prisma.feedback.count({
          where: {
            organizationId: input.id,
            deletedAt: null,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        ctx.prisma.absenceRequest.count({
          where: {
            organizationId: input.id,
            deletedAt: null,
          },
        }),
        ctx.prisma.absenceRequest.count({
          where: {
            organizationId: input.id,
            deletedAt: null,
            status: 'PENDING',
          },
        }),
      ]);

      return {
        totalUsers,
        activeUsers,
        totalFeedback,
        recentFeedback,
        totalAbsences,
        pendingAbsences,
      };
    }),
});
