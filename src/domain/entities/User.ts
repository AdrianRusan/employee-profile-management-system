import { Email } from '../value-objects/Email';
import { EncryptedField } from '../value-objects/EncryptedField';

export enum Role {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  COWORKER = 'COWORKER',
}

export interface UserProps {
  id: string;
  organizationId: string;
  email: Email;
  name: string;
  role: Role;
  department?: string;
  position?: string; // Job position/title
  title?: string;
  bio?: string;
  avatar?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  salary?: number;
  ssn?: EncryptedField<string>;
  dateOfBirth?: Date;
  hireDate?: Date;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  performanceRating?: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Aggregate Root
 * Contains all business logic related to users
 */
export class User {
  private props: UserProps;

  private constructor(props: UserProps) {
    this.props = props;
    this.validate();
  }

  /**
   * Factory method to create a User entity
   */
  static create(props: Omit<UserProps, 'createdAt' | 'updatedAt'>): User {
    return new User({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  private validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error('User name cannot be empty');
    }

    if (this.props.performanceRating !== undefined) {
      if (this.props.performanceRating < 1 || this.props.performanceRating > 5) {
        throw new Error('Performance rating must be between 1 and 5');
      }
    }
  }

  /**
   * Business logic: Can this user view sensitive data of another user?
   */
  canViewSensitiveDataOf(targetUser: User): boolean {
    // Must be in the same organization (critical security check)
    if (this.props.organizationId !== targetUser.props.organizationId) {
      return false;
    }

    // User can view their own sensitive data
    if (this.id === targetUser.id) {
      return true;
    }

    // Managers can view sensitive data of users in their department
    if (this.isManager()) {
      if (!this.props.department || !targetUser.props.department) {
        return false;
      }
      return this.props.department === targetUser.props.department;
    }

    return false;
  }

  /**
   * Business logic: Can this user approve absence requests?
   */
  canApproveAbsences(): boolean {
    return this.isManager();
  }

  /**
   * Business logic: Can this user edit another user's profile?
   */
  canEditProfile(targetUser: User): boolean {
    // Must be in the same organization (critical security check)
    if (this.props.organizationId !== targetUser.props.organizationId) {
      return false;
    }

    // User can edit their own profile
    if (this.id === targetUser.id) {
      return true;
    }

    // Managers can edit profiles in their department
    if (this.isManager()) {
      if (!this.props.department || !targetUser.props.department) {
        return false;
      }
      return this.props.department === targetUser.props.department;
    }

    return false;
  }

  /**
   * Business logic: Can this user delete another user?
   */
  canDeleteUser(targetUser: User): boolean {
    // Must be in the same organization (critical security check)
    if (this.props.organizationId !== targetUser.props.organizationId) {
      return false;
    }

    // Cannot delete yourself
    if (this.id === targetUser.id) {
      return false;
    }

    // Managers can delete users in their department
    if (this.isManager()) {
      if (!this.props.department || !targetUser.props.department) {
        return false;
      }
      return this.props.department === targetUser.props.department;
    }

    return false;
  }

  /**
   * Business logic: Soft delete user
   */
  softDelete(): void {
    if (this.props.deletedAt) {
      throw new Error('User is already deleted');
    }
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Business logic: Restore soft-deleted user
   */
  restore(): void {
    if (!this.props.deletedAt) {
      throw new Error('User is not deleted');
    }
    this.props.deletedAt = undefined;
    this.props.updatedAt = new Date();
  }

  /**
   * Business logic: Update profile fields
   */
  updateProfile(updates: {
    name?: string;
    department?: string;
    position?: string;
    title?: string;
    bio?: string;
    avatar?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  }): void {
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Name cannot be empty');
      }
      this.props.name = updates.name;
    }

    if (updates.department !== undefined) this.props.department = updates.department;
    if (updates.position !== undefined) this.props.position = updates.position;
    if (updates.title !== undefined) this.props.title = updates.title;
    if (updates.bio !== undefined) this.props.bio = updates.bio;
    if (updates.avatar !== undefined) this.props.avatar = updates.avatar;
    if (updates.phoneNumber !== undefined) this.props.phoneNumber = updates.phoneNumber;
    if (updates.address !== undefined) this.props.address = updates.address;
    if (updates.city !== undefined) this.props.city = updates.city;
    if (updates.state !== undefined) this.props.state = updates.state;
    if (updates.zipCode !== undefined) this.props.zipCode = updates.zipCode;
    if (updates.country !== undefined) this.props.country = updates.country;

    this.props.updatedAt = new Date();
  }

  /**
   * Business logic: Update sensitive fields (only by authorized users)
   */
  updateSensitiveFields(updates: {
    salary?: number;
    ssn?: EncryptedField<string>;
    performanceRating?: number;
  }): void {
    if (updates.salary !== undefined) {
      if (updates.salary < 0) {
        throw new Error('Salary cannot be negative');
      }
      this.props.salary = updates.salary;
    }

    if (updates.ssn !== undefined) {
      this.props.ssn = updates.ssn;
    }

    if (updates.performanceRating !== undefined) {
      if (updates.performanceRating < 1 || updates.performanceRating > 5) {
        throw new Error('Performance rating must be between 1 and 5');
      }
      this.props.performanceRating = updates.performanceRating;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Role checks
   */
  isManager(): boolean {
    return this.props.role === Role.MANAGER;
  }

  isEmployee(): boolean {
    return this.props.role === Role.EMPLOYEE;
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }

  /**
   * Getters
   */
  get id(): string {
    return this.props.id;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get email(): Email {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  get role(): Role {
    return this.props.role;
  }

  get department(): string | undefined {
    return this.props.department;
  }

  get position(): string | undefined {
    return this.props.position;
  }

  get title(): string | undefined {
    return this.props.title;
  }

  get bio(): string | undefined {
    return this.props.bio;
  }

  get avatar(): string | undefined {
    return this.props.avatar;
  }

  get phoneNumber(): string | undefined {
    return this.props.phoneNumber;
  }

  get address(): string | undefined {
    return this.props.address;
  }

  get city(): string | undefined {
    return this.props.city;
  }

  get state(): string | undefined {
    return this.props.state;
  }

  get zipCode(): string | undefined {
    return this.props.zipCode;
  }

  get country(): string | undefined {
    return this.props.country;
  }

  get salary(): number | undefined {
    return this.props.salary;
  }

  get ssn(): EncryptedField<string> | undefined {
    return this.props.ssn;
  }

  get dateOfBirth(): Date | undefined {
    return this.props.dateOfBirth;
  }

  get hireDate(): Date | undefined {
    return this.props.hireDate;
  }

  get performanceRating(): number | undefined {
    return this.props.performanceRating;
  }

  get emergencyContactName(): string | undefined {
    return this.props.emergencyContactName;
  }

  get emergencyContactPhone(): string | undefined {
    return this.props.emergencyContactPhone;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Get all properties (for persistence)
   */
  toObject(): UserProps {
    return { ...this.props };
  }
}
