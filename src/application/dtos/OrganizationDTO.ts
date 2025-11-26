import { Organization, OrganizationSettings } from '../../domain/entities/Organization';

/**
 * Data Transfer Object for Organization
 * Used for communication between layers
 */
export interface OrganizationDTO {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  domain?: string;
  settings: OrganizationSettings;
  departments: string[];
  timezone?: string;
  description?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

/**
 * Convert Organization entity to DTO
 */
export function toOrganizationDTO(organization: Organization): OrganizationDTO {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    logo: organization.logo,
    domain: organization.domain,
    settings: organization.settings,
    departments: organization.departments,
    timezone: organization.timezone,
    description: organization.description,
    onboardingCompleted: organization.isOnboardingCompleted(),
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString(),
    deletedAt: organization.deletedAt?.toISOString(),
  };
}

/**
 * Summary DTO for organization lists
 */
export interface OrganizationSummaryDTO {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  onboardingCompleted: boolean;
}

/**
 * Convert Organization entity to summary DTO
 */
export function toOrganizationSummaryDTO(organization: Organization): OrganizationSummaryDTO {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    logo: organization.logo,
    onboardingCompleted: organization.isOnboardingCompleted(),
  };
}
