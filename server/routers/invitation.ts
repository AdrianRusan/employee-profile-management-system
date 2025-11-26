import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { getCurrentTenant } from '@/lib/tenant-context';
import { generateToken } from '@/lib/auth/tokens';
import { sendInvitationEmail } from '@/lib/email/send-emails';
import { addDays } from 'date-fns';

export const invitationRouter = router({
  // Create invitation (managers only)
  create: managerProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(['EMPLOYEE', 'MANAGER', 'COWORKER']),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCurrentTenant();

      // Check if user already exists in this org
      const existingUser = await ctx.prisma.user.findFirst({
        where: { email: input.email, organizationId: tenant.organizationId, deletedAt: null },
      });
      if (existingUser) {
        throw new TRPCError({ code: 'CONFLICT', message: 'User already exists in this organization' });
      }

      // Check if invitation already pending
      const existingInvite = await ctx.prisma.invitation.findFirst({
        where: {
          email: input.email,
          organizationId: tenant.organizationId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      if (existingInvite) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Invitation already pending for this email' });
      }

      const token = generateToken();
      const invitation = await ctx.prisma.invitation.create({
        data: {
          email: input.email,
          role: input.role,
          token,
          expiresAt: addDays(new Date(), 7),
          organizationId: tenant.organizationId,
          invitedById: ctx.session.userId,
        },
      });

      // Get inviter and org info for email
      const [inviter, org] = await Promise.all([
        ctx.prisma.user.findUnique({ where: { id: ctx.session.userId }, select: { name: true } }),
        ctx.prisma.organization.findUnique({ where: { id: tenant.organizationId }, select: { name: true } }),
      ]);

      await sendInvitationEmail(
        input.email,
        inviter?.name || 'A team member',
        org?.name || tenant.organizationName,
        input.role,
        token
      );

      ctx.logger.info({
        action: 'invitation_created',
        inviteeEmail: input.email,
        role: input.role,
      }, 'Team invitation created');

      return invitation;
    }),

  // List pending invitations
  list: managerProcedure.query(async ({ ctx }) => {
    const tenant = getCurrentTenant();
    return ctx.prisma.invitation.findMany({
      where: { organizationId: tenant.organizationId },
      include: { invitedBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }),

  // Resend invitation
  resend: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCurrentTenant();
      const invitation = await ctx.prisma.invitation.findFirst({
        where: { id: input.id, organizationId: tenant.organizationId },
      });

      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation not found' });
      }

      if (invitation.acceptedAt) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invitation already accepted' });
      }

      // Generate new token and extend expiry
      const newToken = generateToken();
      const updated = await ctx.prisma.invitation.update({
        where: { id: input.id },
        data: { token: newToken, expiresAt: addDays(new Date(), 7) },
      });

      const [inviter, org] = await Promise.all([
        ctx.prisma.user.findUnique({ where: { id: ctx.session.userId }, select: { name: true } }),
        ctx.prisma.organization.findUnique({ where: { id: tenant.organizationId }, select: { name: true } }),
      ]);

      await sendInvitationEmail(
        invitation.email,
        inviter?.name || 'A team member',
        org?.name || tenant.organizationName,
        invitation.role,
        newToken
      );

      ctx.logger.info({
        action: 'invitation_resent',
        invitationId: input.id,
        email: invitation.email,
      }, 'Team invitation resent');

      return updated;
    }),

  // Cancel invitation
  cancel: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCurrentTenant();

      const invitation = await ctx.prisma.invitation.findFirst({
        where: { id: input.id, organizationId: tenant.organizationId },
      });

      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation not found' });
      }

      await ctx.prisma.invitation.delete({
        where: { id: input.id },
      });

      ctx.logger.info({
        action: 'invitation_cancelled',
        invitationId: input.id,
        email: invitation.email,
      }, 'Team invitation cancelled');

      return { success: true };
    }),
});
