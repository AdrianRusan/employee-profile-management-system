import { PrismaClient } from '@prisma/client';
import { IAbsenceRepository } from '../../../../domain/repositories/IAbsenceRepository';
import { Absence, AbsenceStatus } from '../../../../domain/entities/Absence';
import { DateRange } from '../../../../domain/value-objects/DateRange';
import { AbsenceMapper } from '../mappers/AbsenceMapper';
import { getCurrentTenant, getTenantOrNull } from '@/lib/tenant-context';

/**
 * Prisma implementation of IAbsenceRepository
 * Handles all database operations for absences
 */
export class PrismaAbsenceRepository implements IAbsenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Absence | null> {
    const tenant = getTenantOrNull();
    const prismaAbsence = await this.prisma.absenceRequest.findFirst({
      where: {
        id,
        ...(tenant && { organizationId: tenant.organizationId }),
      },
    });

    return prismaAbsence ? AbsenceMapper.toDomain(prismaAbsence) : null;
  }

  async findByUserId(
    userId: string,
    options?: {
      includeDeleted?: boolean;
      status?: AbsenceStatus;
    }
  ): Promise<Absence[]> {
    const tenant = getTenantOrNull();
    const where: any = { userId };

    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    if (options?.status) {
      where.status = this.mapStatusToPrisma(options.status);
    }

    const prismaAbsences = await this.prisma.absenceRequest.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });

    return prismaAbsences.map((a) => AbsenceMapper.toDomain(a));
  }

  async findAll(options?: {
    status?: AbsenceStatus;
    includeDeleted?: boolean;
    skip?: number;
    take?: number;
    includeUser?: boolean;
    department?: string;
  }): Promise<{ absences: Absence[]; total: number; users?: any[] }> {
    const tenant = getTenantOrNull();
    const where: any = {};

    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    if (options?.status) {
      where.status = this.mapStatusToPrisma(options.status);
    }

    // Filter by department if provided
    if (options?.department) {
      where.user = { department: options.department };
    }

    const include = options?.includeUser
      ? {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              avatar: true,
            },
          },
        }
      : undefined;

    const [prismaAbsences, total] = await Promise.all([
      this.prisma.absenceRequest.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: { startDate: 'desc' },
        include,
      }),
      this.prisma.absenceRequest.count({ where }),
    ]);

    return {
      absences: prismaAbsences.map((a) => AbsenceMapper.toDomain(a)),
      total,
      users: options?.includeUser ? prismaAbsences.map((a: any) => a.user) : undefined,
    };
  }

  async findOverlapping(
    userId: string,
    dateRange: DateRange,
    excludeId?: string
  ): Promise<Absence[]> {
    const tenant = getTenantOrNull();
    const where: any = {
      userId,
      id: excludeId ? { not: excludeId } : undefined,
      deletedAt: null,
      status: { in: ['PENDING', 'APPROVED'] },
      // Find absences that overlap with the given date range
      AND: [
        { startDate: { lte: dateRange.end } },
        { endDate: { gte: dateRange.start } },
      ],
    };

    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

    const prismaAbsences = await this.prisma.absenceRequest.findMany({ where });

    return prismaAbsences.map((a) => AbsenceMapper.toDomain(a));
  }

  async findUpcoming(limit: number = 10): Promise<Absence[]> {
    const tenant = getTenantOrNull();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      status: 'APPROVED',
      deletedAt: null,
      startDate: { gte: today },
    };

    if (tenant) {
      where.organizationId = tenant.organizationId;
    }

    const prismaAbsences = await this.prisma.absenceRequest.findMany({
      where,
      orderBy: { startDate: 'asc' },
      take: limit,
    });

    return prismaAbsences.map((a) => AbsenceMapper.toDomain(a));
  }

  async save(absence: Absence): Promise<Absence> {
    const tenant = getCurrentTenant(); // Throws if no tenant for mutations
    const data = AbsenceMapper.toPrisma(absence);

    // Ensure organizationId matches tenant
    if (data.organizationId !== tenant.organizationId) {
      throw new Error('Absence organizationId must match current tenant');
    }

    const saved = await this.prisma.absenceRequest.upsert({
      where: { id: absence.id },
      create: {
        ...data,
        createdAt: absence.createdAt,
        updatedAt: absence.updatedAt,
      },
      update: {
        ...data,
        updatedAt: absence.updatedAt,
      },
    });

    return AbsenceMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    const tenant = getCurrentTenant(); // Throws if no tenant for mutations
    await this.prisma.absenceRequest.deleteMany({
      where: {
        id,
        organizationId: tenant.organizationId,
      },
    });
  }

  async getStatistics(userId: string): Promise<{
    totalDays: number;
    approvedDays: number;
    pendingRequests: number;
    rejectedRequests: number;
  }> {
    const absences = await this.findByUserId(userId);

    const stats = absences.reduce(
      (acc, absence) => {
        acc.totalDays += absence.getTotalDays();

        if (absence.isApproved()) {
          acc.approvedDays += absence.getTotalDays();
        } else if (absence.isPending()) {
          acc.pendingRequests++;
        } else if (absence.isRejected()) {
          acc.rejectedRequests++;
        }

        return acc;
      },
      {
        totalDays: 0,
        approvedDays: 0,
        pendingRequests: 0,
        rejectedRequests: 0,
      }
    );

    return stats;
  }

  /**
   * Helper method to map domain status to Prisma enum
   */
  private mapStatusToPrisma(status: AbsenceStatus): 'PENDING' | 'APPROVED' | 'REJECTED' {
    switch (status) {
      case AbsenceStatus.PENDING:
        return 'PENDING';
      case AbsenceStatus.APPROVED:
        return 'APPROVED';
      case AbsenceStatus.REJECTED:
        return 'REJECTED';
      default:
        throw new Error(`Unknown status: ${status}`);
    }
  }
}
