import { IOrganizationRepository } from '../../../domain/repositories/IOrganizationRepository';
import { OrganizationSettings } from '../../../domain/entities/Organization';

export interface GetOrganizationSettingsInput {
  organizationId: string;
}

export interface OrganizationSettingsOutput {
  settings: OrganizationSettings;
  onboardingCompleted: boolean;
  departments: string[];
  timezone?: string;
  description?: string;
}

/**
 * Use case for retrieving organization settings
 */
export class GetOrganizationSettingsUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(input: GetOrganizationSettingsInput): Promise<OrganizationSettingsOutput | null> {
    const organization = await this.organizationRepository.findById(input.organizationId);

    if (!organization) {
      return null;
    }

    return {
      settings: organization.settings,
      onboardingCompleted: organization.isOnboardingCompleted(),
      departments: organization.departments,
      timezone: organization.timezone,
      description: organization.description,
    };
  }
}
