import { describe, it, expect } from 'vitest';
import {
  absenceRequestFormSchema,
  updateAbsenceStatusSchema,
} from '@/lib/validations/absence';
import {
  polishFeedbackSchema,
  deleteFeedbackSchema,
  getFeedbackForUserSchema,
} from '@/lib/validations/feedback';
import {
  profileIdSchema,
  profileListSchema,
  completeProfileSchema,
} from '@/lib/validations/user';

describe('Absence validation schemas', () => {
  describe('absenceRequestFormSchema', () => {
    const getFutureDate = (daysFromNow: number): Date => {
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      return date;
    };

    it('validates correct form data with Date objects', () => {
      const validData = {
        startDate: getFutureDate(1),
        endDate: getFutureDate(5),
        reason: 'Medical appointment scheduled',
      };

      const result = absenceRequestFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects past start date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const invalidData = {
        startDate: yesterday,
        endDate: getFutureDate(5),
        reason: 'This should fail due to past date',
      };

      const result = absenceRequestFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateAbsenceStatusSchema', () => {
    it('validates APPROVED status update', () => {
      const validData = {
        id: 'clx1234567890abcdef12345',
        status: 'APPROVED' as const,
      };

      const result = updateAbsenceStatusSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates REJECTED status update', () => {
      const validData = {
        id: 'clx1234567890abcdef12345',
        status: 'REJECTED' as const,
      };

      const result = updateAbsenceStatusSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid status', () => {
      const invalidData = {
        id: 'clx1234567890abcdef12345',
        status: 'PENDING',
      };

      const result = updateAbsenceStatusSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects invalid CUID format', () => {
      const invalidData = {
        id: 'invalid-id',
        status: 'APPROVED',
      };

      const result = updateAbsenceStatusSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Feedback validation schemas', () => {
  describe('polishFeedbackSchema', () => {
    it('validates feedback content for polishing', () => {
      const validData = {
        content: 'This feedback needs to be polished and made more professional',
      };

      const result = polishFeedbackSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects content shorter than 20 characters', () => {
      const invalidData = {
        content: 'Too short',
      };

      const result = polishFeedbackSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects content with fewer than 5 words', () => {
      const invalidData = {
        content: 'Only four words here',
      };

      const result = polishFeedbackSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('deleteFeedbackSchema', () => {
    it('validates valid feedback ID', () => {
      const validData = {
        id: 'clx1234567890abcdef12345',
      };

      const result = deleteFeedbackSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid CUID format', () => {
      const invalidData = {
        id: 'invalid-id',
      };

      const result = deleteFeedbackSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('getFeedbackForUserSchema', () => {
    it('validates valid user ID', () => {
      const validData = {
        userId: 'clx1234567890abcdef12345',
      };

      const result = getFeedbackForUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid CUID format', () => {
      const invalidData = {
        userId: 'invalid-id',
      };

      const result = getFeedbackForUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('User/Profile validation schemas', () => {
  describe('profileIdSchema', () => {
    it('validates valid CUID', () => {
      const validData = {
        id: 'clx1234567890abcdef12345',
      };

      const result = profileIdSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid CUID format', () => {
      const invalidData = {
        id: 'not-a-cuid',
      };

      const result = profileIdSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('profileListSchema', () => {
    it('validates basic pagination request', () => {
      const validData = {
        limit: 10,
      };

      const result = profileListSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates request with search filter', () => {
      const validData = {
        limit: 20,
        search: 'John Doe',
      };

      const result = profileListSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates request with department filter', () => {
      const validData = {
        limit: 15,
        department: 'Engineering',
      };

      const result = profileListSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates request with role filter', () => {
      const validData = {
        limit: 10,
        role: 'MANAGER' as const,
      };

      const result = profileListSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates request with cursor pagination', () => {
      const validData = {
        limit: 10,
        cursor: 'clx1234567890abcdef12345',
      };

      const result = profileListSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid role value', () => {
      const invalidData = {
        limit: 10,
        role: 'INVALID_ROLE',
      };

      const result = profileListSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('completeProfileSchema', () => {
    it('validates complete profile with all fields', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        title: 'Senior Engineer',
        department: 'Engineering',
        bio: 'Full-stack developer',
        salary: 120000,
        ssn: '123-45-6789',
        address: '123 Main St, City, State 12345',
        performanceRating: 4,
      };

      const result = completeProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates profile with only non-sensitive fields', () => {
      const validData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        title: 'Manager',
        department: 'Operations',
      };

      const result = completeProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates profile with only sensitive fields added', () => {
      const validData = {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        salary: 95000,
        performanceRating: 3,
      };

      const result = completeProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
