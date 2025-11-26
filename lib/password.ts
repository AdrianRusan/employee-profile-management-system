import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 *
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password
 *
 * @example
 * const hashedPassword = await hashPassword('MySecurePassword123!');
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 *
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns Promise resolving to true if password matches
 *
 * @example
 * const isValid = await verifyPassword('MySecurePassword123!', hashedPassword);
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a URL-safe slug from a name
 *
 * @param name - Name to convert to slug
 * @returns Lowercase, hyphenated slug (max 50 chars)
 *
 * @example
 * generateSlug('My Company Name!') // 'my-company-name'
 * generateSlug('Acme Corp & Co.') // 'acme-corp-co'
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Generate a random token for email verification, password reset, etc.
 *
 * @param length - Length of the token (default 32)
 * @returns Random hex string
 *
 * @example
 * const token = generateToken(); // '7f8a9b...'
 */
export function generateToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
