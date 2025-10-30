import { User } from '@prisma/client';

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
