/**
 * Encryption Port Interface
 * Defines contract for encryption services
 */
export interface IEncryption {
  /**
   * Encrypt plaintext data
   */
  encrypt(plaintext: string): Promise<string>;

  /**
   * Decrypt ciphertext
   */
  decrypt(ciphertext: string): Promise<string>;

  /**
   * Check if encryption is available
   */
  isAvailable(): boolean;
}
