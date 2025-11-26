import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionConfig } from './config';

export interface SessionData {
  userId: string;
  id: string; // Alias for userId for compatibility with SessionUser
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'COWORKER';
  organizationId: string;
  organizationSlug: string;
}

const sessionOptions: SessionOptions = {
  password: (() => {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      throw new Error('SESSION_SECRET environment variable is required');
    }
    if (secret.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters');
    }
    return secret;
  })(),
  cookieName: sessionConfig.cookieName,
  cookieOptions: {
    httpOnly: true,
    secure: sessionConfig.secure,
    sameSite: sessionConfig.sameSite,
    maxAge: sessionConfig.maxAge,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function createSession(
  userId: string,
  email: string,
  role: 'EMPLOYEE' | 'MANAGER' | 'COWORKER',
  organizationId: string,
  organizationSlug: string
): Promise<void> {
  const session = await getSession();
  session.userId = userId;
  session.id = userId; // Alias for compatibility
  session.email = email;
  session.role = role;
  session.organizationId = organizationId;
  session.organizationSlug = organizationSlug;
  await session.save();
}

export async function deleteSession(): Promise<void> {
  const session = await getSession();
  // Destroy the session - this clears all data and the cookie
  session.destroy();
}

export async function getCurrentUser(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.userId || !session.role || !session.email || !session.organizationId || !session.organizationSlug) {
    return null;
  }
  return {
    userId: session.userId,
    id: session.userId, // Alias for compatibility
    email: session.email,
    role: session.role,
    organizationId: session.organizationId,
    organizationSlug: session.organizationSlug,
  };
}

/**
 * Clear any existing session cookie (for use in password reset, etc.)
 * This destroys the current session if one exists, regardless of the user
 */
export async function clearSessionCookie(): Promise<void> {
  try {
    const session = await getSession();
    session.destroy();
  } catch {
    // Ignore errors - session may not exist
  }
}
