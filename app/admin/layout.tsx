'use client';

import { trpc } from '@/lib/trpc/Provider';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Shield, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const {
    data: currentUser,
    isLoading: userLoading,
    isError,
    error,
  } = trpc.auth.getCurrentUser.useQuery();

  // Check super admin status server-side to avoid exposing admin emails
  const {
    data: adminStatus,
    isLoading: adminLoading,
  } = trpc.admin.checkSuperAdmin.useQuery(undefined, {
    enabled: !!currentUser,
  });

  const isLoading = userLoading || (!!currentUser && adminLoading);
  const isSuperAdmin = adminStatus?.isSuperAdmin ?? false;

  // Redirect non-admin users to dashboard
  useEffect(() => {
    if (!isLoading && currentUser && !isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [isLoading, currentUser, isSuperAdmin, router]);

  if (isLoading) {
    return (
      <div className="admin-theme flex min-h-screen bg-background">
        <div className="hidden md:block md:w-64">
          <Skeleton className="h-screen w-full bg-card" />
        </div>
        <div className="flex flex-1 flex-col">
          <header className="border-b border-border bg-card">
            <div className="flex h-16 items-center justify-between px-4">
              <Skeleton className="h-8 w-48 bg-muted" />
              <Skeleton className="h-10 w-32 bg-muted" />
            </div>
          </header>
          <main className="flex-1 p-4">
            <Skeleton className="h-96 w-full bg-card" />
          </main>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="admin-theme flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-red-400 max-w-md">
          <p className="font-medium">An error occurred while loading the admin panel.</p>
          <p className="mt-2 text-sm opacity-90">{error?.message}</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting non-admin users
  if (!isSuperAdmin) {
    return (
      <div className="admin-theme flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-theme flex min-h-screen bg-background">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col"
        aria-label="Admin sidebar navigation"
      >
        <ErrorBoundary level="component">
          <AdminSidebar />
        </ErrorBoundary>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Admin Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
          <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
            {/* Left: Mobile Nav + Title */}
            <div className="flex items-center gap-4">
              <ErrorBoundary level="component">
                <AdminMobileNav />
              </ErrorBoundary>
              <div className="hidden flex-col sm:flex">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    Super Admin Panel
                  </h2>
                  <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px]">
                    ADMIN
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Platform management and oversight
                </p>
              </div>
            </div>

            {/* Right: User Info */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Bell className="h-5 w-5" />
              </Button>

              <div className="hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{currentUser?.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                </div>
              </div>
            </div>
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

        {/* Footer */}
        <footer className="border-t border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>Super Admin Panel v1.0</p>
            <p>Logged in as: {currentUser?.email}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
