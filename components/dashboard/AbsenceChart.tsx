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
      <Card>
        <CardHeader>
          <CardTitle>Absence Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Failed to load absence stats. Please try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-purple-500" />
            <CardTitle>Absence Requests</CardTitle>
          </div>
          <CardDescription>Status breakdown of your time off requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <CalendarDays className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No absence requests yet</p>
            <p className="text-xs text-gray-400 mt-1">
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-purple-500" />
          <CardTitle>Absence Requests</CardTitle>
        </div>
        <CardDescription>
          Status breakdown of your time off requests ({stats.total} total)
        </CardDescription>
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
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{data.name}</p>
                        <p className="text-sm text-gray-600">{data.value} requests</p>
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
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-gray-600 mt-1">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-xs text-gray-600 mt-1">Approved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-xs text-gray-600 mt-1">Rejected</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
