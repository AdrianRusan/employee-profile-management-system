'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/Provider';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleIndicator } from '@/components/RoleIndicator';
import { Users, MessageSquare, CalendarDays } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout: clearAuthState } = useAuthStore();

  const { data: currentUser, isLoading } = trpc.auth.getCurrentUser.useQuery();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      clearAuthState();
      router.push('/login');
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Profile System</h1>
            <p className="text-sm text-gray-600">
              Welcome, {currentUser?.name || user?.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <RoleIndicator />
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>View and manage your profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Email:</span> {currentUser?.email}</p>
                <p><span className="font-medium">Department:</span> {currentUser?.department || 'N/A'}</p>
                <p><span className="font-medium">Title:</span> {currentUser?.title || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Navigate to key features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/profiles">
                    <Users className="mr-2 h-4 w-4" />
                    View Profiles
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/feedback">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Feedback
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/absences">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Absences
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Phase 5 - Absence Management Complete</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✅ Authentication & Authorization</li>
                <li>✅ Role-based access control</li>
                <li>✅ Session management</li>
                <li>✅ Profile management (Phase 3)</li>
                <li>✅ Feedback system (Phase 4)</li>
                <li>✅ Absence management (Phase 5)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
