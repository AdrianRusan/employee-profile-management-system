'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, RefreshCw } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

/**
 * Frontend type definitions for audit activity data
 * These types define the shape of data returned from the admin.getRecentActivity query
 */
interface ActivityOrganization {
  name: string;
  slug: string;
}

interface AuditActivity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userEmail: string;
  userRole: string;
  ipAddress: string | null;
  createdAt: string | Date;
  organization?: ActivityOrganization | null;
}

const ACTION_COLORS: Record<string, string> = {
  VIEW_PROFILE: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  VIEW_SENSITIVE_DATA: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  VIEW_FEEDBACK: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
  VIEW_ABSENCE: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
  CREATE_USER: 'border-green-500/30 bg-green-500/10 text-green-400',
  CREATE_FEEDBACK: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  CREATE_ABSENCE: 'border-teal-500/30 bg-teal-500/10 text-teal-400',
  UPDATE_PROFILE: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  UPDATE_SENSITIVE_DATA: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
  UPDATE_FEEDBACK: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
  UPDATE_ABSENCE_STATUS: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400',
  DELETE_USER: 'border-red-500/30 bg-red-500/10 text-red-400',
  DELETE_FEEDBACK: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  DELETE_ABSENCE: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
  RESTORE_USER: 'border-lime-500/30 bg-lime-500/10 text-lime-400',
  LOGIN_SUCCESS: 'border-green-500/30 bg-green-500/10 text-green-400',
  LOGIN_FAILURE: 'border-red-500/30 bg-red-500/10 text-red-400',
  LOGOUT: 'border-gray-500/30 bg-gray-500/10 text-gray-400',
  SESSION_EXPIRED: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  EXPORT_DATA: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  BULK_OPERATION: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
};

export default function ActivityPage() {
  const [take, setTake] = useState(50);
  const { data: activities, isLoading, refetch } = trpc.admin.getRecentActivity.useQuery({ take });

  const handleRefresh = () => {
    refetch();
  };

  const handleLoadMore = () => {
    setTake((prev) => prev + 50);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activity Logs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Audit trail of actions across the platform
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-secondary border-border text-secondary-foreground hover:bg-secondary/80"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Activity Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Recent Activity</CardTitle>
          <CardDescription className="text-muted-foreground">
            {activities ? `Showing ${activities.length} most recent activities` : 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !activities ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full bg-secondary" />
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <>
              <div className="rounded-md border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-secondary/50 border-border">
                      <TableHead className="text-muted-foreground">Action</TableHead>
                      <TableHead className="text-muted-foreground">User</TableHead>
                      <TableHead className="text-muted-foreground">Organization</TableHead>
                      <TableHead className="text-muted-foreground">Entity</TableHead>
                      <TableHead className="text-muted-foreground">IP Address</TableHead>
                      <TableHead className="text-muted-foreground">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(activities as AuditActivity[])?.map((activity) => (
                      <TableRow
                        key={activity.id}
                        className="hover:bg-secondary/50 border-border"  
                      >
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              ACTION_COLORS[activity.action] ||
                              'border-border bg-secondary/50 text-muted-foreground'
                            }
                          >
                            {activity.action.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-card-foreground">
                              {activity.userEmail}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Role: {activity.userRole}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {activity.organization?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm text-card-foreground">
                              {activity.entityType}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {activity.entityId.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono">
                          {activity.ipAddress || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm text-card-foreground">
                              {formatDistanceToNow(new Date(activity.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(activity.createdAt), 'PPp')}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Load More Button */}
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="bg-secondary border-border text-secondary-foreground hover:bg-secondary/80"
                >
                  Load More Activities
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No activity logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
