import { IOrganizationRepository } from '../../../domain/repositories/IOrganizationRepository';
import { OrganizationSettings } from '../../../domain/entities/Organization';
import { OrganizationDTO, toOrganizationDTO } from '../../dtos/OrganizationDTO';

export interface CompleteOnboardingInput {
  organizationId: string;
  organizationName?: string;
  timezone?: string;
  description?: string;
  departments?: string[];
}

export interface CompleteOnboardingOutput {
  organization: OrganizationDTO;
}

/**
 * Use case for completing organization onboarding
 * Marks the onboarding as complete and sets initial settings
 */
export class CompleteOnboardingUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(input: CompleteOnboardingInput): Promise<CompleteOnboardingOutput> {
    const organization = await this.organizationRepository.findById(input.organizationId);

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check if already completed (business rule in domain)
    if (organization.isOnboardingCompleted()) {
      // Return current state if already completed (idempotent)
      return { organization: toOrganizationDTO(organization) };
    }

    // Update organization name if provided
    if (input.organizationName) {
      organization.updateProfile({ name: input.organizationName });
    }

    // Build settings update
    const settingsUpdate: Partial<OrganizationSettings> = {};

    if (input.timezone) {
      settingsUpdate.timezone = input.timezone;
    }

    if (input.description) {
      settingsUpdate.description = input.description;
    }

    if (input.departments && input.departments.length > 0) {
      settingsUpdate.departments = input.departments;
    }

    // Apply settings if any
    if (Object.keys(settingsUpdate).length > 0) {
      organization.updateSettings(settingsUpdate);
    }

    // Complete onboarding (domain business logic)
    organization.completeOnboarding();

    // Persist the updated organization
    const saved = await this.organizationRepository.save(organization);

    return { organization: toOrganizationDTO(saved) };
  }
}
