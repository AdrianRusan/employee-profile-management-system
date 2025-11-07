import { describe, it, expect } from 'vitest';
import { feedbackSchema } from '@/lib/validations/feedback';

describe('feedbackSchema', () => {
  it('validates correct feedback data', () => {
    const validData = {
      receiverId: 'clx1234567890abcdef12345',
      content: 'Great work on the project! Your attention to detail was impressive.',
    };

    const result = feedbackSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects content shorter than 20 characters', () => {
    const invalidData = {
      receiverId: 'clx1234567890abcdef12345',
      content: 'Short',
    };

    const result = feedbackSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Feedback must be at least 20 characters long');
    }
  });

  it('rejects content with fewer than 5 words', () => {
    const invalidData = {
      receiverId: 'clx1234567890abcdef12345',
      content: 'Four words here now', // 19 chars, 4 words
    };

    const result = feedbackSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects content with 4 words but sufficient chars', () => {
    const invalidData = {
      receiverId: 'clx1234567890abcdef12345',
      content: 'Four reasonable length words', // 28 chars, exactly 4 words
    };

    const result = feedbackSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const wordCountError = result.error.issues.find((issue) =>
        issue.message === 'Feedback must contain at least 5 words'
      );
      expect(wordCountError).toBeDefined();
    }
  });

  it('rejects single-word generic feedback', () => {
    const testCases = ['ok', 'good', 'fine', 'nice', 'great', 'OK', 'GOOD'];

    testCases.forEach((word) => {
      const invalidData = {
        receiverId: 'clx1234567890abcdef12345',
        content: word,
      };

      const result = feedbackSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  it('rejects content longer than 2000 characters', () => {
    const invalidData = {
      receiverId: 'clx1234567890abcdef12345',
      content: 'a'.repeat(2001),
    };

    const result = feedbackSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Feedback must not exceed 2000 characters');
    }
  });

  it('accepts content at minimum length (20 characters, 5 words)', () => {
    const validData = {
      receiverId: 'clx1234567890abcdef12345',
      content: 'This is valid feedback text',
    };

    const result = feedbackSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts content at maximum length (2000 characters)', () => {
    const validData = {
      receiverId: 'clx1234567890abcdef12345',
      // Create content with 2000 characters and at least 5 words
      content: 'This is valid feedback text. ' + 'a'.repeat(1971),
    };

    const result = feedbackSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('trims whitespace from content', () => {
    const validData = {
      receiverId: 'clx1234567890abcdef12345',
      content: '   This is valid feedback text   ',
    };

    const result = feedbackSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe('This is valid feedback text');
    }
  });

  it('rejects empty string', () => {
    const invalidData = {
      receiverId: 'clx1234567890abcdef12345',
      content: '',
    };

    const result = feedbackSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only content', () => {
    const invalidData = {
      receiverId: 'clx1234567890abcdef12345',
      content: '     ',
    };

    const result = feedbackSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('requires receiverId', () => {
    const invalidData = {
      content: 'Great work on the project!',
    };

    const result = feedbackSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid receiverId format', () => {
    const invalidData = {
      receiverId: 'invalid-id',
      content: 'Great work on the project! Your attention to detail was impressive.',
    };

    const result = feedbackSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('accepts valid CUID format for receiverId', () => {
    const validCUIDs = [
      'clx1234567890abcdef12345',
      'clxabcdefghijklmnopqrstu',
      'cm0123456789012345678901',
    ];

    validCUIDs.forEach((receiverId) => {
      const result = feedbackSchema.safeParse({
        receiverId,
        content: 'Great work on the project! Your attention to detail was impressive.',
      });
      expect(result.success).toBe(true);
    });
  });

  it('accepts feedback with exactly 5 words and 20 characters', () => {
    const validData = {
      receiverId: 'clx1234567890abcdef12345',
      content: 'Good job on project work', // Exactly 5 words, 24 chars
    };

    const result = feedbackSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects generic feedback even if it meets character count', () => {
    const invalidData = {
      receiverId: 'clx1234567890abcdef12345',
      content: 'good', // Generic word, too short
    };

    const result = feedbackSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
