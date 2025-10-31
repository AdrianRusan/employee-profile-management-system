'use client';

import Link from 'next/link';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FadeIn } from '@/components/FadeIn';
import { Users, MessageSquare, CalendarDays } from 'lucide-react';

export default function DashboardPage() {
  const { data: currentUser, isLoading, isError, error } = trpc.auth.getCurrentUser.useQuery();

  return (
    <div className="space-y-6">
      <FadeIn direction="down">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Overview of your profile and quick access to key features
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <FadeIn delay={0.1} direction="up">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>View and manage your profile</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-60" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ) : isError ? (
                <p className="text-sm text-red-600">
                  Failed to load profile{error?.message ? `: ${error.message}` : ''}
                </p>
              ) : (
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Email:</span> {currentUser?.email}</p>
                  <p><span className="font-medium">Department:</span> {currentUser?.department || 'N/A'}</p>
                  <p><span className="font-medium">Title:</span> {currentUser?.title || 'N/A'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2} direction="up">
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
        </FadeIn>

        <FadeIn delay={0.3} direction="up">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Phase 6 - UI/UX Polish in Progress</CardDescription>
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
        </FadeIn>
      </div>
    </div>
  );
}
