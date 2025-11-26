import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalendarDays, MoreHorizontal, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { EmptyState } from '@/components/EmptyState';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Frontend-only type definitions for absence data
 * These decouple the UI from Prisma schema
 */
interface AbsenceUser {
  id?: string;
  name?: string | null;
  email?: string;
  department?: string | null;
  title?: string | null;
  avatar?: string | null;
}

interface AbsenceWithUser {
  id: string;
  userId: string;
  status: string;
  startDate: string | Date;
  endDate: string | Date;
  reason: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | null;
  organizationId?: string;
  user?: AbsenceUser | null;
}

interface AbsenceTableProps {
  absences: AbsenceWithUser[] | undefined;
  showUser?: boolean;
  showActions?: boolean;
  showApproval?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
  isUpdating?: boolean;
}

function getStatusBadge(status: string) {
  const statusConfig = {
    PENDING: { label: 'Pending', variant: 'secondary' as const },
    APPROVED: { label: 'Approved', variant: 'default' as const },
    REJECTED: { label: 'Rejected', variant: 'destructive' as const },
  };

  // Type guard to check if status is a valid key
  const isValidStatus = (s: string): s is keyof typeof statusConfig => {
    return s in statusConfig;
  };

  const config = isValidStatus(status)
    ? statusConfig[status]
    : {
        label: status,
        variant: 'secondary' as const,
      };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function AbsenceTable({
  absences,
  showUser = false,
  showActions = true,
  showApproval = false,
  onApprove,
  onReject,
  onDelete,
  isUpdating = false,
}: AbsenceTableProps) {
  if (!absences || absences.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No absence requests found"
        description="There are no absence requests to display at the moment."
      />
    );
  }

  return (
    <div className="table-scroll-container">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            {showUser && <TableHead>Employee</TableHead>}
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            {(showActions || showApproval) && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {absences.map((absence) => {
            const startDate = new Date(absence.startDate);
            const endDate = new Date(absence.endDate);
            // Normalize to midnight to ensure whole-day inclusive counting
            const startMidnight = new Date(startDate);
            startMidnight.setHours(0, 0, 0, 0);
            const endMidnight = new Date(endDate);
            endMidnight.setHours(0, 0, 0, 0);
            const duration =
              Math.floor((endMidnight.getTime() - startMidnight.getTime()) / MS_PER_DAY) + 1;

            return (
              <TableRow key={absence.id}>
                {showUser && (
                  <TableCell className="font-medium">
                    <div>
                      <div>{absence.user?.name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {absence.user?.department ?? ''}
                      </div>
                    </div>
                  </TableCell>
                )}
                <TableCell>{format(startDate, 'PPP')}</TableCell>
                <TableCell>{format(endDate, 'PPP')}</TableCell>
                <TableCell>
                  {duration} {duration === 1 ? 'day' : 'days'}
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate" title={absence.reason}>
                    {absence.reason}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(absence.status)}</TableCell>
                {(showActions || showApproval) && (
                  <TableCell className="text-right">
                    {showApproval && absence.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onApprove?.(absence.id)}
                          disabled={isUpdating}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onReject?.(absence.id)}
                          disabled={isUpdating}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : showActions && absence.status === 'PENDING' ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete?.(absence.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Request
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
