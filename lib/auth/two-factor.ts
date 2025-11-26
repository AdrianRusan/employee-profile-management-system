import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Employee Hub';

/**
 * Generate a new TOTP secret for 2FA setup
 * @returns A base32-encoded secret string
 */
export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate QR code for authenticator app
 * @param email - User's email address
 * @param secret - TOTP secret
 * @returns Data URL of the QR code image
 */
export async function generateQRCode(email: string, secret: string): Promise<string> {
  const otpauth = authenticator.keyuri(email, APP_NAME, secret);
  return QRCode.toDataURL(otpauth);
}

/**
 * Verify TOTP code
 * @param token - 6-digit TOTP code from authenticator app
 * @param secret - User's TOTP secret
 * @returns true if the code is valid
 */
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    return false;
  }
}

/**
 * Generate backup codes for account recovery
 * @param count - Number of backup codes to generate (default 10)
 * @returns Array of alphanumeric backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing characters (0, O, 1, I)

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes using cryptographically secure random
    const randomValues = randomBytes(8);
    const code = Array.from(randomValues, (byte) =>
      charset[byte % charset.length]
    ).join('');
    codes.push(code);
  }

  return codes;
}

/**
 * Hash backup codes for secure storage
 * @param codes - Array of plain backup codes
 * @returns Array of hashed backup codes
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const { hashPassword } = await import('@/lib/password');
  return Promise.all(codes.map(code => hashPassword(code)));
}

/**
 * Verify a backup code against stored hashed codes
 * @param code - Plain backup code to verify
 * @param hashedCodes - Array of hashed backup codes
 * @returns Object with validation result and index of matched code (-1 if not found)
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<{ valid: boolean; index: number }> {
  const { verifyPassword } = await import('@/lib/password');

  // Normalize the code to uppercase for comparison
  const normalizedCode = code.toUpperCase();

  for (let i = 0; i < hashedCodes.length; i++) {
    if (await verifyPassword(normalizedCode, hashedCodes[i])) {
      return { valid: true, index: i };
    }
  }

  return { valid: false, index: -1 };
}
