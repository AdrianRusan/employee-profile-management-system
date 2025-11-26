import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/server/db';
import { createSession } from '@/lib/session';
import { generateSlug } from '@/lib/password';
import { Prisma } from '@prisma/client';
import { decryptPendingData } from '../[provider]/callback/route';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationName } = body;

    if (!organizationName) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    // Retrieve and validate OAuth data from encrypted cookie
    const cookieStore = await cookies();
    const pendingCookie = cookieStore.get('oauth_pending')?.value;

    if (!pendingCookie) {
      return NextResponse.json(
        { error: 'OAuth session expired. Please try signing in again.' },
        { status: 401 }
      );
    }

    const pendingData = decryptPendingData(pendingCookie);
    if (!pendingData) {
      // Clear invalid cookie
      cookieStore.delete('oauth_pending');
      return NextResponse.json(
        { error: 'Invalid OAuth session. Please try signing in again.' },
        { status: 401 }
      );
    }

    // Extract validated data from secure cookie (NOT from request body)
    const {
      email,
      name,
      provider,
      providerId,
      avatar,
      accessToken,
      refreshToken,
      idToken,
    } = pendingData;

    if (!email || !name || !provider || !providerId) {
      cookieStore.delete('oauth_pending');
      return NextResponse.json({ error: 'Invalid OAuth data' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Generate slug from organization name
    const slug = generateSlug(organizationName);

    // Check if slug is already taken
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'An organization with this name already exists. Please choose a different name.' },
        { status: 409 }
      );
    }

    // Create organization, user, and OAuth account in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          email,
          name,
          role: 'MANAGER', // First user is admin
          emailVerified: true, // OAuth emails are pre-verified
          emailVerifiedAt: new Date(),
          status: 'ACTIVE',
          avatar: avatar || undefined,
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

      return { user, organization };
    });

    // Clear the OAuth pending cookie after successful registration
    cookieStore.delete('oauth_pending');

    // Create session
    await createSession(
      result.user.id,
      result.user.email,
      result.user.role,
      result.organization.id,
      result.organization.slug
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
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
      },
    });
  } catch (error) {
    console.error('OAuth registration error:', error);
    return NextResponse.json(
      { error: 'Failed to complete registration. Please try again.' },
      { status: 500 }
    );
  }
}
