'use client';

import { trpc } from '@/lib/trpc/Provider';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { RoleIndicator } from '@/components/RoleIndicator';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    data: currentUser,
    isLoading,
    isError,
    error,
  } = trpc.auth.getCurrentUser.useQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden md:block md:w-64">
          <Skeleton className="h-screen w-full" />
        </div>
        <div className="flex flex-1 flex-col">
          <header className="border-b bg-white">
            <div className="flex h-16 items-center justify-between px-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
          </header>
          <main className="flex-1 p-4">
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden md:block md:w-64">
          <Skeleton className="h-screen w-full" />
        </div>
        <div className="flex flex-1 flex-col">
          <header className="border-b bg-white">
            <div className="flex h-16 items-center justify-between px-4">
              <div className="text-red-600 font-semibold">Failed to load user</div>
            </div>
          </header>
          <main className="flex-1 p-4">
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="font-medium">An error occurred while fetching the current user.</p>
              <p className="mt-1 text-sm">{error?.message}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <ErrorBoundary level="component">
                <MobileNav />
              </ErrorBoundary>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Employee Profile System
                </h2>
                <p className="text-sm text-gray-600">
                  Welcome, {currentUser?.name || 'Guest'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ErrorBoundary level="component">
                <RoleIndicator />
              </ErrorBoundary>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 bg-gray-50 p-4 md:p-6 lg:p-8" role="main">
          <ErrorBoundary level="page">
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
