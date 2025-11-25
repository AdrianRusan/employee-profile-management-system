import { IEncryption } from '../../application/ports/IEncryption';
import { encrypt, decrypt, isEncrypted } from '../../../lib/encryption';

/**
 * Crypto implementation of IEncryption interface
 * Wraps the existing encryption utilities to conform to the application port
 *
 * Uses AES-256-GCM for field-level encryption of sensitive data (e.g., SSN)
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
 */
export class CryptoEncryption implements IEncryption {
  /**
   * Encrypts a plaintext string using AES-256-GCM
   *
   * @param plaintext - The text to encrypt (e.g., SSN)
   * @returns Encrypted string in format: iv:authTag:ciphertext (all hex-encoded)
   * @throws {Error} If encryption fails or ENCRYPTION_KEY is invalid
   *
   * @example
   * const encrypted = await encryption.encrypt('123-45-6789');
   * // Returns: "a1b2c3d4....:e5f6g7h8....:i9j0k1l2...."
   */
  async encrypt(plaintext: string): Promise<string> {
    return encrypt(plaintext);
  }

  /**
   * Decrypts an encrypted string using AES-256-GCM
   *
   * @param ciphertext - The encrypted text in format: iv:authTag:ciphertext
   * @returns Decrypted plaintext string
   * @throws {Error} If decryption fails, authentication fails, or format is invalid
   *
   * @example
   * const decrypted = await encryption.decrypt('a1b2c3d4....:e5f6g7h8....:i9j0k1l2....');
   * // Returns: "123-45-6789"
   */
  async decrypt(ciphertext: string): Promise<string> {
    return decrypt(ciphertext);
  }

  /**
   * Checks if encryption is available (ENCRYPTION_KEY is set)
   *
   * @returns true if encryption key is configured, false otherwise
   *
   * @example
   * if (encryption.isAvailable()) {
   *   const encrypted = await encryption.encrypt(ssn);
   * } else {
   *   // Handle missing encryption key
   * }
   */
  isAvailable(): boolean {
    return !!process.env.ENCRYPTION_KEY;
  }

  /**
   * Checks if a string appears to be encrypted
   *
   * @param text - The text to check
   * @returns true if the text appears to be encrypted, false otherwise
   *
   * @example
   * encryption.isEncrypted('123-45-6789'); // false
   * encryption.isEncrypted('a1b2c3d4....:e5f6g7h8....:i9j0k1l2....'); // true
   */
  isEncrypted(text: string | null | undefined): boolean {
    return isEncrypted(text);
  }
}
