import { sendEmail, SendEmailResult } from './index';
import { emailTemplates, getEmailConfig } from './templates';
import { prisma } from '@/server/db';
import crypto from 'crypto';
import { addHours, addDays, format } from 'date-fns';

const config = getEmailConfig();

/**
 * Send email verification
 *
 * @param email - User's email address
 * @param userName - User's display name
 * @returns Result with success status and optional error message
 */
export async function sendVerificationEmail(
  email: string,
  userName: string
): Promise<SendEmailResult> {
  try {
    // Generate verification token
    const token = crypto.randomUUID();
    const expiresAt = addHours(new Date(), 24);

    // Store token in database
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    });

    const verificationUrl = `${config.appUrl}/verify-email?token=${token}`;

    const template = emailTemplates.verification({
      ...config,
      userName,
      verificationUrl,
    });

    return await sendEmail({
      to: email,
      ...template,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send verification email'
    };
  }
}

/**
 * Send password reset email
 *
 * @param email - User's email address
 * @param userName - User's display name
 * @returns Result with success status and optional error message
 */
export async function sendPasswordResetEmail(
  email: string,
  userName: string
): Promise<SendEmailResult> {
  try {
    // Generate reset token
    const token = crypto.randomUUID();
    const expiresAt = addHours(new Date(), 2);

    // Delete any existing password reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
        type: 'PASSWORD_RESET'
      },
    });

    // Store new token in database
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        type: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    const resetUrl = `${config.appUrl}/reset-password?token=${token}`;

    const template = emailTemplates.passwordReset({
      ...config,
      userName,
      resetUrl,
      expiresInHours: 2,
    });

    return await sendEmail({
      to: email,
      ...template,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send password reset email'
    };
  }
}

/**
 * Send team invitation email
 *
 * @param email - Invitee's email address
 * @param inviterName - Name of person sending invitation
 * @param organizationName - Organization name
 * @param role - Role being offered
 * @param invitationToken - Pre-generated invitation token from database
 * @returns Result with success status and optional error message
 */
export async function sendInvitationEmail(
  email: string,
  inviterName: string,
  organizationName: string,
  role: string,
  invitationToken: string
): Promise<SendEmailResult> {
  try {
    const invitationUrl = `${config.appUrl}/invite/${invitationToken}`;

    const template = emailTemplates.invitation({
      ...config,
      inviterName,
      organizationName,
      invitationUrl,
      role,
      expiresInDays: 7,
    });

    return await sendEmail({
      to: email,
      ...template,
    });
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send invitation email'
    };
  }
}

/**
 * Send welcome email after registration or invitation acceptance
 *
 * @param email - User's email address
 * @param userName - User's display name
 * @param organizationName - Organization name
 * @returns Result with success status and optional error message
 */
export async function sendWelcomeEmail(
  email: string,
  userName: string,
  organizationName: string
): Promise<SendEmailResult> {
  try {
    const template = emailTemplates.welcome({
      ...config,
      userName,
      organizationName,
      loginUrl: `${config.appUrl}/login`,
    });

    return await sendEmail({
      to: email,
      ...template,
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send welcome email'
    };
  }
}

/**
 * Send absence status notification to employee
 *
 * @param email - Employee's email address
 * @param userName - Employee's display name
 * @param status - Approval status (approved or rejected)
 * @param startDate - Absence start date
 * @param endDate - Absence end date
 * @param managerName - Name of manager who approved/rejected
 * @param reason - Optional reason or note from manager
 * @returns Result with success status and optional error message
 */
export async function sendAbsenceStatusEmail(
  email: string,
  userName: string,
  status: 'approved' | 'rejected',
  startDate: Date,
  endDate: Date,
  managerName: string,
  reason?: string
): Promise<SendEmailResult> {
  try {
    const template = emailTemplates.absenceStatus({
      ...config,
      userName,
      status,
      startDate: format(startDate, 'MMMM d, yyyy'),
      endDate: format(endDate, 'MMMM d, yyyy'),
      reason,
      managerName,
    });

    return await sendEmail({
      to: email,
      ...template,
    });
  } catch (error) {
    console.error('Failed to send absence status email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send absence status email'
    };
  }
}

/**
 * Send new absence request notification to manager
 *
 * @param email - Manager's email address
 * @param managerName - Manager's display name
 * @param employeeName - Name of employee requesting time off
 * @param startDate - Absence start date
 * @param endDate - Absence end date
 * @param reason - Reason for absence
 * @param requestId - ID of the absence request for review link
 * @returns Result with success status and optional error message
 */
export async function sendAbsenceRequestEmail(
  email: string,
  managerName: string,
  employeeName: string,
  startDate: Date,
  endDate: Date,
  reason: string,
  requestId: string
): Promise<SendEmailResult> {
  try {
    const reviewUrl = `${config.appUrl}/dashboard/absences?review=${requestId}`;

    const template = emailTemplates.absenceRequest({
      ...config,
      managerName,
      employeeName,
      startDate: format(startDate, 'MMMM d, yyyy'),
      endDate: format(endDate, 'MMMM d, yyyy'),
      reason,
      reviewUrl,
    });

    return await sendEmail({
      to: email,
      ...template,
    });
  } catch (error) {
    console.error('Failed to send absence request email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send absence request email'
    };
  }
}

/**
 * Send feedback received notification
 *
 * @param email - Recipient's email address
 * @param userName - Recipient's display name
 * @param fromName - Name of feedback giver
 * @param feedbackContent - Full feedback content
 * @returns Result with success status and optional error message
 */
export async function sendFeedbackReceivedEmail(
  email: string,
  userName: string,
  fromName: string,
  feedbackContent: string
): Promise<SendEmailResult> {
  try {
    // Create preview (first 150 characters)
    const feedbackPreview = feedbackContent.length > 150
      ? feedbackContent.substring(0, 150)
      : feedbackContent;

    const viewUrl = `${config.appUrl}/dashboard/feedback`;

    const template = emailTemplates.feedbackReceived({
      ...config,
      userName,
      fromName,
      feedbackPreview,
      viewUrl,
    });

    return await sendEmail({
      to: email,
      ...template,
    });
  } catch (error) {
    console.error('Failed to send feedback received email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send feedback received email'
    };
  }
}

/**
 * Verify a token from the database
 *
 * @param token - Token to verify
 * @param type - Expected token type
 * @returns Token data if valid, null otherwise
 */
export async function verifyToken(
  token: string,
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR'
) {
  try {
    const tokenData = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!tokenData) {
      return null;
    }

    // Check if token matches expected type
    if (tokenData.type !== type) {
      return null;
    }

    // Check if token is expired
    if (tokenData.expiresAt < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return null;
    }

    return tokenData;
  } catch (error) {
    console.error('Failed to verify token:', error);
    return null;
  }
}

/**
 * Delete a token after use
 *
 * @param token - Token to delete
 */
export async function deleteToken(token: string): Promise<void> {
  try {
    await prisma.verificationToken.delete({
      where: { token },
    });
  } catch (error) {
    console.error('Failed to delete token:', error);
  }
}

/**
 * Clean up expired tokens (should be run periodically via cron job)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await prisma.verificationToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`Cleaned up ${result.count} expired tokens`);
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error);
    return 0;
  }
}
