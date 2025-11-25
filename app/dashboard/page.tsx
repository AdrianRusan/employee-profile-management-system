'use client';

import { Suspense, lazy, useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FadeIn } from '@/components/FadeIn';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { MetricsCard } from '@/components/dashboard/MetricsCard';
import { DashboardCustomization, useDashboardPreferences } from '@/components/dashboard/DashboardCustomization';

// Lazy load heavy components for better initial page load
const ActivityFeed = lazy(() => import('@/components/dashboard/ActivityFeed').then(mod => ({ default: mod.ActivityFeed })));
const FeedbackChart = lazy(() => import('@/components/dashboard/FeedbackChart').then(mod => ({ default: mod.FeedbackChart })));
const AbsenceChart = lazy(() => import('@/components/dashboard/AbsenceChart').then(mod => ({ default: mod.AbsenceChart })));
const UpcomingAbsences = lazy(() => import('@/components/dashboard/UpcomingAbsences').then(mod => ({ default: mod.UpcomingAbsences })));

export default function DashboardPage() {
  const { data: currentUser, isLoading, isError, error } = trpc.auth.getCurrentUser.useQuery();
  const preferences = useDashboardPreferences();

  return (
    <div className="space-y-6">
      <FadeIn direction="down">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome back! Here&apos;s an overview of your activity and quick access to key features
            </p>
          </div>
          <DashboardCustomization />
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
                <p className="text-sm text-destructive">
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
                <p className="text-sm text-destructive">
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
      {preferences.showMetrics && (
        <FadeIn delay={0.3} direction="up">
          <MetricsCard />
        </FadeIn>
      )}

      {/* Data Visualization Section */}
      {(preferences.showFeedbackChart || preferences.showAbsenceChart || preferences.showUpcomingAbsences) && (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {preferences.showFeedbackChart && (
            <FadeIn delay={0.4} direction="up">
              <Suspense fallback={
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-48 w-full" />
                  </CardContent>
                </Card>
              }>
                <FeedbackChart />
              </Suspense>
            </FadeIn>
          )}

          {preferences.showAbsenceChart && (
            <FadeIn delay={0.5} direction="up">
              <Suspense fallback={
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-48 w-full" />
                  </CardContent>
                </Card>
              }>
                <AbsenceChart />
              </Suspense>
            </FadeIn>
          )}

          {preferences.showUpcomingAbsences && (
            <FadeIn delay={0.6} direction="up">
              <Suspense fallback={
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-40" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </CardContent>
                </Card>
              }>
                <UpcomingAbsences />
              </Suspense>
            </FadeIn>
          )}
        </div>
      )}

      {/* Recent Activity Section */}
      {preferences.showActivityFeed && (
        <FadeIn delay={0.7} direction="up">
          <Suspense fallback={
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          }>
            <ActivityFeed limit={10} />
          </Suspense>
        </FadeIn>
      )}
    </div>
  );
}
