import { PrismaClient } from '@prisma/client';

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique organization slug
 */
export async function generateUniqueSlug(
  prisma: PrismaClient,
  name: string
): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  // Keep trying until we find a unique slug
  while (true) {
    const existing = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
