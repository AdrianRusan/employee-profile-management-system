import { paginationSchema, PAGINATION_LIMITS } from './pagination';

describe('Pagination Schema', () => {
  describe('limit validation', () => {
    it('should accept valid limit within range', () => {
      const result = paginationSchema.safeParse({ limit: 50 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('should apply default limit when not provided', () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(PAGINATION_LIMITS.DEFAULT);
      }
    });

    it('should accept minimum limit (1)', () => {
      const result = paginationSchema.safeParse({ limit: PAGINATION_LIMITS.MIN });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1);
      }
    });

    it('should accept maximum limit (100)', () => {
      const result = paginationSchema.safeParse({ limit: PAGINATION_LIMITS.MAX });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });

    it('should REJECT limit greater than MAX (DoS protection)', () => {
      const result = paginationSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 100');
      }
    });

    it('should REJECT extremely large limit (999999)', () => {
      const result = paginationSchema.safeParse({ limit: 999999 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 100');
      }
    });

    it('should reject limit less than MIN', () => {
      const result = paginationSchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 1');
      }
    });

    it('should reject negative limit', () => {
      const result = paginationSchema.safeParse({ limit: -10 });
      expect(result.success).toBe(false);
    });
  });

  describe('cursor validation', () => {
    it('should accept optional cursor', () => {
      const result = paginationSchema.safeParse({ limit: 20, cursor: 'somecursor' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBe('somecursor');
      }
    });

    it('should work without cursor', () => {
      const result = paginationSchema.safeParse({ limit: 20 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBeUndefined();
      }
    });
  });
});
