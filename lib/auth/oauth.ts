import crypto from 'crypto';

/**
 * Validate that ENCRYPTION_KEY is properly configured
 * Called at module load to fail fast if misconfigured
 */
function validateEncryptionKey(): void {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn(
      'WARNING: ENCRYPTION_KEY environment variable is not set. OAuth features will not work.'
    );
    return;
  }
  
  // Validate key is proper hex-encoded 32-byte key (64 hex chars)
  if (!/^[a-f0-9]{64}$/i.test(key)) {
    console.warn(
      'WARNING: ENCRYPTION_KEY must be a 64-character hex string (32 bytes). OAuth features may not work correctly.'
    );
  }
}

// Validate on module load
validateEncryptionKey();

/**
 * Get encryption key with validation
 * Throws if key is not configured (use in encryption/decryption functions)
 */
export function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required for OAuth. ' +
      'Generate one with: openssl rand -hex 32'
    );
  }
  
  if (!/^[a-f0-9]{64}$/i.test(key)) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
      'Generate one with: openssl rand -hex 32'
    );
  }
  
  return Buffer.from(key, 'hex');
}

// OAuth Provider Configuration
export const OAUTH_PROVIDERS = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: ['openid', 'email', 'profile'],
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scopes: ['read:user', 'user:email'],
  },
};

export type OAuthProvider = keyof typeof OAUTH_PROVIDERS;

// Generate state for CSRF protection
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate authorization URL
export function getAuthorizationUrl(
  provider: OAuthProvider,
  redirectUri: string,
  state: string,
  organizationSlug?: string
): string {
  const config = OAUTH_PROVIDERS[provider];
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state: organizationSlug ? `${state}:${organizationSlug}` : state,
    prompt: 'select_account',
  });
  return `${config.authorizationUrl}?${params.toString()}`;
}

// Exchange code for tokens
export async function exchangeCodeForTokens(
  provider: OAuthProvider,
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; idToken?: string; refreshToken?: string }> {
  const config = OAUTH_PROVIDERS[provider];

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // GitHub requires Accept header to get JSON response
  if (provider === 'github') {
    headers['Accept'] = 'application/json';
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers,
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
  };
}

// Fetch user info
export async function fetchUserInfo(
  provider: OAuthProvider,
  accessToken: string
): Promise<{ email: string; name: string; picture?: string; providerAccountId: string }> {
  const config = OAUTH_PROVIDERS[provider];
  const response = await fetch(config.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  const data = await response.json();

  if (provider === 'google') {
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
      providerAccountId: data.id,
    };
  } else if (provider === 'github') {
    // GitHub may not return email in main response, need to fetch from emails endpoint
    let email = data.email;
    if (!email) {
      // Fetch emails separately
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary && e.verified);
        email = primaryEmail?.email || emails[0]?.email;
      }
    }
    return {
      email: email,
      name: data.name || data.login,
      picture: data.avatar_url,
      providerAccountId: String(data.id),
    };
  }

  throw new Error('Unknown provider');
}

// Check if provider is configured
export function isProviderConfigured(provider: OAuthProvider): boolean {
  const config = OAUTH_PROVIDERS[provider];
  return Boolean(config.clientId && config.clientSecret);
}

// Get configured providers
export function getConfiguredProviders(): OAuthProvider[] {
  return (Object.keys(OAUTH_PROVIDERS) as OAuthProvider[]).filter(isProviderConfigured);
}
