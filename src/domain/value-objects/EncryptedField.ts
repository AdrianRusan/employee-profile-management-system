/**
 * EncryptedField Value Object
 * Represents an encrypted sensitive field
 */
export class EncryptedField<T extends string = string> {
  private constructor(
    private readonly _encrypted: string,
    private readonly _decrypted?: T
  ) {}

  /**
   * Create from plaintext value (will be encrypted)
   */
  static fromPlaintext<T extends string>(value: T): EncryptedField<T> {
    // Note: Actual encryption happens in infrastructure layer
    // This is just a marker that indicates encryption is needed
    return new EncryptedField<T>('', value);
  }

  /**
   * Create from already encrypted value
   */
  static fromEncrypted<T extends string>(encrypted: string): EncryptedField<T> {
    return new EncryptedField<T>(encrypted);
  }

  /**
   * Check if value needs encryption
   */
  needsEncryption(): boolean {
    return !!this._decrypted && !this._encrypted;
  }

  /**
   * Check if value is encrypted
   */
  isEncrypted(): boolean {
    return !!this._encrypted;
  }

  /**
   * Get plaintext value (may be undefined if not decrypted yet)
   */
  getPlaintext(): T | undefined {
    return this._decrypted;
  }

  /**
   * Get encrypted value
   */
  getEncrypted(): string {
    return this._encrypted;
  }

  /**
   * Create a new instance with decrypted value
   */
  withDecrypted(decrypted: T): EncryptedField<T> {
    return new EncryptedField(this._encrypted, decrypted);
  }

  /**
   * Create a new instance with encrypted value
   */
  withEncrypted(encrypted: string): EncryptedField<T> {
    return new EncryptedField(encrypted, this._decrypted);
  }
}
