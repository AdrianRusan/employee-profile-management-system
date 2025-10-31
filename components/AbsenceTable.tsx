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
import { CalendarIcon, MoreHorizontal, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { AbsenceRequest, User } from '@prisma/client';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface AbsenceWithUser extends Omit<AbsenceRequest, 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> {
  user?: Partial<User> | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  startDate: string | Date;
  endDate: string | Date;
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

  const config = statusConfig[status as keyof typeof statusConfig] || {
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
      <div className="text-center py-12 text-muted-foreground">
        <CalendarIcon className="mx-auto h-12 w-12 opacity-20 mb-4" />
        <p>No absence requests found</p>
      </div>
    );
  }

  return (
    <Table>
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
  );
}
