import crypto from 'crypto';

/**
 * AES-256-GCM Field-Level Encryption
 *
 * This module provides encryption and decryption functions for sensitive data (e.g., SSN)
 * using AES-256-GCM (Galois/Counter Mode), which provides both confidentiality and authenticity.
 *
 * Security Features:
 * - AES-256: Military-grade encryption algorithm
 * - GCM Mode: Authenticated encryption prevents tampering
 * - Random IV: Each encryption uses a unique initialization vector
 * - Auth Tag: Ensures data integrity and authenticity
 *
 * Compliance:
 * - GDPR Article 32: Appropriate technical measures for PII protection
 * - CCPA: Reasonable security procedures for sensitive personal information
 * - PCI DSS: Encryption for sensitive data at rest
 * - SOC 2: Data encryption controls
 *
 * Key Management:
 * - ENCRYPTION_KEY must be a 32-byte (64 character) hexadecimal string
 * - Generate using: openssl rand -hex 32
 * - Store securely in environment variables (never commit to git)
 * - Rotate keys periodically (see key rotation procedure in ARCHITECTURE.md)
 *
 * @module lib/encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits for GCM

/**
 * Get the encryption key from environment variables
 * @throws {Error} If ENCRYPTION_KEY is not set or invalid
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. ' +
      'Generate one using: openssl rand -hex 32'
    );
  }

  if (key.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be 64 characters (32 bytes in hex). ` +
      `Current length: ${key.length}. ` +
      `Generate a new one using: openssl rand -hex 32`
    );
  }

  // Validate hexadecimal format
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error(
      'ENCRYPTION_KEY must be a valid hexadecimal string. ' +
      'Generate one using: openssl rand -hex 32'
    );
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 *
 * @param plaintext - The text to encrypt (e.g., SSN)
 * @returns Encrypted string in format: iv:authTag:ciphertext (all hex-encoded)
 * @throws {Error} If encryption fails or ENCRYPTION_KEY is invalid
 *
 * @example
 * const encryptedSSN = encrypt('123-45-6789');
 * // Returns: "a1b2c3d4....:e5f6g7h8....:i9j0k1l2...."
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty or null value');
  }

  try {
    const key = getEncryptionKey();

    // Generate a random IV for this encryption operation
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher with key and IV
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the plaintext
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    // Get the authentication tag (ensures data integrity)
    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:ciphertext (all hex-encoded)
    // This format allows us to extract all components needed for decryption
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;
  } catch (error) {
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Decrypts an encrypted string using AES-256-GCM
 *
 * @param encryptedText - The encrypted text in format: iv:authTag:ciphertext
 * @returns Decrypted plaintext string
 * @throws {Error} If decryption fails, authentication fails, or format is invalid
 *
 * @example
 * const decryptedSSN = decrypt('a1b2c3d4....:e5f6g7h8....:i9j0k1l2....');
 * // Returns: "123-45-6789"
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error('Cannot decrypt empty or null value');
  }

  try {
    const key = getEncryptionKey();

    // Split the encrypted text into its components
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error(
        `Invalid encrypted text format. Expected "iv:authTag:ciphertext", ` +
        `got ${parts.length} parts. The data may be corrupted or not encrypted.`
      );
    }

    const [ivHex, authTagHex, ciphertext] = parts;

    // Validate hex format for all components
    if (!ivHex || !authTagHex || !ciphertext) {
      throw new Error('Encrypted text contains empty components');
    }

    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Validate IV and auth tag lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`);
    }

    // Create decipher with key and IV
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // Set the authentication tag (required for GCM mode)
    decipher.setAuthTag(authTag);

    // Decrypt the ciphertext
    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    // Authentication failures indicate tampering or wrong key
    if (error instanceof Error && error.message.includes('Unsupported state or unable to authenticate data')) {
      throw new Error(
        'Decryption failed: Authentication error. ' +
        'The data may have been tampered with or the encryption key is incorrect.'
      );
    }

    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Checks if a string is encrypted (has the expected format)
 *
 * @param text - The text to check
 * @returns true if the text appears to be encrypted, false otherwise
 *
 * @example
 * isEncrypted('123-45-6789'); // false
 * isEncrypted('a1b2c3d4....:e5f6g7h8....:i9j0k1l2....'); // true
 */
export function isEncrypted(text: string | null | undefined): boolean {
  if (!text) {
    return false;
  }

  // Check if the text matches the encrypted format: hex:hex:hex
  const parts = text.split(':');

  if (parts.length !== 3) {
    return false;
  }

  // Verify each part is valid hexadecimal
  return parts.every(part => part.length > 0 && /^[0-9a-f]+$/i.test(part));
}
