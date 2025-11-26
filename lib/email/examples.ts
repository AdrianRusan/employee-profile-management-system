/**
 * Email Service Integration Examples
 *
 * This file demonstrates how to integrate the email service
 * into various parts of the application.
 */

import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendInvitationEmail,
  sendWelcomeEmail,
  sendAbsenceStatusEmail,
  sendAbsenceRequestEmail,
  sendFeedbackReceivedEmail,
  verifyToken,
  deleteToken,
} from './send-emails';
import { prisma } from '@/server/db';
import { TRPCError } from '@trpc/server';

// =============================================================================
// EXAMPLE 1: User Registration Flow
// =============================================================================

export async function handleUserRegistration(
  email: string,
  name: string,
  organizationId: string
) {
  // 1. Create user in database
  const user = await prisma.user.create({
    data: {
      email,
      name,
      organizationId,
      status: 'PENDING_VERIFICATION',
    },
  });

  // 2. Send verification email
  const emailResult = await sendVerificationEmail(email, name);

  if (!emailResult.success) {
    // Log the error but don't fail the registration
    console.error('Failed to send verification email:', emailResult.error);

    // Optional: Queue for retry or notify admin
    // await queueEmailForRetry('verification', { email, name });
  }

  return user;
}

// =============================================================================
// EXAMPLE 2: Email Verification Handler
// =============================================================================

export async function handleEmailVerification(token: string) {
  // 1. Verify the token
  const tokenData = await verifyToken(token, 'EMAIL_VERIFICATION');

  if (!tokenData) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid or expired verification token',
    });
  }

  // 2. Find and update the user
  const user = await prisma.user.findFirst({
    where: { email: tokenData.identifier },
  });

  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User not found',
    });
  }

  // 3. Update user status
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  // 4. Delete the token
  await deleteToken(token);

  // 5. Send welcome email
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  });

  if (org) {
    await sendWelcomeEmail(user.email, user.name, org.name);
  }

  return { success: true };
}

// =============================================================================
// EXAMPLE 3: Password Reset Flow
// =============================================================================

export async function handlePasswordResetRequest(email: string) {
  // 1. Find user
  const user = await prisma.user.findFirst({
    where: { email },
  });

  // Send the same response regardless of whether user exists (security)
  if (!user) {
    // Still send a generic success response
    return { success: true, message: 'If the email exists, a reset link has been sent.' };
  }

  // 2. Send password reset email
  const emailResult = await sendPasswordResetEmail(email, user.name);

  if (!emailResult.success) {
    console.error('Failed to send password reset email:', emailResult.error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to send password reset email',
    });
  }

  return { success: true, message: 'If the email exists, a reset link has been sent.' };
}

export async function handlePasswordReset(token: string, newPassword: string) {
  // 1. Verify token
  const tokenData = await verifyToken(token, 'PASSWORD_RESET');

  if (!tokenData) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid or expired reset token',
    });
  }

  // 2. Find user and update password
  const user = await prisma.user.findFirst({
    where: { email: tokenData.identifier },
  });

  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User not found',
    });
  }

  // 3. Hash and update password (implement your password hashing)
  // const hashedPassword = await hashPassword(newPassword);
  // await prisma.user.update({
  //   where: { id: user.id },
  //   data: { passwordHash: hashedPassword },
  // });

  // 4. Delete the token
  await deleteToken(token);

  return { success: true };
}

// =============================================================================
// EXAMPLE 4: Team Invitation Flow
// =============================================================================

export async function handleSendInvitation(
  inviterUserId: string,
  inviteeEmail: string,
  organizationId: string,
  role: string
) {
  // 1. Get inviter and organization details
  const [inviter, organization] = await Promise.all([
    prisma.user.findUnique({ where: { id: inviterUserId } }),
    prisma.organization.findUnique({ where: { id: organizationId } }),
  ]);

  if (!inviter || !organization) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Inviter or organization not found',
    });
  }

  // 2. Check if user already exists in organization
  const existingUser = await prisma.user.findFirst({
    where: {
      email: inviteeEmail,
      organizationId,
    },
  });

  if (existingUser) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'User already exists in this organization',
    });
  }

  // 3. Create invitation
  const invitation = await prisma.invitation.create({
    data: {
      email: inviteeEmail,
      role: role as any,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      organizationId,
      invitedById: inviterUserId,
    },
  });

  // 4. Send invitation email
  const emailResult = await sendInvitationEmail(
    inviteeEmail,
    inviter.name,
    organization.name,
    role,
    invitation.token
  );

  if (!emailResult.success) {
    console.error('Failed to send invitation email:', emailResult.error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to send invitation email',
    });
  }

  return invitation;
}

// =============================================================================
// EXAMPLE 5: Absence Request Workflow
// =============================================================================

export async function handleAbsenceRequest(
  userId: string,
  startDate: Date,
  endDate: Date,
  reason: string,
  organizationId: string
) {
  // 1. Create absence request
  const absenceRequest = await prisma.absenceRequest.create({
    data: {
      userId,
      organizationId,
      startDate,
      endDate,
      reason,
      status: 'PENDING',
    },
    include: {
      user: true,
    },
  });

  // 2. Find managers in the organization
  const managers = await prisma.user.findMany({
    where: {
      organizationId,
      role: 'MANAGER',
      status: 'ACTIVE',
    },
  });

  // 3. Send notification to all managers
  const emailPromises = managers.map((manager) =>
    sendAbsenceRequestEmail(
      manager.email,
      manager.name,
      absenceRequest.user.name,
      startDate,
      endDate,
      reason,
      absenceRequest.id
    )
  );

  const results = await Promise.allSettled(emailPromises);

  // Log failures but don't fail the request
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(
        `Failed to send absence request email to manager ${managers[index].email}:`,
        result.reason
      );
    }
  });

  return absenceRequest;
}

export async function handleAbsenceStatusUpdate(
  absenceRequestId: string,
  status: 'APPROVED' | 'REJECTED',
  managerUserId: string,
  note?: string
) {
  // 1. Get manager and absence request details
  const [manager, absenceRequest] = await Promise.all([
    prisma.user.findUnique({ where: { id: managerUserId } }),
    prisma.absenceRequest.findUnique({
      where: { id: absenceRequestId },
      include: { user: true },
    }),
  ]);

  if (!manager || !absenceRequest) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Manager or absence request not found',
    });
  }

  // 2. Update absence request status
  const updatedRequest = await prisma.absenceRequest.update({
    where: { id: absenceRequestId },
    data: { status },
  });

  // 3. Create in-app notification
  await prisma.notification.create({
    data: {
      userId: absenceRequest.userId,
      organizationId: absenceRequest.organizationId,
      type: status === 'APPROVED' ? 'ABSENCE_APPROVED' : 'ABSENCE_REJECTED',
      title: `Time-off request ${status.toLowerCase()}`,
      message: `Your time-off request has been ${status.toLowerCase()} by ${manager.name}`,
      data: {
        absenceRequestId,
        managerNote: note,
      },
    },
  });

  // 4. Send email notification
  await sendAbsenceStatusEmail(
    absenceRequest.user.email,
    absenceRequest.user.name,
    status === 'APPROVED' ? 'approved' : 'rejected',
    absenceRequest.startDate,
    absenceRequest.endDate,
    manager.name,
    note
  );

  return updatedRequest;
}

// =============================================================================
// EXAMPLE 6: Feedback Notification
// =============================================================================

export async function handleFeedbackCreation(
  giverId: string,
  receiverId: string,
  content: string,
  organizationId: string
) {
  // 1. Create feedback
  const feedback = await prisma.feedback.create({
    data: {
      giverId,
      receiverId,
      organizationId,
      content,
    },
    include: {
      giver: true,
      receiver: true,
    },
  });

  // 2. Create in-app notification
  await prisma.notification.create({
    data: {
      userId: receiverId,
      organizationId,
      type: 'FEEDBACK_RECEIVED',
      title: 'New feedback received',
      message: `You received feedback from ${feedback.giver.name}`,
      data: {
        feedbackId: feedback.id,
      },
    },
  });

  // 3. Send email notification
  await sendFeedbackReceivedEmail(
    feedback.receiver.email,
    feedback.receiver.name,
    feedback.giver.name,
    content
  );

  return feedback;
}

// =============================================================================
// EXAMPLE 7: Batch Email with Error Handling
// =============================================================================

export async function sendBulkWelcomeEmails(organizationId: string) {
  // Get all pending users
  const users = await prisma.user.findMany({
    where: {
      organizationId,
      status: 'PENDING_VERIFICATION',
      emailVerified: false,
    },
    include: {
      organization: true,
    },
  });

  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: string }>,
  };

  // Send emails sequentially with rate limiting
  for (const user of users) {
    const result = await sendVerificationEmail(user.email, user.name);

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({
        email: user.email,
        error: result.error || 'Unknown error',
      });
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}
