import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthorizationUrl, generateOAuthState, isProviderConfigured, OAuthProvider } from '@/lib/auth/oauth';

const VALID_PROVIDERS = ['google', 'github'] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerParam } = await params;
  const provider = providerParam as OAuthProvider;

  if (!VALID_PROVIDERS.includes(provider as any)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  if (!isProviderConfigured(provider)) {
    return NextResponse.json({ error: 'Provider not configured' }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const organizationSlug = searchParams.get('org');
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  const state = generateOAuthState();
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/${provider}/callback`;

  // Store state in cookie for verification
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  });
  cookieStore.set('oauth_return_to', returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
  });
  if (organizationSlug) {
    cookieStore.set('oauth_org', organizationSlug, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    });
  }

  const authUrl = getAuthorizationUrl(provider, redirectUri, state, organizationSlug || undefined);
  return NextResponse.redirect(authUrl);
}
