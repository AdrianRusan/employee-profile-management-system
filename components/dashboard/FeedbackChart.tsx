'use client';

import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, PieLabelRenderProps } from 'recharts';
import { Sparkles } from 'lucide-react';

const COLORS = {
  polished: '#3b82f6', // blue
  unpolished: '#94a3b8', // gray
};

/**
 * FeedbackChart component displays feedback breakdown
 * Shows polished vs unpolished feedback in a pie chart
 */
export function FeedbackChart() {
  const { data: stats, isLoading, error } = trpc.dashboard.getFeedbackStats.useQuery(undefined, {
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
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feedback Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Failed to load feedback stats. Please try again later.
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
            <Sparkles className="h-5 w-5 text-blue-500" />
            <CardTitle>Feedback Breakdown</CardTitle>
          </div>
          <CardDescription>Polished vs unpolished feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <Sparkles className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No feedback received yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Feedback will appear here once you receive some
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    {
      name: 'Polished',
      value: stats.polished,
      percentage: Math.round((stats.polished / stats.total) * 100),
    },
    {
      name: 'Unpolished',
      value: stats.unpolished,
      percentage: Math.round((stats.unpolished / stats.total) * 100),
    },
  ].filter((item) => item.value > 0); // Only show non-zero values

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <CardTitle>Feedback Breakdown</CardTitle>
        </div>
        <CardDescription>
          Polished vs unpolished feedback ({stats.total} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: PieLabelRenderProps) => {
                  const chartEntry = chartData[props.index || 0];
                  return `${chartEntry.name}: ${chartEntry.percentage}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name === 'Polished' ? COLORS.polished : COLORS.unpolished}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{data.name}</p>
                        <p className="text-sm text-gray-600">
                          {data.value} items ({data.percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                content={({ payload }) => (
                  <div className="flex justify-center gap-6 mt-4">
                    {payload?.map((entry, index) => (
                      <div key={`legend-${index}`} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-gray-600">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.polished}</p>
              <p className="text-xs text-gray-600 mt-1">AI Polished</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">{stats.unpolished}</p>
              <p className="text-xs text-gray-600 mt-1">Original</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
