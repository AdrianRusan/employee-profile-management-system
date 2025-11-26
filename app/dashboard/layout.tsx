'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/Provider';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { KeyboardShortcutsProvider } from '@/components/KeyboardShortcutsProvider';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { GlobalShortcutsHint } from '@/components/GlobalShortcutsHint';
import { SearchBarButton } from '@/components/SearchBarButton';
import { NotificationDropdown } from '@/components/NotificationDropdown';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    data: currentUser,
    isLoading: userLoading,
    isError,
    error,
  } = trpc.auth.getCurrentUser.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes - user data rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Type for organization settings to avoid tRPC deep type inference (TS2589)
  type OrgSettingsResult = { settings?: Record<string, unknown> } | null | undefined;

  const {
    data: orgSettings,
    isLoading: settingsLoading,
  } = trpc.organization.getSettings.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // 10 minutes - org settings rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes
  }) as { data: OrgSettingsResult; isLoading: boolean };

  const isLoading = userLoading || settingsLoading;

  // Check if onboarding redirect is needed
  const needsOnboarding = !isLoading &&
    orgSettings &&
    currentUser &&
    currentUser.role === 'MANAGER' &&
    orgSettings.settings?.onboardingCompleted !== true;

  // Redirect to onboarding if not completed (only for managers who can complete onboarding)
  useEffect(() => {
    if (needsOnboarding && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/onboarding');
    }
  }, [needsOnboarding, isRedirecting, router]);

  // Show loading state while checking or redirecting to onboarding
  if (isLoading || needsOnboarding || isRedirecting) {
    return (
      <div className="flex min-h-screen bg-muted/30">
        <div className="hidden md:block md:w-64">
          <Skeleton className="h-screen w-full" />
        </div>
        <div className="flex flex-1 flex-col">
          <header className="border-b bg-background">
            <div className="flex h-16 items-center justify-between px-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
          </header>
          <main className="flex-1 p-4">
            <div className="flex flex-col items-center justify-center h-96 gap-4">
              <Skeleton className="h-96 w-full" />
              {(needsOnboarding || isRedirecting) && (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Setting up your workspace...
                </p>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen bg-muted/30">
        <div className="hidden md:block md:w-64">
          <Skeleton className="h-screen w-full" />
        </div>
        <div className="flex flex-1 flex-col">
          <header className="border-b bg-background">
            <div className="flex h-16 items-center justify-between px-4">
              <div className="text-destructive font-semibold">Failed to load user</div>
            </div>
          </header>
          <main className="flex-1 p-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
              <p className="font-medium">An error occurred while fetching the current user.</p>
              <p className="mt-1 text-sm opacity-90">{error?.message}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <KeyboardShortcutsProvider>
      <div className="flex min-h-screen bg-muted/30">
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Skip to main content
        </a>

        {/* Desktop Sidebar */}
        <aside
          className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col"
          aria-label="Sidebar navigation"
        >
          <ErrorBoundary level="component">
            <Sidebar />
          </ErrorBoundary>
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col md:pl-64">
          {/* Modern Header */}
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
            <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
              {/* Left: Mobile Nav + Title */}
              <div className="flex items-center gap-4">
                <ErrorBoundary level="component">
                  <MobileNav />
                </ErrorBoundary>
                <div className="hidden flex-col sm:flex">
                  <h2 className="text-base font-semibold text-foreground">
                    Employee Portal
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Welcome back, {currentUser?.name?.split(' ')[0] || 'there'}
                  </p>
                </div>
              </div>

              {/* Center: Search Bar */}
              <div className="flex flex-1 justify-center px-4">
                <SearchBarButton />
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                {/* Notifications */}
                <ErrorBoundary level="component">
                  <NotificationDropdown />
                </ErrorBoundary>

                {/* Role Badge */}
                {currentUser?.role && (
                  <Badge
                    variant="secondary"
                    className={
                      currentUser.role === 'MANAGER'
                        ? 'bg-purple-100 text-purple-800 hover:bg-purple-100'
                        : currentUser.role === 'EMPLOYEE'
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                        : 'bg-green-100 text-green-800 hover:bg-green-100'
                    }
                  >
                    {currentUser.role}
                  </Badge>
                )}
              </div>
            </div>

            {/* Breadcrumbs row */}
            <div className="border-t bg-muted/30 px-4 py-2 lg:px-6">
              <Breadcrumbs />
            </div>
          </header>

          {/* Page Content */}
          <main
            id="main-content"
            className="flex-1 p-4 pb-16 md:p-6 lg:p-8"
            role="main"
          >
            <ErrorBoundary level="page">{children}</ErrorBoundary>
          </main>

          {/* Global Shortcuts Hint Bar */}
          <GlobalShortcutsHint />
        </div>
      </div>
    </KeyboardShortcutsProvider>
  );
}
