'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Eye, Loader2 } from 'lucide-react';
import { isValidRole } from '@/lib/type-guards';

// Table columns definition
// Note: These columns only access public fields that are always present
// regardless of user role (public or sensitive select)
const columns: ColumnDef<{
  id: string;
  name: string;
  email: string;
  department: string | null;
  title: string | null;
  role: string;
  // Allow additional fields for managers (sensitive fields)
  salary?: string | null;
  ssn?: string | null;
  address?: string | null;
  performanceRating?: string | null;
  [key: string]: unknown;
}>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.getValue('email')}</div>,
  },
  {
    accessorKey: 'department',
    header: 'Department',
    cell: ({ row }) => row.getValue('department') || '-',
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => row.getValue('title') || '-',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const roleValue = row.getValue('role');
      // Validate role is a valid string
      if (typeof roleValue !== 'string') {
        return <Badge variant="outline">Unknown</Badge>;
      }
      const role = roleValue;
      const variant =
        role === 'MANAGER' ? 'default' : role === 'EMPLOYEE' ? 'secondary' : 'outline';
      return <Badge variant={variant}>{role}</Badge>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/profiles/${user.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </Link>
          </Button>
        </div>
      );
    },
  },
];

/**
 * Profiles List Page
 * Displays all users in a sortable, filterable data table
 */
export default function ProfilesPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Fetch all users
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.user.getAll.useInfiniteQuery(
      {
        limit: 20,
        search: globalFilter || undefined,
        department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
        role:
          selectedRole !== 'all' && isValidRole(selectedRole)
            ? selectedRole
            : undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  // Fetch departments for filter (static data - cache for 30 minutes)
  const { data: departments } = trpc.user.getDepartments.useQuery(undefined, {
    staleTime: 30 * 60 * 1000, // 30 minutes - departments rarely change
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  // Flatten paginated data
  const users = data?.pages.flatMap((page) => page.users) ?? [];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: users as Array<{
      id: string;
      name: string;
      email: string;
      department: string | null;
      title: string | null;
      role: string;
      salary?: string | null;
      ssn?: string | null;
      address?: string | null;
      performanceRating?: string | null;
      [key: string]: unknown;
    }>, // Type assertion: users can have public or sensitive fields, but columns only use public fields
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Employee Profiles</h1>
        <p className="text-muted-foreground mt-2">
          View and manage employee profiles across your organization
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments?.map((dept) => (
              <SelectItem key={dept || 'unknown'} value={dept || ''}>
                {dept || 'Unknown'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="EMPLOYEE">Employee</SelectItem>
            <SelectItem value="COWORKER">Coworker</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* Results summary */}
      <div className="mt-4 text-sm text-muted-foreground text-center">
        Showing {users.length} employee{users.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
