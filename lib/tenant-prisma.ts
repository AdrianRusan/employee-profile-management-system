import { Prisma, PrismaClient } from '@prisma/client';
import { getCurrentTenant, getTenantOrNull } from './tenant-context';

/**
 * Models that require tenant isolation
 */
const TENANT_MODELS = [
  'user',
  'feedback',
  'absenceRequest',
  'notification',
  'invitation',
] as const;

type TenantModel = (typeof TENANT_MODELS)[number];

/**
 * Check if a model requires tenant filtering
 */
function isTenantModel(model: string): model is TenantModel {
  return TENANT_MODELS.includes(model.toLowerCase() as TenantModel);
}

/**
 * Create a Prisma client with automatic tenant filtering
 * This ensures all queries are scoped to the current organization
 */
export function createTenantPrismaClient(basePrisma: PrismaClient) {
  return basePrisma.$extends({
    name: 'tenant-isolation',
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (isTenantModel(model)) {
            const tenant = getTenantOrNull();
            if (tenant) {
              args.where = {
                ...args.where,
                organizationId: tenant.organizationId,
              };
            }
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (isTenantModel(model)) {
            const tenant = getTenantOrNull();
            if (tenant) {
              args.where = {
                ...args.where,
                organizationId: tenant.organizationId,
              };
            }
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          // For findUnique, we need to validate after fetching
          const result = await query(args);
          if (result && isTenantModel(model)) {
            const tenant = getTenantOrNull();
            if (tenant && (result as any).organizationId !== tenant.organizationId) {
              return null; // Return null if org doesn't match
            }
          }
          return result;
        },
        async create({ model, args, query }) {
          if (isTenantModel(model)) {
            const tenant = getCurrentTenant(); // Throws if no tenant
            args.data = {
              ...(args.data as object),
              organizationId: tenant.organizationId,
            } as any;
          }
          return query(args);
        },
        async createMany({ model, args, query }) {
          if (isTenantModel(model)) {
            const tenant = getCurrentTenant();
            if (Array.isArray(args.data)) {
              args.data = args.data.map((item) => ({
                ...(item as object),
                organizationId: tenant.organizationId,
              })) as any;
            } else {
              args.data = {
                ...(args.data as object),
                organizationId: tenant.organizationId,
              } as any;
            }
          }
          return query(args);
        },
        async update({ model, args, query }) {
          if (isTenantModel(model)) {
            const tenant = getTenantOrNull();
            if (tenant) {
              args.where = {
                ...args.where,
                organizationId: tenant.organizationId,
              };
            }
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (isTenantModel(model)) {
            const tenant = getTenantOrNull();
            if (tenant) {
              args.where = {
                ...args.where,
                organizationId: tenant.organizationId,
              };
            }
          }
          return query(args);
        },
        async delete({ model, args, query }) {
          if (isTenantModel(model)) {
            const tenant = getTenantOrNull();
            if (tenant) {
              args.where = {
                ...args.where,
                organizationId: tenant.organizationId,
              };
            }
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (isTenantModel(model)) {
            const tenant = getTenantOrNull();
            if (tenant) {
              args.where = {
                ...args.where,
                organizationId: tenant.organizationId,
              };
            }
          }
          return query(args);
        },
        async count({ model, args, query }) {
          if (isTenantModel(model)) {
            const tenant = getTenantOrNull();
            if (tenant) {
              args.where = {
                ...args.where,
                organizationId: tenant.organizationId,
              };
            }
          }
          return query(args);
        },
        async aggregate({ model, args, query }) {
          if (isTenantModel(model)) {
            const tenant = getTenantOrNull();
            if (tenant) {
              args.where = {
                ...args.where,
                organizationId: tenant.organizationId,
              };
            }
          }
          return query(args);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof createTenantPrismaClient>;
