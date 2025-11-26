import { Organization } from '../entities/Organization';

/**
 * Organization Repository Interface
 * Defines contract for organization persistence without implementation details
 */
export interface IOrganizationRepository {
  /**
   * Find organization by ID
   */
  findById(id: string): Promise<Organization | null>;

  /**
   * Find organization by slug
   */
  findBySlug(slug: string): Promise<Organization | null>;

  /**
   * Find organization by domain
   */
  findByDomain(domain: string): Promise<Organization | null>;

  /**
   * Find all organizations with optional filtering
   */
  findAll(options?: {
    includeDeleted?: boolean;
    skip?: number;
    take?: number;
  }): Promise<{ organizations: Organization[]; total: number }>;

  /**
   * Save organization (create or update)
   */
  save(organization: Organization): Promise<Organization>;

  /**
   * Delete organization permanently
   */
  delete(id: string): Promise<void>;

  /**
   * Check if slug exists
   */
  slugExists(slug: string, excludeOrgId?: string): Promise<boolean>;

  /**
   * Check if domain exists
   */
  domainExists(domain: string, excludeOrgId?: string): Promise<boolean>;
}
