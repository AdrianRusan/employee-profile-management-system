'use client';

import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarDays } from 'lucide-react';

const STATUS_COLORS = {
  Pending: '#eab308', // yellow
  Approved: '#22c55e', // green
  Rejected: '#ef4444', // red
};

/**
 * AbsenceChart component displays absence request breakdown
 * Shows pending, approved, and rejected requests in a bar chart
 */
export function AbsenceChart() {
  const { data: stats, isLoading, error } = trpc.dashboard.getAbsenceStats.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes - stats change infrequently
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <Skeleton className="h-full w-full" />
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <CalendarDays className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Absence Requests</CardTitle>
              <CardDescription>Status breakdown of your time off requests</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              Failed to load absence stats. Please try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <CalendarDays className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Absence Requests</CardTitle>
              <CardDescription>Status breakdown of your time off requests</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No absence requests yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Request time off to see your history here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    {
      name: 'Pending',
      value: stats.pending,
      fill: STATUS_COLORS.Pending,
    },
    {
      name: 'Approved',
      value: stats.approved,
      fill: STATUS_COLORS.Approved,
    },
    {
      name: 'Rejected',
      value: stats.rejected,
      fill: STATUS_COLORS.Rejected,
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <CalendarDays className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Absence Requests</CardTitle>
            <CardDescription>
              Status breakdown of your time off requests ({stats.total} total)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover p-3 rounded-lg shadow-lg border border-border">
                        <p className="text-sm font-medium text-popover-foreground">{data.name}</p>
                        <p className="text-sm text-muted-foreground">{data.value} requests</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <div>
                <p className="text-lg font-bold text-foreground">{stats.pending}</p>
                <p className="text-[10px] text-muted-foreground">Pending</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <div>
                <p className="text-lg font-bold text-foreground">{stats.approved}</p>
                <p className="text-[10px] text-muted-foreground">Approved</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/5">
              <div className="h-3 w-3 rounded-full bg-rose-500" />
              <div>
                <p className="text-lg font-bold text-foreground">{stats.rejected}</p>
                <p className="text-[10px] text-muted-foreground">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
