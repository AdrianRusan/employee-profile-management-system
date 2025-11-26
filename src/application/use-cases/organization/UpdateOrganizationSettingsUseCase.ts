import { IOrganizationRepository } from '../../../domain/repositories/IOrganizationRepository';
import { OrganizationSettings } from '../../../domain/entities/Organization';
import { OrganizationDTO, toOrganizationDTO } from '../../dtos/OrganizationDTO';

export interface UpdateOrganizationSettingsInput {
  organizationId: string;
  settings: Partial<OrganizationSettings>;
}

/**
 * Use case for updating organization settings
 */
export class UpdateOrganizationSettingsUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(input: UpdateOrganizationSettingsInput): Promise<OrganizationDTO> {
    const organization = await this.organizationRepository.findById(input.organizationId);

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Apply settings updates via domain logic
    organization.updateSettings(input.settings);

    // Persist the updated organization
    const saved = await this.organizationRepository.save(organization);

    return toOrganizationDTO(saved);
  }
}
