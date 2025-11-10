'use client';

import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FadeIn } from '@/components/FadeIn';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { MetricsCard } from '@/components/dashboard/MetricsCard';
import { FeedbackChart } from '@/components/dashboard/FeedbackChart';
import { AbsenceChart } from '@/components/dashboard/AbsenceChart';
import { UpcomingAbsences } from '@/components/dashboard/UpcomingAbsences';

export default function DashboardPage() {
  const { data: currentUser, isLoading, isError, error } = trpc.auth.getCurrentUser.useQuery();

  return (
    <div className="space-y-6">
      <FadeIn direction="down">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Here&apos;s an overview of your activity and quick access to key features
          </p>
        </div>
      </FadeIn>

      {/* Top Section: Profile Info and Quick Actions */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
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
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : isError ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-red-600">
                  Failed to load quick actions
                </p>
              </CardContent>
            </Card>
          ) : (
            <QuickActions
              user={{
                id: currentUser!.id,
                email: currentUser!.email,
                role: currentUser!.role,
              }}
            />
          )}
        </FadeIn>
      </div>

      {/* Key Metrics Section */}
      <FadeIn delay={0.3} direction="up">
        <MetricsCard />
      </FadeIn>

      {/* Data Visualization Section */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <FadeIn delay={0.4} direction="up">
          <FeedbackChart />
        </FadeIn>

        <FadeIn delay={0.5} direction="up">
          <AbsenceChart />
        </FadeIn>

        <FadeIn delay={0.6} direction="up">
          <UpcomingAbsences />
        </FadeIn>
      </div>

      {/* Recent Activity Section */}
      <FadeIn delay={0.7} direction="up">
        <ActivityFeed limit={10} />
      </FadeIn>
    </div>
  );
}
