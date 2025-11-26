'use client';

import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, UserCheck, UserPlus, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

// Type for activity log to avoid deep type instantiation
type ActivityLog = {
  id: string;
  userEmail: string;
  action: string;
  createdAt: Date | string;
  organization?: {
    name: string;
    slug: string;
  } | null;
};

export default function AdminDashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = trpc.admin.getPlatformMetrics.useQuery();
  const { data: recentActivity, isLoading: activityLoading } = trpc.admin.getRecentActivity.useQuery({ take: 10 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Platform Overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Monitor and manage your multi-tenant SaaS platform
        </p>
      </div>

      {/* Platform Metrics */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Organizations */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Total Organizations
            </CardTitle>
            <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20 bg-secondary" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{metrics?.totalOrgs || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Active tenants</p>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Total Users
            </CardTitle>
            <div className="h-8 w-8 rounded-md bg-purple-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20 bg-secondary" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{metrics?.totalUsers || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Across all orgs</p>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Active Users
            </CardTitle>
            <div className="h-8 w-8 rounded-md bg-green-500/10 flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20 bg-secondary" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{metrics?.activeUsers || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        {/* New Signups */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              New Signups
            </CardTitle>
            <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20 bg-secondary" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{metrics?.newSignups || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Common admin tasks
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/organizations" passHref legacyBehavior>
              <Button
                variant="outline"
                className="w-full justify-start bg-secondary/50 border-border text-secondary-foreground hover:bg-secondary hover:text-foreground"
                asChild
              >
                <a>
                  <Building2 className="mr-2 h-4 w-4" />
                  Manage Organizations
                </a>
              </Button>
            </Link>
            <Link href="/admin/users" passHref legacyBehavior>
              <Button
                variant="outline"
                className="w-full justify-start bg-secondary/50 border-border text-secondary-foreground hover:bg-secondary hover:text-foreground"
                asChild
              >
                <a>
                  <Users className="mr-2 h-4 w-4" />
                  View All Users
                </a>
              </Button>
            </Link>
            <Link href="/admin/activity" passHref legacyBehavior>
              <Button
                variant="outline"
                className="w-full justify-start bg-secondary/50 border-border text-secondary-foreground hover:bg-secondary hover:text-foreground"
                asChild
              >
                <a>
                  <Activity className="mr-2 h-4 w-4" />
                  View Activity Logs
                </a>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-purple-500/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-card-foreground">Recent Activity</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Latest platform events
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full bg-secondary" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-3/4 bg-secondary" />
                      <Skeleton className="h-3 w-1/2 bg-secondary" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {(recentActivity as ActivityLog[]).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-3 border-b border-border last:border-0"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {activity.userEmail.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-card-foreground font-medium truncate">
                          {activity.userEmail}
                        </p>
                        <Badge
                          variant="outline"
                          className="border-border bg-secondary/50 text-muted-foreground text-[10px]"
                        >
                          {activity.action.replace(/_/g, ' ').toLowerCase()}
                        </Badge>
                      </div>
                      {activity.organization && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.organization.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
