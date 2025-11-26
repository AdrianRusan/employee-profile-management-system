import { AsyncLocalStorage } from 'async_hooks';
import { TRPCError } from '@trpc/server';

export interface TenantContext {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
}

// AsyncLocalStorage for request-scoped tenant context
export const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Get the current tenant context
 * Throws if no tenant context is set (unauthorized access)
 */
export function getCurrentTenant(): TenantContext {
  const tenant = tenantStorage.getStore();
  if (!tenant) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No organization context found. Please log in again.',
    });
  }
  return tenant;
}

/**
 * Get tenant context without throwing (for optional tenant scenarios)
 */
export function getTenantOrNull(): TenantContext | null {
  return tenantStorage.getStore() || null;
}

/**
 * Check if we're currently in a tenant context
 */
export function hasTenantContext(): boolean {
  return tenantStorage.getStore() !== undefined;
}

/**
 * Run a function within a tenant context
 */
export function withTenant<T>(tenant: TenantContext, fn: () => T): T {
  return tenantStorage.run(tenant, fn);
}

/**
 * Run an async function within a tenant context
 */
export async function withTenantAsync<T>(
  tenant: TenantContext,
  fn: () => Promise<T>
): Promise<T> {
  return tenantStorage.run(tenant, fn);
}
