/**
 * Race Condition Integration Test for Absence Overlap Detection
 *
 * This test verifies that the serializable transaction isolation level
 * prevents concurrent absence requests from creating overlapping absences.
 *
 * Test Coverage:
 * - Concurrent requests with overlapping dates (should conflict)
 * - Concurrent requests with non-overlapping dates (should both succeed)
 * - High-load scenario with 10+ concurrent requests
 * - Proper error handling for serialization failures
 *
 * Related: TODO-011 - Absence Overlap Race Condition
 */

import { PrismaClient } from '@prisma/client';
import { absenceRouter } from '../absence';
import { Session } from '@/lib/auth/session';

// Mock TRPC context
interface TestContext {
  prisma: PrismaClient;
  session: Session;
}

describe('Absence Race Condition Protection', () => {
  let prisma: PrismaClient;
  let testUserId: string;

  beforeAll(async () => {
    // Initialize Prisma client
    prisma = new PrismaClient();

    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'race-test@example.com',
        password: 'hashed-password',
        role: 'EMPLOYEE',
        department: 'Engineering',
        position: 'Developer',
      },
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.absenceRequest.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up absence requests before each test
    await prisma.absenceRequest.deleteMany({
      where: { userId: testUserId },
    });
  });

  /**
   * Test 1: Concurrent Overlapping Requests
   * Verifies that only one of two concurrent overlapping requests succeeds
   */
  it('should prevent concurrent overlapping absence requests', async () => {
    // Create two identical overlapping requests
    const startDate = new Date('2025-02-01');
    const endDate = new Date('2025-02-05');

    const ctx: TestContext = {
      prisma,
      session: {
        userId: testUserId,
        role: 'EMPLOYEE',
        csrf: 'test-token',
      },
    };

    const input = {
      startDate,
      endDate,
      reason: 'Vacation',
    };

    // Execute both requests concurrently
    const [result1, result2] = await Promise.allSettled([
      absenceRouter.createCaller(ctx).create(input),
      absenceRouter.createCaller(ctx).create(input),
    ]);

    // One should succeed, one should fail
    const succeeded = [result1, result2].filter((r) => r.status === 'fulfilled');
    const failed = [result1, result2].filter((r) => r.status === 'rejected');

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);

    // Verify error message contains conflict information
    const failedResult = failed[0] as PromiseRejectedResult;
    expect(failedResult.reason.message).toMatch(
      /overlap|conflict|being processed/i
    );

    // Verify only one absence request exists in database
    const absences = await prisma.absenceRequest.findMany({
      where: { userId: testUserId },
    });
    expect(absences).toHaveLength(1);
  });

  /**
   * Test 2: Concurrent Partially Overlapping Requests
   * Tests various overlap scenarios
   */
  it('should detect partial overlaps in concurrent requests', async () => {
    const ctx: TestContext = {
      prisma,
      session: {
        userId: testUserId,
        role: 'EMPLOYEE',
        csrf: 'test-token',
      },
    };

    // Request 1: Feb 1-10
    const request1 = {
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-02-10'),
      reason: 'Vacation Part 1',
    };

    // Request 2: Feb 8-15 (overlaps with request 1)
    const request2 = {
      startDate: new Date('2025-02-08'),
      endDate: new Date('2025-02-15'),
      reason: 'Vacation Part 2',
    };

    // Execute concurrently
    const [result1, result2] = await Promise.allSettled([
      absenceRouter.createCaller(ctx).create(request1),
      absenceRouter.createCaller(ctx).create(request2),
    ]);

    // One should succeed, one should fail
    const succeeded = [result1, result2].filter((r) => r.status === 'fulfilled');
    const failed = [result1, result2].filter((r) => r.status === 'rejected');

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);

    // Verify only one absence request exists
    const absences = await prisma.absenceRequest.findMany({
      where: { userId: testUserId },
    });
    expect(absences).toHaveLength(1);
  });

  /**
   * Test 3: Concurrent Non-Overlapping Requests
   * Verifies that non-overlapping requests both succeed
   */
  it('should allow concurrent non-overlapping absence requests', async () => {
    const ctx: TestContext = {
      prisma,
      session: {
        userId: testUserId,
        role: 'EMPLOYEE',
        csrf: 'test-token',
      },
    };

    // Request 1: Feb 1-5
    const request1 = {
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-02-05'),
      reason: 'Vacation Week 1',
    };

    // Request 2: Feb 10-15 (no overlap)
    const request2 = {
      startDate: new Date('2025-02-10'),
      endDate: new Date('2025-02-15'),
      reason: 'Vacation Week 2',
    };

    // Execute concurrently
    const [result1, result2] = await Promise.allSettled([
      absenceRouter.createCaller(ctx).create(request1),
      absenceRouter.createCaller(ctx).create(request2),
    ]);

    // Both should succeed
    expect(result1.status).toBe('fulfilled');
    expect(result2.status).toBe('fulfilled');

    // Verify both absence requests exist
    const absences = await prisma.absenceRequest.findMany({
      where: { userId: testUserId },
      orderBy: { startDate: 'asc' },
    });
    expect(absences).toHaveLength(2);
    expect(absences[0].startDate).toEqual(request1.startDate);
    expect(absences[1].startDate).toEqual(request2.startDate);
  });

  /**
   * Test 4: High-Load Concurrent Requests
   * Verifies protection under heavy concurrent load (10+ requests)
   */
  it('should handle 10+ concurrent overlapping requests safely', async () => {
    const ctx: TestContext = {
      prisma,
      session: {
        userId: testUserId,
        role: 'EMPLOYEE',
        csrf: 'test-token',
      },
    };

    const startDate = new Date('2025-03-01');
    const endDate = new Date('2025-03-05');

    // Create 15 identical concurrent requests
    const requests = Array.from({ length: 15 }, (_, i) => ({
      startDate,
      endDate,
      reason: `Concurrent Request ${i + 1}`,
    }));

    const results = await Promise.allSettled(
      requests.map((input) => absenceRouter.createCaller(ctx).create(input))
    );

    // Only one should succeed
    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(14);

    // Verify all failures are due to conflicts
    failed.forEach((result) => {
      const rejectedResult = result as PromiseRejectedResult;
      expect(rejectedResult.reason.message).toMatch(
        /overlap|conflict|being processed/i
      );
    });

    // Verify only one absence request exists
    const absences = await prisma.absenceRequest.findMany({
      where: { userId: testUserId },
    });
    expect(absences).toHaveLength(1);
  });

  /**
   * Test 5: Edge Case - Request Contains Existing Absence
   * New request completely contains an existing absence
   */
  it('should detect when new request contains existing absence', async () => {
    // Create initial absence: Feb 5-7
    await prisma.absenceRequest.create({
      data: {
        userId: testUserId,
        startDate: new Date('2025-02-05'),
        endDate: new Date('2025-02-07'),
        reason: 'Short Leave',
        status: 'APPROVED',
      },
    });

    const ctx: TestContext = {
      prisma,
      session: {
        userId: testUserId,
        role: 'EMPLOYEE',
        csrf: 'test-token',
      },
    };

    // Try to create longer absence that contains the existing one: Feb 1-10
    const input = {
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-02-10'),
      reason: 'Extended Vacation',
    };

    await expect(absenceRouter.createCaller(ctx).create(input)).rejects.toThrow(
      /overlap/i
    );

    // Verify still only one absence
    const absences = await prisma.absenceRequest.findMany({
      where: { userId: testUserId },
    });
    expect(absences).toHaveLength(1);
  });

  /**
   * Test 6: Only PENDING/APPROVED Absences Block
   * REJECTED absences should not block new requests
   */
  it('should allow requests that overlap with REJECTED absences', async () => {
    // Create rejected absence
    await prisma.absenceRequest.create({
      data: {
        userId: testUserId,
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-05'),
        reason: 'Rejected Request',
        status: 'REJECTED',
      },
    });

    const ctx: TestContext = {
      prisma,
      session: {
        userId: testUserId,
        role: 'EMPLOYEE',
        csrf: 'test-token',
      },
    };

    // Create new request with same dates
    const input = {
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-04-05'),
      reason: 'New Request (should succeed)',
    };

    const result = await absenceRouter.createCaller(ctx).create(input);

    expect(result).toBeDefined();
    expect(result.status).toBe('PENDING');

    // Verify both absences exist (rejected + new pending)
    const absences = await prisma.absenceRequest.findMany({
      where: { userId: testUserId },
    });
    expect(absences).toHaveLength(2);
  });

  /**
   * Test 7: Serialization Error Handling
   * Verifies proper error messages for serialization failures
   */
  it('should provide clear error message on serialization conflict', async () => {
    const ctx: TestContext = {
      prisma,
      session: {
        userId: testUserId,
        role: 'EMPLOYEE',
        csrf: 'test-token',
      },
    };

    const input = {
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-05-05'),
      reason: 'Vacation',
    };

    // Create two concurrent requests
    const [result1, result2] = await Promise.allSettled([
      absenceRouter.createCaller(ctx).create(input),
      absenceRouter.createCaller(ctx).create(input),
    ]);

    // At least one should have a user-friendly error message
    const results = [result1, result2];
    const hasConflictError = results.some(
      (r) =>
        r.status === 'rejected' &&
        (r.reason.message.includes('conflict') ||
          r.reason.message.includes('overlap') ||
          r.reason.message.includes('being processed'))
    );

    expect(hasConflictError).toBe(true);
  });
});
