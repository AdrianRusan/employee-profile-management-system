import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Enhanced loading skeletons with shimmer effects and better visual structure
 */

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-48 skeleton-shimmer" />
        <Skeleton className="h-4 w-96 skeleton-shimmer" />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40 skeleton-shimmer" />
            <Skeleton className="h-4 w-32 skeleton-shimmer" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full skeleton-shimmer" />
              <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40 skeleton-shimmer" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full skeleton-shimmer" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 skeleton-shimmer" />
          <Skeleton className="h-4 w-48 skeleton-shimmer" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full skeleton-shimmer" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32 skeleton-shimmer" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full skeleton-shimmer" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ProfileListLoadingSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="transition-opacity">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full skeleton-shimmer" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48 skeleton-shimmer" />
                <Skeleton className="h-3 w-32 skeleton-shimmer" />
              </div>
              <Skeleton className="h-8 w-20 skeleton-shimmer" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProfileDetailLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Skeleton className="h-24 w-24 rounded-full skeleton-shimmer" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64 skeleton-shimmer" />
              <Skeleton className="h-4 w-48 skeleton-shimmer" />
              <Skeleton className="h-4 w-56 skeleton-shimmer" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32 skeleton-shimmer" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full skeleton-shimmer" />
                <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
                <Skeleton className="h-4 w-5/6 skeleton-shimmer" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function TableLoadingSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Table Header */}
      <div className="flex gap-4 border-b pb-2">
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 skeleton-shimmer" />
        ))}
      </div>

      {/* Table Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1 skeleton-shimmer" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function FormLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24 skeleton-shimmer" />
          <Skeleton className="h-10 w-full skeleton-shimmer" />
        </div>
      ))}
      <div className="flex justify-end gap-3">
        <Skeleton className="h-10 w-24 skeleton-shimmer" />
        <Skeleton className="h-10 w-32 skeleton-shimmer" />
      </div>
    </div>
  );
}

export function CardGridLoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32 skeleton-shimmer" />
            <Skeleton className="h-4 w-48 skeleton-shimmer" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-24 w-full skeleton-shimmer" />
              <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
