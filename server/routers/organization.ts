import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { generateToken } from '@/lib/password';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';
import { sendInvitationEmail } from '@/lib/email/send-emails';

const INVITATION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export const organizationRouter = router({
  /**
   * Complete onboarding - marks organization onboarding as complete
   */
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        invites: z.array(z.string().email()).optional(),
        departments: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Use session organizationId instead of tenant context
      const organizationId = ctx.session.organizationId;

      if (!organizationId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No organization associated with this session',
        });
      }

      ctx.logger.info(
        {
          organizationId,
          invitesCount: input.invites?.length || 0,
          departmentsCount: input.departments?.length || 0,
        },
        'Completing onboarding'
      );

      // Get current organization settings and name
      const organization = await ctx.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { settings: true, name: true },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      // Get current user for invitation sender info
      const currentUser = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.userId },
        select: { name: true, email: true },
      });

      if (!currentUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        // Mark onboarding as complete
        const currentSettings = (organization.settings as Record<string, unknown>) || {};
        await tx.organization.update({
          where: { id: organizationId },
          data: {
            settings: {
              ...currentSettings,
              onboardingCompleted: true,
              onboardingCompletedAt: new Date().toISOString(),
              departments: input.departments || [],
            },
          },
        });

        // Send invitations
        if (input.invites?.length) {
          for (const email of input.invites) {
            // Check if user already exists in organization
            const existingUser = await tx.user.findFirst({
              where: {
                email,
                organizationId,
              },
            });

            if (existingUser) {
              ctx.logger.warn({ email }, 'User already exists in organization');
              continue;
            }

            // Check if invitation already exists
            const existingInvitation = await tx.invitation.findFirst({
              where: {
                email,
                organizationId,
                acceptedAt: null,
              },
            });

            if (existingInvitation) {
              ctx.logger.warn({ email }, 'Invitation already sent');
              continue;
            }

            // Create invitation
            const token = generateToken();
            await tx.invitation.create({
              data: {
                email,
                role: 'EMPLOYEE',
                token,
                expiresAt: new Date(Date.now() + INVITATION_EXPIRY),
                organizationId,
                invitedById: ctx.session.userId,
              },
            });

            // Send invitation email using the real email service
            // sendInvitationEmail(email, inviterName, organizationName, role, invitationToken)
            const emailResult = await sendInvitationEmail(
              email,
              currentUser.name || 'Team Admin',
              organization.name,
              'EMPLOYEE',
              token
            );

            if (emailResult.success) {
              ctx.logger.info({ email }, 'Invitation email sent successfully');
            } else {
              ctx.logger.error({ email, error: emailResult.error }, 'Failed to send invitation email');
            }
          }
        }
      });

      ctx.logger.info(
        { organizationId },
        'Onboarding completed successfully'
      );

      return { success: true };
    }),

  /**
   * Get organization settings (including onboarding status)
   */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    // Use session organizationId instead of tenant context for broader compatibility
    const organizationId = ctx.session.organizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'No organization associated with this session',
      });
    }

    const organization = await ctx.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        settings: true,
      },
    });

    if (!organization) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Organization not found',
      });
    }

    return organization;
  }),

  /**
   * Update organization settings
   * Only managers can update organization settings
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        logo: z.string().nullable().optional(),
        settings: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Use session organizationId instead of tenant context
      const organizationId = ctx.session.organizationId;

      if (!organizationId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No organization associated with this session',
        });
      }

      // Only managers can update organization settings
      if (ctx.session.role !== 'MANAGER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only managers can update organization settings',
        });
      }

      ctx.logger.info(
        { organizationId },
        'Updating organization settings'
      );

      // Get current settings
      const organization = await ctx.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { settings: true },
      });

      if (!organization) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      const currentSettings = (organization.settings as Record<string, unknown>) || {};

      // Prepare update data
      const updateData: Prisma.OrganizationUpdateInput = {};

      if (input.logo !== undefined) {
        updateData.logo = input.logo;
      }

      if (input.settings) {
        updateData.settings = {
          ...currentSettings,
          ...input.settings,
        } as Prisma.InputJsonValue;
      }

      // Update organization
      const updated = await ctx.prisma.organization.update({
        where: { id: organizationId },
        data: updateData,
      });

      ctx.logger.info(
        { organizationId },
        'Organization settings updated'
      );

      return updated;
    }),
});
