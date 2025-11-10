import * as Tokens from 'csrf';
import { cookies } from 'next/headers';

const tokens = new Tokens.default();

// Secret is stored in session (iron-session encrypted)
// Token is sent to client and validated on mutations
const CSRF_SECRET_COOKIE = '__Host-csrf-secret';
const CSRF_TOKEN_COOKIE = '__Host-csrf-token';

/**
 * Generate a new CSRF token pair (secret + token)
 * The secret is stored in an httpOnly cookie
 * The token is stored in a readable cookie for client access
 */
export async function generateCsrfToken(): Promise<string> {
  const cookieStore = await cookies();

  // Check if we already have a secret
  let secret = cookieStore.get(CSRF_SECRET_COOKIE)?.value;

  // Generate new secret if none exists
  if (!secret) {
    secret = tokens.secretSync();
    cookieStore.set(CSRF_SECRET_COOKIE, secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
  }

  // Generate token from secret
  const token = tokens.create(secret);

  // Store token in readable cookie for client access
  cookieStore.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: false, // Client needs to read this
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  return token;
}

/**
 * Validate a CSRF token against the stored secret
 */
export async function validateCsrfToken(token: string | null | undefined): Promise<boolean> {
  if (!token) {
    return false;
  }

  const cookieStore = await cookies();
  const secret = cookieStore.get(CSRF_SECRET_COOKIE)?.value;

  if (!secret) {
    return false;
  }

  return tokens.verify(secret, token);
}

/**
 * Get the current CSRF token from cookies (for server-side rendering)
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_TOKEN_COOKIE)?.value || null;
}

/**
 * Validate CSRF token from request headers
 * Supports both x-csrf-token header and cookie-based tokens
 */
export async function validateCsrfFromRequest(request: Request): Promise<boolean> {
  // Get token from header (preferred for API calls)
  const headerToken = request.headers.get('x-csrf-token');

  if (headerToken) {
    return validateCsrfToken(headerToken);
  }

  // Fallback to cookie token (for form submissions)
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;

  return validateCsrfToken(cookieToken);
}
