import { describe, it, expect } from 'vitest';
import { Email } from '@/src/domain/value-objects/Email';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create a valid email', () => {
      const email = Email.create('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = Email.create('Test@EXAMPLE.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = Email.create('  test@example.com  ');
      expect(email.value).toBe('test@example.com');
    });

    it('should throw for empty email', () => {
      expect(() => Email.create('')).toThrow('Email cannot be empty');
    });

    it('should throw for whitespace-only email', () => {
      expect(() => Email.create('   ')).toThrow('Email cannot be empty');
    });

    it('should throw for invalid email format - no @', () => {
      expect(() => Email.create('invalid')).toThrow('Invalid email format');
    });

    it('should throw for invalid email format - no domain', () => {
      expect(() => Email.create('test@')).toThrow('Invalid email format');
    });

    it('should throw for invalid email format - no local part', () => {
      expect(() => Email.create('@example.com')).toThrow('Invalid email format');
    });

    it('should throw for invalid email format - no TLD', () => {
      expect(() => Email.create('test@example')).toThrow('Invalid email format');
    });

    it('should throw for email that is too long', () => {
      const longLocal = 'a'.repeat(250);
      expect(() => Email.create(`${longLocal}@example.com`)).toThrow('Email too long');
    });

    it('should accept various valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user123@example.co.uk',
        'user_name@example.org',
      ];

      for (const emailStr of validEmails) {
        expect(() => Email.create(emailStr)).not.toThrow();
      }
    });
  });

  describe('equals', () => {
    it('should return true for equal emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true for case-different emails (normalized)', () => {
      const email1 = Email.create('Test@Example.com');
      const email2 = Email.create('test@example.com');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create('user1@example.com');
      const email2 = Email.create('user2@example.com');

      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return email string', () => {
      const email = Email.create('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });
  });
});
