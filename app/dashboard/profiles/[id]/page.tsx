'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { ProfilePageClient } from './ProfilePageClient';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc/Provider';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Profile Detail Page
 * Uses tRPC for data fetching to comply with Clean Architecture
 * The tRPC user.getById endpoint uses proper domain layer with use cases
 */
export default function ProfilePage({ params }: ProfilePageProps) {
  const { id } = use(params);

  return (
    <div className="container max-w-4xl py-8">
      <ProfilePageContent id={id} />
    </div>
  );
}

function ProfilePageContent({ id }: { id: string }) {
  const { data: user, isLoading, error } = trpc.user.getById.useQuery({ id });

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    if (error.data?.code === 'NOT_FOUND') {
      return (
        <div className="rounded-lg border border-border bg-muted/10 p-6 text-center">
          <p className="font-medium">Profile not found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            The requested profile does not exist or you don't have permission to view it.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-red-400">
        <p className="font-medium">Error loading profile</p>
        <p className="mt-2 text-sm opacity-90">{error.message}</p>
      </div>
    );
  }

  if (!user) {
    notFound();
  }

  // Convert salary number to string for serialization (if present)
  // The user object may or may not contain salary depending on includeSensitive flag
  const userWithSalary = user as typeof user & { salary?: number | string | null };
  const serializedUser = {
    ...user,
    salary: userWithSalary.salary != null ? String(userWithSalary.salary) : null,
  };

  return <ProfilePageClient user={serializedUser as any} />;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
