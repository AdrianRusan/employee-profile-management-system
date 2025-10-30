import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { ProfilePageClient } from './ProfilePageClient';
import { Skeleton } from '@/components/ui/skeleton';

const prisma = new PrismaClient();

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

  return (
    <div className="container max-w-4xl py-8">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfilePageClient user={user} />
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
