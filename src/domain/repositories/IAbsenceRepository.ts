import { Absence, AbsenceStatus } from '../entities/Absence';
import { DateRange } from '../value-objects/DateRange';

/**
 * Absence Repository Interface
 * Defines contract for absence persistence without implementation details
 */
export interface IAbsenceRepository {
  /**
   * Find absence by ID
   */
  findById(id: string): Promise<Absence | null>;

  /**
   * Find all absences for a user
   */
  findByUserId(
    userId: string,
    options?: {
      includeDeleted?: boolean;
      status?: AbsenceStatus;
    }
  ): Promise<Absence[]>;

  /**
   * Find all absences (with filtering)
   */
  findAll(options?: {
    status?: AbsenceStatus;
    includeDeleted?: boolean;
    skip?: number;
    take?: number;
    includeUser?: boolean;
    department?: string;
  }): Promise<{ absences: Absence[]; total: number; users?: any[] }>;

  /**
   * Find overlapping absences for a user
   */
  findOverlapping(
    userId: string,
    dateRange: DateRange,
    excludeId?: string
  ): Promise<Absence[]>;

  /**
   * Find upcoming absences
   */
  findUpcoming(limit?: number): Promise<Absence[]>;

  /**
   * Save absence (create or update)
   */
  save(absence: Absence): Promise<Absence>;

  /**
   * Delete absence permanently
   */
  delete(id: string): Promise<void>;

  /**
   * Get absence statistics for a user
   */
  getStatistics(userId: string): Promise<{
    totalDays: number;
    approvedDays: number;
    pendingRequests: number;
    rejectedRequests: number;
  }>;
}
