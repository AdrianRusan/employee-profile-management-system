'use client';

import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, MessageSquare, Calendar, Users, Star, Clock } from 'lucide-react';

/**
 * MetricsCard component displays key dashboard metrics
 * Shows role-specific metrics (different for employees vs managers)
 */
export function MetricsCard() {
  const { data: metrics, isLoading, error } = trpc.dashboard.getMetrics.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes - metrics change infrequently
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Failed to load metrics. Please try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  // Check if user is a manager based on presence of manager-specific fields
  const isManager = 'teamSize' in metrics;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gray-600" />
          <CardTitle>Key Metrics</CardTitle>
        </div>
        <CardDescription>
          {isManager ? 'Your team and personal statistics' : 'Your activity summary'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Feedback Received */}
          <MetricItem
            icon={<MessageSquare className="h-5 w-5 text-blue-500" />}
            label="Feedback Received"
            value={metrics.feedbackReceived}
          />

          {/* Feedback Given */}
          <MetricItem
            icon={<MessageSquare className="h-5 w-5 text-green-500" />}
            label="Feedback Given"
            value={metrics.feedbackGiven}
          />

          {/* Total Absences */}
          <MetricItem
            icon={<Calendar className="h-5 w-5 text-purple-500" />}
            label="Total Absences"
            value={metrics.totalAbsences}
            subtitle={`${metrics.approvedAbsences} approved`}
          />

          {/* Pending Absences */}
          <MetricItem
            icon={<Clock className="h-5 w-5 text-yellow-500" />}
            label="Pending Requests"
            value={metrics.pendingAbsences}
          />

          {/* Manager-specific metrics */}
          {isManager && 'teamSize' in metrics && (
            <>
              <MetricItem
                icon={<Users className="h-5 w-5 text-indigo-500" />}
                label="Team Size"
                value={metrics.teamSize}
              />

              <MetricItem
                icon={<Clock className="h-5 w-5 text-orange-500" />}
                label="Pending Approvals"
                value={metrics.pendingApprovals}
                highlighted={metrics.pendingApprovals > 0}
              />

              {metrics.avgPerformance !== null && (
                <MetricItem
                  icon={<Star className="h-5 w-5 text-yellow-400" />}
                  label="Avg Performance"
                  value={metrics.avgPerformance}
                  subtitle="Team average"
                />
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Individual metric display component
 */
function MetricItem({
  icon,
  label,
  value,
  subtitle,
  highlighted = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle?: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${
        highlighted ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs font-medium text-gray-600 mt-1">{label}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
