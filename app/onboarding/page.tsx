'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/Provider';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface OrganizationSettings {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  settings: Record<string, unknown> | null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const query = trpc.organization.getSettings.useQuery();
  const settings = query.data as OrganizationSettings | undefined;
  const isLoading = query.isLoading;
  const isError = query.isError;

  // Extract onboarding status to avoid complex type in dependency array
  const onboardingCompleted = settings?.settings?.onboardingCompleted ?? false;

  useEffect(() => {
    // Check if onboarding is already completed
    if (onboardingCompleted) {
      // Redirect to dashboard if onboarding is already done
      router.push('/dashboard');
    }
  }, [onboardingCompleted, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="container max-w-3xl mx-auto py-10 px-4">
          <div className="mb-8">
            <Skeleton className="h-2 w-full mb-6" />
            <div className="flex justify-between">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <Skeleton className="w-10 h-10 rounded-full mb-2" />
                  <Skeleton className="h-3 w-16 hidden sm:block" />
                </div>
              ))}
            </div>
          </div>
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-destructive mb-4">
              Failed to load organization settings.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-primary hover:underline"
            >
              Go to Dashboard
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <OnboardingWizard />;
}
