import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { ProfilePageClient } from './ProfilePageClient';
import { Skeleton } from '@/components/ui/skeleton';
import { prisma } from '@/server/db';

/**
 * Helper function to serialize user data for client components
 * Converts Prisma Decimal types to strings to avoid serialization errors
 */
function serializeUserForClient<T extends { salary?: Prisma.Decimal | null }>(
  user: T
): Omit<T, 'salary'> & { salary: string | null } {
  return {
    ...user,
    salary: user.salary?.toString() ?? null,
  };
}

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server Component - Profile Detail Page
 * Fetches initial user data server-side for optimal performance
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    notFound();
  }

  // Serialize user data to convert Decimal to string for client component
  const serializedUser = serializeUserForClient(user);

  return (
    <div className="container max-w-4xl py-8">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfilePageClient user={serializedUser} />
      </Suspense>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
