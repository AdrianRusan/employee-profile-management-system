'use client';

import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityItem } from './ActivityItem';
import { Activity as ActivityIcon } from 'lucide-react';

interface ActivityFeedProps {
  limit?: number;
}

type ActivityData = {
  id: string;
  type: 'feedback' | 'absence';
  title: string;
  description: string;
  timestamp: Date | string;
  metadata?: Record<string, unknown>;
};

/**
 * ActivityFeed component displays recent user activity
 * Fetches and displays recent feedback and absence updates
 */
export function ActivityFeed({ limit = 10 }: ActivityFeedProps) {
  const { data: activities, isLoading, error } = trpc.dashboard.getRecentActivity.useQuery(
    {
      limit,
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes - activity is relatively fresh
      refetchOnWindowFocus: false,
    }
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
            <ActivityIcon className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Your latest feedback and time off updates</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent aria-live="polite" aria-busy={isLoading}>
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Skeleton className="h-5 w-5 rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 p-4" role="alert">
            <p className="text-sm text-destructive">
              Failed to load recent activity. Please try again later.
            </p>
          </div>
        )}

        {!isLoading && !error && activities && activities.length === 0 && (
          <div className="text-center py-8">
            <ActivityIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Give feedback or request time off to see activity here
            </p>
          </div>
        )}

        {!isLoading && !error && activities && activities.length > 0 && (
          <div className="space-y-1">
            {activities.map((activity: ActivityData) => (
              <ActivityItem
                key={activity.id}
                type={activity.type}
                title={activity.title}
                description={activity.description}
                timestamp={activity.timestamp}
                metadata={activity.metadata}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
