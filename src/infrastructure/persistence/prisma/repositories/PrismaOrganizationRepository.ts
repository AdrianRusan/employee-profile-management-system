import { PrismaClient } from '@prisma/client';
import { IOrganizationRepository } from '../../../../domain/repositories/IOrganizationRepository';
import { Organization } from '../../../../domain/entities/Organization';
import { OrganizationMapper } from '../mappers/OrganizationMapper';

/**
 * Prisma implementation of IOrganizationRepository
 * Handles persistence of Organization aggregates using Prisma ORM
 */
export class PrismaOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find an organization by ID
   */
  async findById(id: string): Promise<Organization | null> {
    const prismaOrg = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!prismaOrg) return null;

    return OrganizationMapper.toDomain(prismaOrg);
  }

  /**
   * Find an organization by slug
   */
  async findBySlug(slug: string): Promise<Organization | null> {
    const prismaOrg = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (!prismaOrg) return null;

    return OrganizationMapper.toDomain(prismaOrg);
  }

  /**
   * Find an organization by domain
   */
  async findByDomain(domain: string): Promise<Organization | null> {
    const prismaOrg = await this.prisma.organization.findFirst({
      where: { domain },
    });

    if (!prismaOrg) return null;

    return OrganizationMapper.toDomain(prismaOrg);
  }

  /**
   * Find all organizations with optional filtering and pagination
   */
  async findAll(options?: {
    includeDeleted?: boolean;
    skip?: number;
    take?: number;
  }): Promise<{ organizations: Organization[]; total: number }> {
    const { includeDeleted = false, skip = 0, take = 50 } = options ?? {};

    const where = includeDeleted ? {} : { deletedAt: null };

    const [prismaOrgs, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      organizations: prismaOrgs.map(OrganizationMapper.toDomain),
      total,
    };
  }

  /**
   * Save organization (create or update)
   */
  async save(organization: Organization): Promise<Organization> {
    const existing = await this.prisma.organization.findUnique({
      where: { id: organization.id },
    });

    if (existing) {
      // Update existing organization
      const updated = await this.prisma.organization.update({
        where: { id: organization.id },
        data: OrganizationMapper.toPrismaUpdate(organization),
      });
      return OrganizationMapper.toDomain(updated);
    } else {
      // Create new organization
      const created = await this.prisma.organization.create({
        data: OrganizationMapper.toPrismaCreate(organization),
      });
      return OrganizationMapper.toDomain(created);
    }
  }

  /**
   * Delete organization permanently
   */
  async delete(id: string): Promise<void> {
    await this.prisma.organization.delete({
      where: { id },
    });
  }

  /**
   * Check if slug exists
   */
  async slugExists(slug: string, excludeOrgId?: string): Promise<boolean> {
    const count = await this.prisma.organization.count({
      where: {
        slug,
        ...(excludeOrgId && { id: { not: excludeOrgId } }),
      },
    });
    return count > 0;
  }

  /**
   * Check if domain exists
   */
  async domainExists(domain: string, excludeOrgId?: string): Promise<boolean> {
    const count = await this.prisma.organization.count({
      where: {
        domain,
        ...(excludeOrgId && { id: { not: excludeOrgId } }),
      },
    });
    return count > 0;
  }
}
