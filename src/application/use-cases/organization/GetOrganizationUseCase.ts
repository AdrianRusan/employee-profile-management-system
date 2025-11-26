import { IOrganizationRepository } from '../../../domain/repositories/IOrganizationRepository';
import { OrganizationDTO, toOrganizationDTO } from '../../dtos/OrganizationDTO';

export interface GetOrganizationInput {
  organizationId: string;
}

/**
 * Use case for retrieving an organization's details
 */
export class GetOrganizationUseCase {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async execute(input: GetOrganizationInput): Promise<OrganizationDTO | null> {
    const organization = await this.organizationRepository.findById(input.organizationId);

    if (!organization) {
      return null;
    }

    return toOrganizationDTO(organization);
  }
}
