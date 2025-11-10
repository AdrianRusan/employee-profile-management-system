import { describe, it, expect } from 'vitest';
import { absenceRequestSchema } from '@/lib/validations/absence';

describe('absenceRequestSchema', () => {
  // Helper to create future dates (to avoid "past date" validation errors)
  const getFutureDate = (daysFromNow: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  };

  it('validates correct absence request data', () => {
    const validData = {
      startDate: getFutureDate(1),
      endDate: getFutureDate(5),
      reason: 'Family vacation for the holidays',
    };

    const result = absenceRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects reason shorter than 10 characters', () => {
    const invalidData = {
      startDate: getFutureDate(1),
      endDate: getFutureDate(5),
      reason: 'Short',
    };

    const result = absenceRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 10 characters');
    }
  });

  it('rejects reason longer than 500 characters', () => {
    const invalidData = {
      startDate: getFutureDate(1),
      endDate: getFutureDate(5),
      reason: 'a'.repeat(501),
    };

    const result = absenceRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('not exceed 500 characters');
    }
  });

  it('rejects end date before start date', () => {
    const invalidData = {
      startDate: getFutureDate(5),
      endDate: getFutureDate(1),
      reason: 'Family vacation',
    };

    const result = absenceRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('End date must be on or after start date');
    }
  });

  it('accepts same start and end date', () => {
    const date = getFutureDate(1);
    const validData = {
      startDate: date,
      endDate: date,
      reason: 'Medical appointment today only',
    };

    const result = absenceRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects absence period longer than 1 year', () => {
    const invalidData = {
      startDate: getFutureDate(1),
      endDate: getFutureDate(367), // More than 365 days (366 is exactly 365 days diff)
      reason: 'Extended leave for more than a year',
    };

    const result = absenceRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Absence period cannot exceed 1 year');
    }
  });

  it('accepts absence period of exactly 365 days', () => {
    const validData = {
      startDate: getFutureDate(1),
      endDate: getFutureDate(366), // Exactly 365 days difference
      reason: 'Extended sabbatical for exactly one year',
    };

    const result = absenceRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('requires all fields', () => {
    const invalidData = {
      startDate: getFutureDate(1),
    };

    const result = absenceRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('accepts minimum valid reason length (10 characters)', () => {
    const validData = {
      startDate: getFutureDate(1),
      endDate: getFutureDate(2),
      reason: '1234567890', // Exactly 10 characters
    };

    const result = absenceRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts maximum valid reason length (500 characters)', () => {
    const validData = {
      startDate: getFutureDate(1),
      endDate: getFutureDate(2),
      reason: 'a'.repeat(500), // Exactly 500 characters
    };

    const result = absenceRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('coerces string dates to Date objects', () => {
    // Use future dates to avoid "past date" validation error
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const validData = {
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
      reason: 'Family vacation for the holidays',
    };

    const result = absenceRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date);
      expect(result.data.endDate).toBeInstanceOf(Date);
    }
  });

  it('rejects invalid date strings', () => {
    const invalidData = {
      startDate: 'not-a-date',
      endDate: getFutureDate(5),
      reason: 'Family vacation',
    };

    const result = absenceRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
