import { AbsenceRequest as PrismaAbsence, AbsenceStatus as PrismaStatus } from '@prisma/client';
import { Absence, AbsenceStatus } from '../../../../domain/entities/Absence';
import { DateRange } from '../../../../domain/value-objects/DateRange';

/**
 * AbsenceMapper
 * Converts between Prisma models and domain entities
 */
export class AbsenceMapper {
  /**
   * Convert Prisma model to domain entity
   */
  static toDomain(prismaAbsence: PrismaAbsence): Absence {
    return Absence.reconstitute({
      id: prismaAbsence.id,
      userId: prismaAbsence.userId,
      dateRange: DateRange.create(prismaAbsence.startDate, prismaAbsence.endDate),
      reason: prismaAbsence.reason,
      status: this.mapStatus(prismaAbsence.status),
      deletedAt: prismaAbsence.deletedAt ?? undefined,
      createdAt: prismaAbsence.createdAt,
      updatedAt: prismaAbsence.updatedAt,
    });
  }

  /**
   * Convert domain entity to Prisma model data
   */
  static toPrisma(absence: Absence): Omit<PrismaAbsence, 'createdAt' | 'updatedAt'> {
    return {
      id: absence.id,
      userId: absence.userId,
      startDate: absence.dateRange.start,
      endDate: absence.dateRange.end,
      reason: absence.reason,
      status: this.mapToPrismaStatus(absence.status),
      deletedAt: absence.deletedAt ?? null,
    };
  }

  /**
   * Map Prisma status to domain status
   */
  private static mapStatus(prismaStatus: PrismaStatus): AbsenceStatus {
    switch (prismaStatus) {
      case 'PENDING':
        return AbsenceStatus.PENDING;
      case 'APPROVED':
        return AbsenceStatus.APPROVED;
      case 'REJECTED':
        return AbsenceStatus.REJECTED;
      default:
        throw new Error(`Unknown status: ${prismaStatus}`);
    }
  }

  /**
   * Map domain status to Prisma status
   */
  private static mapToPrismaStatus(status: AbsenceStatus): PrismaStatus {
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
