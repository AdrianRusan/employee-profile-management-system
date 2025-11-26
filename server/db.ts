import { PrismaClient } from '@prisma/client';
import { createTenantPrismaClient, type TenantPrismaClient } from '@/lib/tenant-prisma';

declare global {
  var prisma: PrismaClient | undefined;
  var tenantPrisma: TenantPrismaClient | undefined;
}

// Base Prisma client - use for operations that don't require tenant isolation
// (e.g., authentication, organization lookup, system-level operations)
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Tenant-aware Prisma client - automatically filters by organizationId
// Use this for all tenant-scoped operations (users, feedback, absences, etc.)
export const tenantPrisma = global.tenantPrisma || createTenantPrismaClient(prisma);

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
  global.tenantPrisma = tenantPrisma;
}

// Add graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
