import { Organization as PrismaOrganization, Prisma } from '@prisma/client';
import { Organization, OrganizationSettings } from '../../../../domain/entities/Organization';

/**
 * OrganizationMapper
 * Converts between Prisma models and domain entities
 */
export class OrganizationMapper {
  /**
   * Convert Prisma model to domain entity
   */
  static toDomain(prismaOrg: PrismaOrganization): Organization {
    // Parse settings from JSON field
    let settings: OrganizationSettings = {};
    if (prismaOrg.settings) {
      if (typeof prismaOrg.settings === 'object') {
        settings = prismaOrg.settings as OrganizationSettings;
      } else if (typeof prismaOrg.settings === 'string') {
        try {
          settings = JSON.parse(prismaOrg.settings) as OrganizationSettings;
        } catch {
          settings = {};
        }
      }
    }

    return Organization.reconstitute({
      id: prismaOrg.id,
      name: prismaOrg.name,
      slug: prismaOrg.slug,
      logo: prismaOrg.logo ?? undefined,
      domain: prismaOrg.domain ?? undefined,
      settings,
      createdAt: prismaOrg.createdAt,
      updatedAt: prismaOrg.updatedAt,
      deletedAt: prismaOrg.deletedAt ?? undefined,
    });
  }

  /**
   * Convert domain entity to Prisma create data
   */
  static toPrismaCreate(org: Organization): Prisma.OrganizationCreateInput {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo ?? null,
      domain: org.domain ?? null,
      settings: org.settings as Prisma.JsonObject,
    };
  }

  /**
   * Convert domain entity to Prisma update data
   */
  static toPrismaUpdate(org: Organization): Prisma.OrganizationUpdateInput {
    return {
      name: org.name,
      slug: org.slug,
      logo: org.logo ?? null,
      domain: org.domain ?? null,
      settings: org.settings as Prisma.JsonObject,
      deletedAt: org.deletedAt ?? null,
    };
  }
}
