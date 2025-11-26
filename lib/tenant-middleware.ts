import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

/**
 * Extract organization slug from request
 * Supports both subdomain and path-based routing
 */
export function extractOrgSlug(request: NextRequest): string | null {
  // Option 1: Subdomain-based (company.yourapp.com)
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];

  // Skip common subdomains that aren't organization slugs
  const reservedSubdomains = ['www', 'app', 'api', 'admin', 'localhost'];
  if (!reservedSubdomains.includes(subdomain) && subdomain.length > 2) {
    return subdomain;
  }

  // Option 2: Path-based (/org/company-slug/dashboard)
  const pathname = request.nextUrl.pathname;
  const orgMatch = pathname.match(/^\/org\/([^\/]+)/);
  if (orgMatch) {
    return orgMatch[1];
  }

  // Option 3: Header-based (X-Organization-Slug)
  const headerSlug = request.headers.get('x-organization-slug');
  if (headerSlug) {
    return headerSlug;
  }

  return null;
}

/**
 * Resolve organization from slug
 */
export async function resolveOrganization(slug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      settings: true,
    },
  });

  return org;
}

/**
 * Tenant validation - ensures user belongs to the requested organization
 */
export async function validateUserTenant(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      organizationId,
      deletedAt: null,
    },
    select: { id: true },
  });

  return user !== null;
}
