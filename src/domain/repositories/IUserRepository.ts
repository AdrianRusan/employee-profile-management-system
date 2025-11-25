import { User } from '../entities/User';
import { Email } from '../value-objects/Email';

/**
 * User Repository Interface
 * Defines contract for user persistence without implementation details
 */
export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Find all users with optional filtering
   */
  findAll(options?: {
    includeSensitive?: boolean;
    includeDeleted?: boolean;
    department?: string;
    skip?: number;
    take?: number;
  }): Promise<{ users: User[]; total: number }>;

  /**
   * Get unique departments
   */
  getDepartments(): Promise<string[]>;

  /**
   * Save user (create or update)
   */
  save(user: User): Promise<User>;

  /**
   * Delete user permanently
   */
  delete(id: string): Promise<void>;

  /**
   * Check if email exists
   */
  emailExists(email: Email, excludeUserId?: string): Promise<boolean>;
}
