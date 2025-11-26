import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/server/db';
import { createSession } from '@/lib/session';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

/**
 * Decrypt pending OAuth data from cookie
 */
function decryptPendingData(encrypted: string): Record<string, string> | null {
  try {
    const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
    const data = Buffer.from(encrypted, 'base64url');
    const iv = data.subarray(0, 16);
    const authTag = data.subarray(16, 32);
    const ciphertext = data.subarray(32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      name,
      organizationSlug,
      provider,
      providerId,
    } = body;

    if (!email || !name || !organizationSlug || !provider || !providerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get OAuth tokens from secure cookie
    const cookieStore = await cookies();
    const pendingCookie = cookieStore.get('oauth_pending')?.value;

    if (!pendingCookie) {
      return NextResponse.json(
        { error: 'Session expired. Please try signing in again.' },
        { status: 401 }
      );
    }

    const pendingData = decryptPendingData(pendingCookie);

    if (!pendingData) {
      return NextResponse.json(
        { error: 'Invalid session data. Please try signing in again.' },
        { status: 401 }
      );
    }

    // Verify the request data matches the cookie data
    if (
      pendingData.email !== email ||
      pendingData.provider !== provider ||
      pendingData.providerId !== providerId
    ) {
      return NextResponse.json(
        { error: 'Session mismatch. Please try signing in again.' },
        { status: 401 }
      );
    }

    // Extract tokens from secure cookie (not from request body)
    const { accessToken, refreshToken, idToken } = pendingData;

    // Find organization
    const organization = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user already exists in this organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        organizationId: organization.id,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'You already have an account in this organization' },
        { status: 409 }
      );
    }

    // Create user and OAuth account in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create user
      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          email,
          name,
          role: 'EMPLOYEE', // Default role for joining users
          emailVerified: true, // OAuth emails are pre-verified
          emailVerifiedAt: new Date(),
          status: 'ACTIVE',
        },
      });

      // Create OAuth account
      await tx.oAuthAccount.create({
        data: {
          userId: user.id,
          provider,
          providerAccountId: providerId,
          accessToken,
          refreshToken,
          idToken,
          tokenExpiresAt: refreshToken ? new Date(Date.now() + 3600 * 1000) : null,
          scope: provider === 'google' ? 'openid email profile' : 'openid email profile User.Read',
        },
      });

      return { user };
    });

    // Clear the pending OAuth cookie
    cookieStore.delete('oauth_pending');

    // Create session
    await createSession(
      result.user.id,
      result.user.email,
      result.user.role,
      organization.id,
      organization.slug
    );

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    });
  } catch (error) {
    console.error('OAuth join error:', error);
    return NextResponse.json(
      { error: 'Failed to join organization. Please try again.' },
      { status: 500 }
    );
  }
}
