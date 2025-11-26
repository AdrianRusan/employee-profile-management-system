/**
 * Organization Settings interface
 * Represents configurable options for an organization
 */
export interface OrganizationSettings {
  onboardingCompleted?: boolean;
  timezone?: string;
  description?: string;
  departments?: string[];
  defaultRole?: string;
  allowInvitations?: boolean;
  [key: string]: unknown;
}

export interface OrganizationProps {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  domain?: string;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Organization Aggregate Root
 * Contains all business logic related to organizations (multi-tenancy)
 */
export class Organization {
  private props: OrganizationProps;

  private constructor(props: OrganizationProps) {
    this.props = props;
    this.validate();
  }

  /**
   * Factory method to create a new Organization entity
   */
  static create(props: Omit<OrganizationProps, 'createdAt' | 'updatedAt' | 'settings'> & { settings?: OrganizationSettings }): Organization {
    return new Organization({
      ...props,
      settings: props.settings ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: OrganizationProps): Organization {
    return new Organization(props);
  }

  private validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error('Organization name cannot be empty');
    }

    if (!this.props.slug || this.props.slug.trim().length === 0) {
      throw new Error('Organization slug cannot be empty');
    }

    // Slug should be URL-safe
    if (!/^[a-z0-9-]+$/.test(this.props.slug)) {
      throw new Error('Organization slug must contain only lowercase letters, numbers, and hyphens');
    }
  }

  /**
   * Business logic: Check if onboarding is completed
   */
  isOnboardingCompleted(): boolean {
    return this.props.settings.onboardingCompleted === true;
  }

  /**
   * Business logic: Complete onboarding process
   */
  completeOnboarding(): void {
    if (this.isOnboardingCompleted()) {
      throw new Error('Onboarding is already completed');
    }
    this.props.settings = {
      ...this.props.settings,
      onboardingCompleted: true,
    };
    this.props.updatedAt = new Date();
  }

  /**
   * Business logic: Update organization settings
   */
  updateSettings(updates: Partial<OrganizationSettings>): void {
    this.props.settings = {
      ...this.props.settings,
      ...updates,
    };
    this.props.updatedAt = new Date();
  }

  /**
   * Business logic: Update organization profile
   */
  updateProfile(updates: {
    name?: string;
    logo?: string;
    domain?: string;
  }): void {
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Organization name cannot be empty');
      }
      this.props.name = updates.name;
    }

    if (updates.logo !== undefined) {
      this.props.logo = updates.logo || undefined;
    }

    if (updates.domain !== undefined) {
      this.props.domain = updates.domain || undefined;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Business logic: Add department to organization
   */
  addDepartment(department: string): void {
    if (!department || department.trim().length === 0) {
      throw new Error('Department name cannot be empty');
    }

    const departments = this.props.settings.departments ?? [];
    if (departments.includes(department)) {
      throw new Error('Department already exists');
    }

    this.props.settings = {
      ...this.props.settings,
      departments: [...departments, department],
    };
    this.props.updatedAt = new Date();
  }

  /**
   * Business logic: Remove department from organization
   */
  removeDepartment(department: string): void {
    const departments = this.props.settings.departments ?? [];
    if (!departments.includes(department)) {
      throw new Error('Department does not exist');
    }

    this.props.settings = {
      ...this.props.settings,
      departments: departments.filter(d => d !== department),
    };
    this.props.updatedAt = new Date();
  }

  /**
   * Business logic: Soft delete organization
   */
  softDelete(): void {
    if (this.props.deletedAt) {
      throw new Error('Organization is already deleted');
    }
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Business logic: Restore soft-deleted organization
   */
  restore(): void {
    if (!this.props.deletedAt) {
      throw new Error('Organization is not deleted');
    }
    this.props.deletedAt = undefined;
    this.props.updatedAt = new Date();
  }

  /**
   * Getters
   */
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get logo(): string | undefined {
    return this.props.logo;
  }

  get domain(): string | undefined {
    return this.props.domain;
  }

  get settings(): OrganizationSettings {
    return { ...this.props.settings };
  }

  get departments(): string[] {
    return this.props.settings.departments ?? [];
  }

  get timezone(): string | undefined {
    return this.props.settings.timezone;
  }

  get description(): string | undefined {
    return this.props.settings.description;
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

  isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }

  /**
   * Get all properties (for persistence)
   */
  toObject(): OrganizationProps {
    return { ...this.props };
  }
}
