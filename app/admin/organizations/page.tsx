'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Search, Building2, Eye, Ban, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

/**
 * Frontend type definitions for organization data
 * These types define the shape of data returned from the admin.listOrganizations query
 */
interface OrganizationCount {
  users: number;
  feedback?: number;
  absenceRequests?: number;
}

interface AdminOrganization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  domain?: string | null;
  settings?: Record<string, unknown> | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
  _count: OrganizationCount;
}

export default function OrganizationsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.listOrganizations.useQuery({
    search: search || undefined,
    skip: page * pageSize,
    take: pageSize,
  }) as { data: { organizations: AdminOrganization[]; total: number } | undefined; isLoading: boolean };

  const toggleStatusMutation = trpc.admin.toggleOrganizationStatus.useMutation({
    onSuccess: () => {
      utils.admin.listOrganizations.invalidate();
    },
  });

  const handleToggleStatus = async (id: string, currentlySuspended: boolean) => {
    const willSuspend = !currentlySuspended;
    if (confirm(`Are you sure you want to ${currentlySuspended ? 'activate' : 'suspend'} this organization?`)) {
      toggleStatusMutation.mutate(
        { id, suspend: willSuspend },
        {
          onSuccess: () => {
            toast.success(
              willSuspend
                ? 'Organization suspended successfully'
                : 'Organization activated successfully'
            );
          },
          onError: (error) => {
            toast.error(error.message || 'Failed to update organization status');
          },
        }
      );
    }
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;
  const organizations = data?.organizations ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Organizations</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage all organizations on the platform
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Search Organizations</CardTitle>
          <CardDescription className="text-muted-foreground">
            Filter by name or slug
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-card-foreground">All Organizations</CardTitle>
              <CardDescription className="text-muted-foreground">
                {data ? `${data.total} total organizations` : 'Loading...'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-secondary" />
              ))}
            </div>
          ) : organizations.length > 0 ? (
            <>
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-secondary/50 border-border">
                      <TableHead className="text-muted-foreground">Name</TableHead>
                      <TableHead className="text-muted-foreground">Slug</TableHead>
                      <TableHead className="text-muted-foreground">Users</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Created</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(organizations as AdminOrganization[]).map((org) => {
                      const isSuspended = !!org.deletedAt;
                      return (
                        <TableRow
                          key={org.id}
                          className="hover:bg-secondary/50 border-border"
                        >
                          <TableCell className="font-medium text-card-foreground">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {org.name.charAt(0).toUpperCase()}
                              </div>
                              {org.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <code className="px-2 py-1 rounded bg-secondary text-xs">
                              {org.slug}
                            </code>
                          </TableCell>
                          <TableCell className="text-card-foreground">
                            {org._count.users}
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDistanceToNow(new Date(org.createdAt), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/admin/organizations/${org.id}`} passHref legacyBehavior>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                  asChild
                                >
                                  <a>
                                    <Eye className="h-4 w-4" />
                                  </a>
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={
                                  isSuspended
                                    ? 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                                    : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                                }
                                onClick={() => handleToggleStatus(org.id, isSuspended)}
                                disabled={toggleStatusMutation.isPending}
                              >
                                {isSuspended ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <Ban className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="bg-secondary border-border text-secondary-foreground hover:bg-secondary/80"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="bg-secondary border-border text-secondary-foreground hover:bg-secondary/80"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No organizations found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
