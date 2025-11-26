'use client';

import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { CalendarCheck } from 'lucide-react';
import type { AppRouter } from '@/server';
import type { inferRouterOutputs } from '@trpc/server';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type UpcomingAbsence = RouterOutputs['dashboard']['getUpcomingAbsences'][number];

/**
 * UpcomingAbsences component displays upcoming approved absences
 * Shows absences in the next 60 days in a timeline format
 */
export function UpcomingAbsences() {
  const { data: absences, isLoading, error } = trpc.dashboard.getUpcomingAbsences.useQuery(
    undefined,
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - very stable data (approved absences)
      refetchOnWindowFocus: false,
    }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CalendarCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Upcoming Time Off</CardTitle>
              <CardDescription>Your approved absences in the next 60 days</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              Failed to load upcoming absences. Please try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!absences || absences.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CalendarCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Upcoming Time Off</CardTitle>
              <CardDescription>Your approved absences in the next 60 days</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <CalendarCheck className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No upcoming time off</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Approved absences will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper to calculate duration in days
  const calculateDuration = (start: Date | string, end: Date | string) => {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days
    return diffDays;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <CalendarCheck className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Upcoming Time Off</CardTitle>
            <CardDescription>
              Your approved absences in the next 60 days ({absences.length})
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {absences.map((absence: UpcomingAbsence) => {
            const duration = calculateDuration(absence.startDate, absence.endDate);
            const startsIn = formatDistanceToNow(new Date(absence.startDate), {
              addSuffix: true,
            });

            return (
              <div
                key={absence.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors"
              >
                {/* Timeline dot */}
                <div className="flex-shrink-0 mt-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(absence.startDate), 'MMM d')} -{' '}
                        {format(new Date(absence.endDate), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {absence.reason || 'No reason provided'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0">
                      {duration} {duration === 1 ? 'day' : 'days'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-2">{startsIn}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* View all link */}
        {absences.length >= 10 && (
          <div className="mt-4 pt-4 border-t text-center">
            <a
              href="/dashboard/absences"
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              View all absences →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
