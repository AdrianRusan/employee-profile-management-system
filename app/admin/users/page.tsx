'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Type for user with organization from admin.listAllUsers
// Note: Dates are serialized as strings over tRPC
type UserWithOrganization = {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'COWORKER';
  department: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION';
  lastLoginAt: string | null;
  createdAt: string;
  organization: {
    name: string;
    slug: string;
  };
};

export default function AllUsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading } = trpc.admin.listAllUsers.useQuery({
    search: search || undefined,
    role: role ? (role as 'EMPLOYEE' | 'MANAGER' | 'COWORKER') : undefined,
    skip: page * pageSize,
    take: pageSize,
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">All Users</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          View and manage users across all organizations
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Search Users</CardTitle>
          <CardDescription className="text-muted-foreground">
            Filter by name, email, or role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Select
              value={role}
              onValueChange={(value) => {
                setRole(value);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px] bg-input border-border text-foreground">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-popover-foreground">
                  All Roles
                </SelectItem>
                <SelectItem value="EMPLOYEE" className="text-popover-foreground">
                  Employee
                </SelectItem>
                <SelectItem value="MANAGER" className="text-popover-foreground">
                  Manager
                </SelectItem>
                <SelectItem value="COWORKER" className="text-popover-foreground">
                  Coworker
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-card-foreground">Users</CardTitle>
              <CardDescription className="text-muted-foreground">
                {data ? `${data.total} total users` : 'Loading...'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-secondary" />
              ))}
            </div>
          ) : data && data.users.length > 0 ? (
            <>
              <div className="rounded-md border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-secondary/50 border-border">
                      <TableHead className="text-muted-foreground">Name</TableHead>
                      <TableHead className="text-muted-foreground">Email</TableHead>
                      <TableHead className="text-muted-foreground">Organization</TableHead>
                      <TableHead className="text-muted-foreground">Role</TableHead>
                      <TableHead className="text-muted-foreground">Department</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Last Login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data.users as UserWithOrganization[]).map((user) => (
                      <TableRow
                        key={user.id}
                        className="hover:bg-secondary/50 border-border"
                      >
                        <TableCell className="font-medium text-card-foreground">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            {user.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell className="text-card-foreground">
                          {user.organization.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.role === 'MANAGER'
                                ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                                : user.role === 'COWORKER'
                                ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                                : 'border-border bg-secondary/50 text-muted-foreground'
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.department || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.status === 'ACTIVE'
                                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                                : user.status === 'INACTIVE'
                                ? 'border-red-500/30 bg-red-500/10 text-red-400'
                                : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                            }
                          >
                            {user.status}
                          </Badge>
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
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
