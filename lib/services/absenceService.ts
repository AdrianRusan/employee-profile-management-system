import { PrismaClient, Prisma, AbsenceStatus } from '@prisma/client';
import type { Logger } from 'pino';
import { USER_ABSENCE_SELECT, USER_CARD_SELECT } from '@/lib/prisma/selects';
import { AppErrors, findOrThrow } from '@/lib/errors';
import { Permissions, type PermissionUser } from '@/lib/permissions';
import type { PaginationInput } from '@/lib/pagination';
import { getCurrentTenant } from '@/lib/tenant-context';

/**
 * Input types for absence service methods
 */
export interface CreateAbsenceInput {
  startDate: Date;
  endDate: Date;
  reason: string;
}

export interface AbsenceListInput extends PaginationInput {
  status?: AbsenceStatus;
}

export interface UpdateAbsenceStatusInput {
  absenceId: string;
  status: AbsenceStatus;
}

/**
 * Result types for absence checking
 */
export interface OverlapCheckResult {
  hasOverlap: boolean;
  overlappingAbsence?: {
    id: string;
    startDate: Date;
    endDate: Date;
    status: AbsenceStatus;
  };
}

/**
 * Absence Service
 * Handles all business logic for absence request management
 */
export class AbsenceService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger?: Logger
  ) {}

  /**
   * Check for overlapping absence requests for a user
   * @param userId - User ID to check
   * @param startDate - Start date of new absence
   * @param endDate - End date of new absence
   * @param excludeId - Optional absence ID to exclude from check (for updates)
   * @returns Overlap check result with details
   */
  async checkOverlapConflict(
    userId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string
  ): Promise<OverlapCheckResult> {
    // Check for overlapping absence requests (only PENDING and APPROVED)
    const whereClause: Prisma.AbsenceRequestWhereInput = {
      userId,
      status: { in: ['PENDING', 'APPROVED'] },
      deletedAt: null,
      OR: [
        {
          // Scenario 1: New request starts during existing absence
          startDate: { lte: startDate },
          endDate: { gte: startDate },
        },
        {
          // Scenario 2: New request ends during existing absence
          startDate: { lte: endDate },
          endDate: { gte: endDate },
        },
        {
          // Scenario 3: New request completely contains existing absence
          startDate: { gte: startDate },
          endDate: { lte: endDate },
        },
        {
          // Scenario 4: Existing absence completely contains new request
          startDate: { lte: startDate },
          endDate: { gte: endDate },
        },
      ],
    };

    // Exclude specific ID if provided (for updates)
    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const overlap = await this.prisma.absenceRequest.findFirst({
      where: whereClause,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    if (overlap) {
      this.logger?.warn({
        existingStart: overlap.startDate.toISOString(),
        existingEnd: overlap.endDate.toISOString(),
        requestedStart: startDate.toISOString(),
        requestedEnd: endDate.toISOString(),
      }, 'Overlapping absence request detected');

      return {
        hasOverlap: true,
        overlappingAbsence: overlap,
      };
    }

    return { hasOverlap: false };
  }

  /**
   * Calculate working days between two dates (excluding weekends)
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Number of working days
   */
  calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Process absence request creation with overlap checking
   * Uses serializable transaction to prevent race conditions
   * @param session - Current user session
   * @param input - Absence request data
   * @returns Created absence request
   */
  async processAbsenceRequest(session: PermissionUser, input: CreateAbsenceInput) {
    const { startDate, endDate, reason } = input;

    this.logger?.info({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      reason,
    }, 'Creating absence request');

    try {
      // Wrap overlap check and create in a serializable transaction
      return await this.prisma.$transaction(
        async (tx) => {
          // Check for overlapping absence requests
          const overlapCheck = await this.checkOverlapConflict(
            session.id,
            startDate,
            endDate
          );

          if (overlapCheck.hasOverlap && overlapCheck.overlappingAbsence) {
            throw AppErrors.conflict(
              `You already have an absence request from ${overlapCheck.overlappingAbsence.startDate.toLocaleDateString()} to ${overlapCheck.overlappingAbsence.endDate.toLocaleDateString()}`
            );
          }

          // Get organization context
          const tenant = getCurrentTenant();

          // Create absence request within same transaction
          const absenceRequest = await tx.absenceRequest.create({
            data: {
              startDate,
              endDate,
              reason,
              userId: session.id,
              organizationId: tenant.organizationId,
            },
            include: {
              user: {
                select: USER_ABSENCE_SELECT,
              },
            },
          });

          this.logger?.info({
            absenceId: absenceRequest.id,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }, 'Absence request created successfully');

          return absenceRequest;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        }
      );
    } catch (error) {
      // Handle database serialization failures gracefully
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2034') {
          this.logger?.warn({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }, 'Concurrent absence request conflict detected');

          throw AppErrors.conflict(
            'Another absence request is being processed. Please try again in a moment.'
          );
        }
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get absence requests for a specific user
   * @param session - Current user session
   * @param userId - User ID to fetch absences for
   * @returns List of absence requests
   */
  async getAbsencesForUser(session: PermissionUser, userId: string) {
    // Check permissions
    if (!Permissions.absence.viewForUser(session, userId)) {
      throw AppErrors.forbidden('You do not have permission to view these absence requests');
    }

    // Verify user exists and is not deleted
    await findOrThrow(
      this.prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null
        },
      }),
      'User',
      userId
    );

    // Fetch absence requests
    return this.prisma.absenceRequest.findMany({
      where: {
        userId,
        deletedAt: null
      },
      include: {
        user: {
          select: USER_ABSENCE_SELECT,
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  /**
   * Get current user's absence requests
   * @param session - Current user session
   * @returns List of absence requests
   */
  async getMyAbsences(session: PermissionUser) {
    return this.prisma.absenceRequest.findMany({
      where: {
        userId: session.id,
        deletedAt: null
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  /**
   * Get paginated list of all absence requests (manager only)
   * @param session - Current user session
   * @param input - Pagination and filter parameters
   * @returns Paginated absence requests
   */
  async getAllAbsences(session: PermissionUser, input: AbsenceListInput) {
    // Only managers can view all absence requests
    if (!Permissions.absence.viewAll(session)) {
      throw AppErrors.forbidden('Only managers can view all absence requests');
    }

    const { limit, cursor, status } = input;

    // Fetch absence requests with cursor pagination
    const absenceRequests = await this.prisma.absenceRequest.findMany({
      where: status ? { status, deletedAt: null } : { deletedAt: null },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        user: {
          select: USER_ABSENCE_SELECT,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Determine if there are more results
    let nextCursor: string | undefined = undefined;
    if (absenceRequests.length > limit) {
      const nextItem = absenceRequests.pop();
      nextCursor = nextItem!.id;
    }

    return {
      absenceRequests,
      nextCursor,
    };
  }

  /**
   * Update absence request status (approve/reject)
   * @param session - Current user session
   * @param absenceId - Absence request ID
   * @param status - New status
   * @returns Updated absence request
   */
  async updateAbsenceStatus(
    session: PermissionUser,
    absenceId: string,
    status: AbsenceStatus
  ) {
    this.logger?.info({
      absenceId,
      newStatus: status,
    }, 'Updating absence request status');

    // Only managers can approve/reject absence requests
    if (!Permissions.absence.approve(session)) {
      throw AppErrors.forbidden('Only managers can approve or reject absence requests');
    }

    // Find the absence request
    const absenceRequest = await findOrThrow(
      this.prisma.absenceRequest.findUnique({
        where: { id: absenceId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      'Absence request',
      absenceId
    );

    // Update status
    const updated = await this.prisma.absenceRequest.update({
      where: { id: absenceId },
      data: { status },
      include: {
        user: {
          select: USER_ABSENCE_SELECT,
        },
      },
    });

    this.logger?.info({
      absenceId,
      oldStatus: absenceRequest.status,
      newStatus: status,
      targetUserId: absenceRequest.userId,
    }, 'Absence request status updated successfully');

    return updated;
  }

  /**
   * Bulk approve multiple absence requests (manager only)
   * @param session - Current user session
   * @param absenceIds - Array of absence request IDs to approve
   * @returns Count of updated requests
   */
  async bulkApproveAbsences(session: PermissionUser, absenceIds: string[]) {
    this.logger?.info({
      count: absenceIds.length,
      absenceIds,
    }, 'Bulk approving absence requests');

    // Only managers can approve absence requests
    if (!Permissions.absence.approve(session)) {
      throw AppErrors.forbidden('Only managers can approve absence requests');
    }

    // Update all specified absences to APPROVED
    const result = await this.prisma.absenceRequest.updateMany({
      where: {
        id: { in: absenceIds },
        status: 'PENDING', // Only approve pending requests
      },
      data: {
        status: 'APPROVED',
      },
    });

    this.logger?.info({
      count: result.count,
      absenceIds,
    }, 'Bulk approval completed');

    return {
      count: result.count,
      message: `Successfully approved ${result.count} absence request(s)`,
    };
  }

  /**
   * Delete absence request
   * @param session - Current user session
   * @param absenceId - Absence request ID
   * @returns Success message
   */
  async deleteAbsence(session: PermissionUser, absenceId: string) {
    this.logger?.info({ absenceId }, 'Deleting absence request');

    // Find the absence request
    const absenceRequest = await findOrThrow(
      this.prisma.absenceRequest.findUnique({
        where: { id: absenceId },
      }),
      'Absence request',
      absenceId
    );

    // Check permissions
    if (!Permissions.absence.delete(session, absenceRequest)) {
      throw AppErrors.forbidden('You do not have permission to delete this absence request');
    }

    // Delete the absence request
    await this.prisma.absenceRequest.delete({
      where: { id: absenceId },
    });

    this.logger?.info({
      absenceId,
      targetUserId: absenceRequest.userId,
      status: absenceRequest.status,
    }, 'Absence request deleted successfully');

    return { success: true };
  }

  /**
   * Get absence statistics for a user
   * @param userId - User ID
   * @returns Absence statistics
   */
  async getAbsenceStats(userId: string) {
    const total = await this.prisma.absenceRequest.count({
      where: {
        userId,
        deletedAt: null
      },
    });

    const pending = await this.prisma.absenceRequest.count({
      where: {
        userId,
        status: 'PENDING',
        deletedAt: null
      },
    });

    const approved = await this.prisma.absenceRequest.count({
      where: {
        userId,
        status: 'APPROVED',
        deletedAt: null
      },
    });

    const rejected = await this.prisma.absenceRequest.count({
      where: {
        userId,
        status: 'REJECTED',
        deletedAt: null
      },
    });

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }

  /**
   * Get upcoming approved absences (for calendar view)
   * @returns List of upcoming absences
   */
  async getUpcomingAbsences() {
    const now = new Date();

    return this.prisma.absenceRequest.findMany({
      where: {
        status: 'APPROVED',
        endDate: { gte: now },
      },
      include: {
        user: {
          select: USER_CARD_SELECT,
        },
      },
      orderBy: {
        startDate: 'asc',
      },
      take: 50,
    });
  }
}
