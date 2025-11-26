import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

/**
 * GET /api/auth/pending-oauth
 * Returns the pending OAuth registration data from the encrypted httpOnly cookie
 * This allows client components to access OAuth data securely without URL params
 */
export async function GET() {
  const cookieStore = await cookies();
  const pendingCookie = cookieStore.get('oauth_pending')?.value;

  if (!pendingCookie) {
    return NextResponse.json(
      { error: 'No pending OAuth data found' },
      { status: 404 }
    );
  }

  const data = decryptPendingData(pendingCookie);

  if (!data) {
    // Clear invalid cookie
    cookieStore.delete('oauth_pending');
    return NextResponse.json(
      { error: 'Invalid or expired OAuth data' },
      { status: 400 }
    );
  }

  // Return data without sensitive tokens to the client
  // The tokens are only used server-side when completing registration
  return NextResponse.json({
    email: data.email,
    name: data.name,
    provider: data.provider,
    providerId: data.providerId,
    org: data.org,
    avatar: data.avatar,
  });
}

/**
 * DELETE /api/auth/pending-oauth
 * Clears the pending OAuth cookie (used after successful registration or on cancel)
 */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('oauth_pending');
  return NextResponse.json({ success: true });
}
