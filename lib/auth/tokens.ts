import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';

const TOKEN_EXPIRY = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET: 60 * 60 * 1000, // 1 hour
  TWO_FACTOR: 5 * 60 * 1000, // 5 minutes
  INVITATION: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Create an email verification token
 */
export async function createEmailVerificationToken(
  prisma: PrismaClient,
  email: string
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION);

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
    },
  });

  return token;
}

/**
 * Create a password reset token
 */
export async function createPasswordResetToken(
  prisma: PrismaClient,
  email: string
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.PASSWORD_RESET);

  // Delete any existing password reset tokens for this email
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: email,
      type: 'PASSWORD_RESET',
    },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      type: 'PASSWORD_RESET',
      expiresAt,
    },
  });

  return token;
}

/**
 * Create an invitation token
 */
export async function createInvitationToken(
  prisma: PrismaClient,
  organizationId: string,
  email: string,
  role: 'EMPLOYEE' | 'MANAGER' | 'COWORKER',
  invitedById: string
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.INVITATION);

  // Delete any existing pending invitations for this email in this organization
  await prisma.invitation.deleteMany({
    where: {
      email,
      organizationId,
      acceptedAt: null,
    },
  });

  await prisma.invitation.create({
    data: {
      email,
      role,
      token,
      expiresAt,
      organizationId,
      invitedById,
    },
  });

  return token;
}

/**
 * Verify and consume a token
 */
export async function verifyToken(
  prisma: PrismaClient,
  token: string,
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR'
): Promise<{ identifier: string } | null> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken || verificationToken.type !== type) {
    return null;
  }

  // Check if token has expired
  if (verificationToken.expiresAt < new Date()) {
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });
    return null;
  }

  // Delete the token after verification (single use)
  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  });

  return { identifier: verificationToken.identifier };
}

/**
 * Verify an invitation token
 */
export async function verifyInvitationToken(
  prisma: PrismaClient,
  token: string
): Promise<{
  id: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'COWORKER';
  organizationId: string;
  organizationName: string;
} | null> {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!invitation || invitation.acceptedAt !== null) {
    return null;
  }

  // Check if invitation has expired
  if (invitation.expiresAt < new Date()) {
    return null;
  }

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    organizationId: invitation.organization.id,
    organizationName: invitation.organization.name,
  };
}
