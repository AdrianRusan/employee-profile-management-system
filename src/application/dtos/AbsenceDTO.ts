import { AbsenceStatus } from '../../domain/entities/Absence';

/**
 * Input DTO for creating absence
 */
export interface CreateAbsenceDTO {
  userId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}

/**
 * Input DTO for updating absence status
 */
export interface UpdateAbsenceStatusDTO {
  absenceId: string;
  status: AbsenceStatus;
  approverId: string;
}

/**
 * Output DTO for absence data
 */
export interface AbsenceDTO {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: AbsenceStatus;
  workingDays: number;
  totalDays: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    department: string | null;
    avatar: string | null;
  };
}

/**
 * Output DTO for absence with user information
 */
export interface AbsenceWithUserDTO extends AbsenceDTO {
  user: {
    id: string;
    name: string;
    email: string;
    department: string | null;
    avatar: string | null;
  };
}

/**
 * Output DTO for absence statistics
 */
export interface AbsenceStatisticsDTO {
  totalDays: number;
  approvedDays: number;
  pendingRequests: number;
  rejectedRequests: number;
  totalRequests: number;
}
