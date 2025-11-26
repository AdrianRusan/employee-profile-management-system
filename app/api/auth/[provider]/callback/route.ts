import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/server/db';
import { createSession } from '@/lib/session';
import {
  exchangeCodeForTokens,
  fetchUserInfo,
  OAuthProvider,
  getEncryptionKey,
} from '@/lib/auth/oauth';
import crypto from 'crypto';

/**
 * Store OAuth pending registration data in an encrypted cookie
 * This avoids exposing tokens in URL query parameters
 */
function encryptPendingData(data: Record<string, string>): string {
  const key = getEncryptionKey(); // Throws if not configured
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64url');
}

/**
 * Decrypt OAuth pending data from cookie
 * Returns null if decryption fails (expired, tampered, or invalid)
 */
export function decryptPendingData(encrypted: string): Record<string, string> | null {
  try {
    const key = getEncryptionKey(); // Throws if not configured
    const data = Buffer.from(encrypted, 'base64url');
    
    // Validate minimum data length (IV + authTag + some ciphertext)
    if (data.length < 33) {
      return null;
    }
    
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
  } catch (error) {
    // Log but don't expose error details
    console.error('Failed to decrypt OAuth pending data:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

const VALID_PROVIDERS = ['google', 'github'] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerParam } = await params;
  const provider = providerParam as OAuthProvider;

  if (!VALID_PROVIDERS.includes(provider as any)) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=invalid_provider`
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const returnedState = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_${error}`
    );
  }

  if (!code || !returnedState) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=missing_params`
    );
  }

  // Verify state for CSRF protection
  const cookieStore = await cookies();
  const storedState = cookieStore.get('oauth_state')?.value;
  const returnTo = cookieStore.get('oauth_return_to')?.value || '/dashboard';
  const organizationSlug = cookieStore.get('oauth_org')?.value;

  // Extract state (may contain organization slug)
  const [actualState] = returnedState.split(':');

  if (!storedState || actualState !== storedState) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=invalid_state`
    );
  }

  // Clear OAuth cookies
  cookieStore.delete('oauth_state');
  cookieStore.delete('oauth_return_to');
  cookieStore.delete('oauth_org');

  try {
    // Exchange code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/${provider}/callback`;
    const tokens = await exchangeCodeForTokens(provider, code, redirectUri);

    // Fetch user info from provider
    const userInfo = await fetchUserInfo(provider, tokens.accessToken);

    // Extract email domain for organization matching
    const emailDomain = userInfo.email.split('@')[1];

    // Check if user already exists with this email
    const existingUser = await prisma.user.findFirst({
      where: {
        email: userInfo.email,
        deletedAt: null,
      },
      include: {
        organization: true,
        oauthAccounts: {
          where: {
            provider,
            providerAccountId: userInfo.providerAccountId,
          },
        },
      },
    });

    if (existingUser) {
      // User exists - check if OAuth account is linked
      if (existingUser.oauthAccounts.length === 0) {
        // Link OAuth account to existing user
        await prisma.oAuthAccount.create({
          data: {
            userId: existingUser.id,
            provider,
            providerAccountId: userInfo.providerAccountId,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            idToken: tokens.idToken,
            tokenExpiresAt: tokens.refreshToken ? new Date(Date.now() + 3600 * 1000) : null,
            scope: provider === 'google' ? 'openid email profile' : 'read:user user:email',
          },
        });
      } else {
        // Update existing OAuth account tokens
        await prisma.oAuthAccount.update({
          where: {
            id: existingUser.oauthAccounts[0].id,
          },
          data: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            idToken: tokens.idToken,
            tokenExpiresAt: tokens.refreshToken ? new Date(Date.now() + 3600 * 1000) : null,
          },
        });
      }

      // Update last login and avatar if needed
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          lastLoginAt: new Date(),
          avatar: existingUser.avatar || userInfo.picture,
          emailVerified: true, // OAuth emails are pre-verified
          emailVerifiedAt: existingUser.emailVerifiedAt || new Date(),
          status: 'ACTIVE',
        },
      });

      // Create session
      await createSession(
        existingUser.id,
        existingUser.email,
        existingUser.role,
        existingUser.organizationId,
        existingUser.organization.slug
      );

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${returnTo}`);
    }

    // New user - check if organization exists with VERIFIED matching domain
    // Only auto-match if the organization has explicitly claimed this domain
    const matchingOrganization = await prisma.organization.findFirst({
      where: {
        domain: emailDomain,
        // Only match organizations that have a verified domain set
        // The domain field being set implies it was verified by admin
        NOT: {
          domain: null,
        },
      },
    });

    if (matchingOrganization) {
      // Organization exists with verified domain - store data in encrypted cookie and redirect
      const pendingData = encryptPendingData({
        email: userInfo.email,
        name: userInfo.name,
        provider,
        providerId: userInfo.providerAccountId,
        org: matchingOrganization.slug,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || '',
        idToken: tokens.idToken || '',
      });

      const response = NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/join-organization`
      );

      // Set encrypted pending data in httpOnly cookie (expires in 10 minutes)
      response.cookies.set('oauth_pending', pendingData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
        path: '/',
      });

      return response;
    }

    // Check if specific organization was requested
    if (organizationSlug) {
      const requestedOrg = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
      });

      if (requestedOrg) {
        // Store data in encrypted cookie and redirect
        const pendingData = encryptPendingData({
          email: userInfo.email,
          name: userInfo.name,
          provider,
          providerId: userInfo.providerAccountId,
          org: organizationSlug,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || '',
          idToken: tokens.idToken || '',
        });

        const response = NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/join-organization`
        );

        response.cookies.set('oauth_pending', pendingData, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 600,
          path: '/',
        });

        return response;
      }
    }

    // No matching organization - store data in encrypted cookie and redirect to complete registration
    const pendingData = encryptPendingData({
      email: userInfo.email,
      name: userInfo.name,
      provider,
      providerId: userInfo.providerAccountId,
      avatar: userInfo.picture || '',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
      idToken: tokens.idToken || '',
    });

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/register/complete`
    );

    response.cookies.set('oauth_pending', pendingData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_failed`
    );
  }
}
