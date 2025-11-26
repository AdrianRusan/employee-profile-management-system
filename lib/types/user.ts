/**
 * Frontend-only Role type - decoupled from Prisma
 * Must match Prisma enum: EMPLOYEE | MANAGER | COWORKER
 */
export type Role = 'EMPLOYEE' | 'MANAGER' | 'COWORKER';

/**
 * Frontend-only UserStatus type - decoupled from Prisma
 */
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

/**
 * Frontend-only User type definition
 * This decouples frontend from Prisma schema
 */
export interface User {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: Role;
  department: string | null;
  title: string | null;
  position?: string | null;
  bio?: string | null;
  avatar: string | null;
  startDate?: Date | string | null;
  hireDate?: Date | string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  address: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  salary?: number | string | null;
  ssn?: string | null;
  ssnEncrypted?: string | null;
  ssnIv?: string | null;
  dateOfBirth?: Date | string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  performanceRating?: number | null;
  status: UserStatus;
  emailVerified: boolean;
  emailVerifiedAt?: Date | string | null;
  twoFactorEnabled?: boolean;
  lastLoginAt?: Date | string | null;
  passwordHash?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

/**
 * Serialized user type for client components
 * Converts Prisma Decimal types to strings for serialization
 */
export type SerializedUser = Omit<User, 'salary'> & {
  salary: string | null;
};

/**
 * Partial serialized user type (used when sensitive fields are filtered)
 */
export type PartialSerializedUser = Omit<SerializedUser, 'salary' | 'ssn' | 'address' | 'performanceRating'>;
