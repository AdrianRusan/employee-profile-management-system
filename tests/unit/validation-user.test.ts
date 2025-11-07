import { describe, it, expect } from 'vitest';
import { profileSchema, sensitiveProfileSchema } from '@/lib/validations/user';

describe('profileSchema', () => {
  it('validates correct profile data', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      title: 'Software Engineer',
      department: 'Engineering',
      bio: 'Full-stack developer with 5 years of experience',
    };

    const result = profileSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const invalidData = {
      name: '',
      email: 'john@example.com',
      title: 'Software Engineer',
      department: 'Engineering',
    };

    const result = profileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const invalidData = {
      name: 'John Doe',
      email: 'invalid-email',
      title: 'Software Engineer',
      department: 'Engineering',
    };

    const result = profileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 100 characters', () => {
    const invalidData = {
      name: 'a'.repeat(101),
      email: 'john@example.com',
      title: 'Software Engineer',
      department: 'Engineering',
    };

    const result = profileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('allows optional bio', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      title: 'Software Engineer',
      department: 'Engineering',
    };

    const result = profileSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects bio longer than 500 characters', () => {
    const invalidData = {
      name: 'John Doe',
      email: 'john@example.com',
      title: 'Software Engineer',
      department: 'Engineering',
      bio: 'a'.repeat(501),
    };

    const result = profileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('accepts valid email formats', () => {
    const validEmails = [
      'test@example.com',
      'user.name@example.co.uk',
      'first+last@subdomain.example.com',
    ];

    validEmails.forEach((email) => {
      const result = profileSchema.safeParse({
        name: 'Test User',
        email,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('sensitiveProfileSchema', () => {
  it('validates correct sensitive data', () => {
    const validData = {
      salary: 100000,
      performanceRating: 4,
    };

    const result = sensitiveProfileSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('allows optional salary', () => {
    const validData = {
      performanceRating: 4,
    };

    const result = sensitiveProfileSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects negative salary', () => {
    const invalidData = {
      salary: -1000,
      performanceRating: 4,
    };

    const result = sensitiveProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects zero salary', () => {
    const invalidData = {
      salary: 0,
      performanceRating: 4,
    };

    const result = sensitiveProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects performance rating below 1', () => {
    const invalidData = {
      salary: 100000,
      performanceRating: 0,
    };

    const result = sensitiveProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects performance rating above 5', () => {
    const invalidData = {
      salary: 100000,
      performanceRating: 6,
    };

    const result = sensitiveProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('accepts performance rating at minimum boundary (1)', () => {
    const validData = {
      salary: 100000,
      performanceRating: 1,
    };

    const result = sensitiveProfileSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts performance rating at maximum boundary (5)', () => {
    const validData = {
      salary: 100000,
      performanceRating: 5,
    };

    const result = sensitiveProfileSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('validates SSN format correctly', () => {
    const validSSN = {
      ssn: '123-45-6789',
    };

    const result = sensitiveProfileSchema.safeParse(validSSN);
    expect(result.success).toBe(true);
  });

  it('rejects invalid SSN format', () => {
    const invalidFormats = ['12345678', '123456789', '123-456-789', 'abc-de-fghi'];

    invalidFormats.forEach((ssn) => {
      const result = sensitiveProfileSchema.safeParse({ ssn });
      expect(result.success).toBe(false);
    });
  });

  it('rejects address longer than 300 characters', () => {
    const invalidData = {
      address: 'a'.repeat(301),
    };

    const result = sensitiveProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
