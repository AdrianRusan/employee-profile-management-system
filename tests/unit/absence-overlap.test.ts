import { describe, it, expect } from 'vitest';

/**
 * Tests for absence overlap detection logic
 * These tests verify the date range overlap detection algorithm
 * used in server/routers/absence.ts create mutation
 */

describe('Absence overlap detection', () => {
  // Helper type for date ranges
  type DateRange = {
    startDate: Date;
    endDate: Date;
  };

  // Helper function that implements the overlap detection logic from absence.ts
  // This mimics the Prisma query logic for testing purposes
  const hasOverlap = (existing: DateRange, requested: DateRange): boolean => {
    // The Prisma query checks 4 scenarios:
    // 1. New request starts during existing absence
    // 2. New request ends during existing absence
    // 3. New request completely contains existing absence
    // 4. Existing absence completely contains new request

    const scenario1 =
      existing.startDate <= requested.startDate &&
      existing.endDate >= requested.startDate;

    const scenario2 =
      existing.startDate <= requested.endDate &&
      existing.endDate >= requested.endDate;

    const scenario3 =
      requested.startDate <= existing.startDate &&
      requested.endDate >= existing.endDate;

    const scenario4 =
      existing.startDate <= requested.startDate &&
      existing.endDate >= requested.endDate;

    return scenario1 || scenario2 || scenario3 || scenario4;
  };

  describe('Complete overlap scenarios', () => {
    it('detects when new request is completely within existing absence', () => {
      const existing = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-15'),
      };
      const requested = {
        startDate: new Date('2025-01-12'),
        endDate: new Date('2025-01-13'),
      };

      expect(hasOverlap(existing, requested)).toBe(true);
    });

    it('detects when existing absence is completely within new request', () => {
      const existing = {
        startDate: new Date('2025-01-12'),
        endDate: new Date('2025-01-13'),
      };
      const requested = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-15'),
      };

      expect(hasOverlap(existing, requested)).toBe(true);
    });
  });

  describe('Partial overlap scenarios', () => {
    it('detects partial overlap when new request starts before and ends during existing absence', () => {
      const existing = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-15'),
      };
      const requested = {
        startDate: new Date('2025-01-08'),
        endDate: new Date('2025-01-12'),
      };

      expect(hasOverlap(existing, requested)).toBe(true);
    });

    it('detects partial overlap when new request starts during and ends after existing absence', () => {
      const existing = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-15'),
      };
      const requested = {
        startDate: new Date('2025-01-13'),
        endDate: new Date('2025-01-18'),
      };

      expect(hasOverlap(existing, requested)).toBe(true);
    });
  });

  describe('No overlap scenarios', () => {
    it('detects no overlap when new request is completely before existing absence', () => {
      const existing = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-15'),
      };
      const requested = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-09'),
      };

      expect(hasOverlap(existing, requested)).toBe(false);
    });

    it('detects no overlap when new request is completely after existing absence', () => {
      const existing = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-15'),
      };
      const requested = {
        startDate: new Date('2025-01-16'),
        endDate: new Date('2025-01-20'),
      };

      expect(hasOverlap(existing, requested)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('detects overlap when new request starts on same day existing absence ends', () => {
      const existing = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-15'),
      };
      const requested = {
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-20'),
      };

      // Same day counts as overlap (employee can't be absent twice on same day)
      expect(hasOverlap(existing, requested)).toBe(true);
    });

    it('detects overlap when new request ends on same day existing absence starts', () => {
      const existing = {
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-20'),
      };
      const requested = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-15'),
      };

      // Same day counts as overlap
      expect(hasOverlap(existing, requested)).toBe(true);
    });

    it('detects overlap when dates are exactly the same', () => {
      const existing = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-15'),
      };
      const requested = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-15'),
      };

      expect(hasOverlap(existing, requested)).toBe(true);
    });

    it('detects no overlap when dates are consecutive days (day before)', () => {
      const existing = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-15'),
      };
      const requested = {
        startDate: new Date('2025-01-05'),
        endDate: new Date('2025-01-09'),
      };

      expect(hasOverlap(existing, requested)).toBe(false);
    });

    it('detects no overlap when dates are consecutive days (day after)', () => {
      const existing = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-15'),
      };
      const requested = {
        startDate: new Date('2025-01-16'),
        endDate: new Date('2025-01-20'),
      };

      expect(hasOverlap(existing, requested)).toBe(false);
    });
  });

  describe('Single day absences', () => {
    it('detects overlap when both absences are same single day', () => {
      const existing = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-10'),
      };
      const requested = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-10'),
      };

      expect(hasOverlap(existing, requested)).toBe(true);
    });

    it('detects overlap when single day request falls within multi-day absence', () => {
      const existing = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-15'),
      };
      const requested = {
        startDate: new Date('2025-01-12'),
        endDate: new Date('2025-01-12'),
      };

      expect(hasOverlap(existing, requested)).toBe(true);
    });

    it('detects no overlap when single day absences are different days', () => {
      const existing = {
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-10'),
      };
      const requested = {
        startDate: new Date('2025-01-11'),
        endDate: new Date('2025-01-11'),
      };

      expect(hasOverlap(existing, requested)).toBe(false);
    });
  });
});
