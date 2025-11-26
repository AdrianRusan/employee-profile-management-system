'use client';

import { use } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Building2,
  Users,
  MessageSquare,
  CalendarDays,
  UserCheck,
  Ban,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

interface OrganizationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrganizationDetailPage({ params }: OrganizationDetailPageProps) {
  const { id } = use(params);

  const { data: organization, isLoading, refetch } = trpc.admin.getOrganization.useQuery({ id });
  const { data: stats, isLoading: statsLoading } = trpc.admin.getOrganizationStats.useQuery({ id });

  const toggleStatusMutation = trpc.admin.toggleOrganizationStatus.useMutation({
    onSuccess: (_data: unknown, variables: { id: string; suspend: boolean }) => {
      toast.success(
        variables.suspend
          ? 'Organization suspended successfully'
          : 'Organization activated successfully'
      );
      refetch();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to update organization status');
    },
  });

  const handleToggleStatus = async () => {
    if (!organization) return;
    const isSuspended = !!organization.deletedAt;
    if (
      confirm(
        `Are you sure you want to ${isSuspended ? 'activate' : 'suspend'} this organization?`
      )
    ) {
      await toggleStatusMutation.mutateAsync({ id, suspend: !isSuspended });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-secondary" />
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <Skeleton className="h-32 w-full bg-secondary" />
          <Skeleton className="h-32 w-full bg-secondary" />
          <Skeleton className="h-32 w-full bg-secondary" />
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Organization not found</p>
        <Link href="/admin/organizations" passHref legacyBehavior>
          <Button variant="outline" className="mt-4" asChild>
            <a>Back to Organizations</a>
          </Button>
        </Link>
      </div>
    );
  }

  const isSuspended = !!organization.deletedAt;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/organizations" passHref legacyBehavior>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-secondary"
              asChild
            >
              <a>
                <ArrowLeft className="h-5 w-5" />
              </a>
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{organization.name}</h1>
              {isSuspended ? (
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400">
                  <Ban className="mr-1 h-3 w-3" />
                  Suspended
                </Badge>
              ) : (
                <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Active
                </Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Created {formatDistanceToNow(new Date(organization.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        <Button
          variant={isSuspended ? 'default' : 'destructive'}
          onClick={handleToggleStatus}
          disabled={toggleStatusMutation.isPending}
          className={isSuspended ? '' : 'bg-red-600 hover:bg-red-700'}
        >
          {isSuspended ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Activate
            </>
          ) : (
            <>
              <Ban className="mr-2 h-4 w-4" />
              Suspend
            </>
          )}
        </Button>
      </div>

      {/* Organization Info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Organization Details</CardTitle>
          <CardDescription className="text-muted-foreground">
            Basic information and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Slug</p>
              <code className="block px-3 py-2 rounded-lg bg-secondary text-card-foreground text-sm">
                {organization.slug}
              </code>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Domain</p>
              <p className="px-3 py-2 rounded-lg bg-secondary text-card-foreground text-sm">
                {organization.domain || 'Not set'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Organization ID</p>
              <code className="block px-3 py-2 rounded-lg bg-secondary text-card-foreground text-xs break-all">
                {organization.id}
              </code>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="px-3 py-2 rounded-lg bg-secondary text-card-foreground text-sm">
                {format(new Date(organization.createdAt), 'PPP')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <CardTitle className="text-sm text-card-foreground">Total Users</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 bg-secondary" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{stats?.totalUsers || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-400" />
              <CardTitle className="text-sm text-card-foreground">Active Users</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 bg-secondary" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{stats?.activeUsers || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-400" />
              <CardTitle className="text-sm text-card-foreground">Total Feedback</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 bg-secondary" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{stats?.totalFeedback || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-400" />
              <CardTitle className="text-sm text-card-foreground">Recent Feedback</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 bg-secondary" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{stats?.recentFeedback || 0}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-cyan-400" />
              <CardTitle className="text-sm text-card-foreground">Total Absences</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 bg-secondary" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{stats?.totalAbsences || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-orange-400" />
              <CardTitle className="text-sm text-card-foreground">Pending</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 bg-secondary" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{stats?.pendingAbsences || 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Users</CardTitle>
          <CardDescription className="text-muted-foreground">
            {organization._count.users} users in this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organization.users.length > 0 ? (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-secondary/50 border-border">
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Role</TableHead>
                    <TableHead className="text-muted-foreground">Department</TableHead>
                    <TableHead className="text-muted-foreground">Last Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organization.users.map((user: { id: string; name: string | null; email: string; role: string; department: string | null; lastLoginAt: string | null }) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-secondary/50 border-border"
                    >
                      <TableCell className="font-medium text-card-foreground">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.role === 'MANAGER'
                              ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                              : 'border-border bg-secondary/50 text-muted-foreground'
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.department || 'N/A'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.lastLoginAt
                          ? formatDistanceToNow(new Date(user.lastLoginAt), {
                              addSuffix: true,
                            })
                          : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No users in this organization</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
