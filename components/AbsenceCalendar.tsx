'use client';

import { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/Provider';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface AbsenceCalendarProps {
  userId?: string;
  showLegend?: boolean;
}

/**
 * Calendar component showing absence dates with color-coded status
 * - Pending: Yellow
 * - Approved: Green
 * - Rejected: Red
 */
export function AbsenceCalendar({ userId, showLegend = true }: AbsenceCalendarProps) {
  // Fetch absence data based on whether userId is provided
  const { data: absences, isLoading } = userId
    ? trpc.absence.getForUser.useQuery({ userId })
    : trpc.absence.getMy.useQuery();

  // Process absences into date ranges by status
  const absencesByStatus = useMemo(() => {
    if (!absences) return { pending: [], approved: [], rejected: [] };

    return {
      pending: absences.filter((a) => a.status === 'PENDING'),
      approved: absences.filter((a) => a.status === 'APPROVED'),
      rejected: absences.filter((a) => a.status === 'REJECTED'),
    };
  }, [absences]);

  // Custom day content renderer for colored status indicators
  // Priority: APPROVED > PENDING > REJECTED (show most relevant status)
  const modifiers = useMemo(() => {
    if (!absences) return {};

    const pending: Date[] = [];
    const approved: Date[] = [];
    const rejected: Date[] = [];

    // Group absences by date to handle overlaps with priority
    const dateStatusMap = new Map<string, 'APPROVED' | 'PENDING' | 'REJECTED'>();

    // Helpers to normalize and operate in UTC to avoid off-by-one issues
    const toUtcMidnight = (input: string | Date): Date => {
      if (typeof input === 'string') {
        // If input is a date-only string, treat it as UTC midnight explicitly
        if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
          return new Date(input + 'T00:00:00Z');
        }
        const d = new Date(input);
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      }
      const d = input;
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    };

    const getUtcDateKey = (d: Date): string => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    absences.forEach((absence) => {
      const start = toUtcMidnight(absence.startDate as unknown as string);
      const end = toUtcMidnight(absence.endDate as unknown as string);

      // Iterate day-by-day using fixed 24h steps in UTC
      const DAY_MS = 86400000; // 24 * 60 * 60 * 1000
      for (let ts = start.getTime(); ts <= end.getTime(); ts += DAY_MS) {
        const currentUtc = new Date(ts);
        const dateKey = getUtcDateKey(currentUtc); // YYYY-MM-DD in UTC
        const existing = dateStatusMap.get(dateKey);

        // Priority: APPROVED > PENDING > REJECTED
        if (!existing ||
            absence.status === 'APPROVED' ||
            (absence.status === 'PENDING' && existing === 'REJECTED')) {
          dateStatusMap.set(dateKey, absence.status);
        }
      }
    });

    // Convert map to date arrays
    dateStatusMap.forEach((status, dateKey) => {
      // Reconstruct Date object as UTC midnight to keep consistency
      const date = new Date(dateKey + 'T00:00:00Z');

      if (status === 'PENDING') {
        pending.push(date);
      } else if (status === 'APPROVED') {
        approved.push(date);
      } else if (status === 'REJECTED') {
        rejected.push(date);
      }
    });

    return { pending, approved, rejected };
  }, [absences]);

  const modifiersClassNames = {
    pending: 'bg-yellow-200 text-yellow-900 hover:bg-yellow-300 dark:bg-yellow-900 dark:text-yellow-100',
    approved: 'bg-green-200 text-green-900 hover:bg-green-300 dark:bg-green-900 dark:text-green-100',
    rejected: 'bg-red-200 text-red-900 hover:bg-red-300 dark:bg-red-900 dark:text-red-100',
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Absence Calendar</CardTitle>
          <CardDescription>Loading calendar...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Absence Calendar</CardTitle>
        <CardDescription>
          View your absence requests on the calendar below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            className="rounded-md border"
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
          />
        </div>

        {showLegend && (
          <div className="flex flex-wrap gap-4 justify-center pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-200 dark:bg-yellow-900" />
              <span className="text-sm text-muted-foreground">
                Pending ({absencesByStatus.pending.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900" />
              <span className="text-sm text-muted-foreground">
                Approved ({absencesByStatus.approved.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-200 dark:bg-red-900" />
              <span className="text-sm text-muted-foreground">
                Rejected ({absencesByStatus.rejected.length})
              </span>
            </div>
          </div>
        )}

        {/* Upcoming absences list */}
        {absences && absences.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-semibold">Upcoming Absences</h4>
            <div className="space-y-2">
              {absences
                .filter((absence) => new Date(absence.endDate) >= new Date())
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .slice(0, 5)
                .map((absence) => (
                  <div
                    key={absence.id}
                    className="flex items-center justify-between p-2 rounded-lg border text-sm"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {format(new Date(absence.startDate), 'MMM d')} -{' '}
                        {format(new Date(absence.endDate), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {absence.reason}
                      </div>
                    </div>
                    <Badge
                      variant={
                        absence.status === 'APPROVED'
                          ? 'default'
                          : absence.status === 'PENDING'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {absence.status}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}

        {absences && absences.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No absence requests found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
