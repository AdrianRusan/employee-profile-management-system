import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'COWORKER';
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'employee_profile_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function createSession(userId: string, role: 'EMPLOYEE' | 'MANAGER' | 'COWORKER'): Promise<void> {
  const session = await getSession();
  session.userId = userId;
  session.role = role;
  await session.save();
}

export async function deleteSession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export async function getCurrentUser(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.userId || !session.role) {
    return null;
  }
  return {
    userId: session.userId,
    role: session.role,
  };
}
