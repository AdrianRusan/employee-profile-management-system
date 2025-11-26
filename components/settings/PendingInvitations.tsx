'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { toast } from 'sonner';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2, RotateCw, X, Clock, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

/**
 * Frontend type definitions for invitation data
 * These types define the shape of data returned from the invitation.list query
 */
interface InvitedBy {
  name: string;
  email: string;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'COWORKER';
  expiresAt: string | Date;
  acceptedAt?: string | Date | null;
  invitedBy: InvitedBy;
}

export function PendingInvitations() {
  const [inviteToCancel, setInviteToCancel] = useState<{ id: string; email: string } | null>(null);

  const utils = trpc.useUtils();

  // Fetch all invitations
  const { data: invitations, isLoading } = trpc.invitation.list.useQuery(undefined, {
    staleTime: 2 * 60 * 1000, // 2 minutes - invitations can change often
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Resend invitation mutation
  const resendMutation = trpc.invitation.resend.useMutation({
    onSuccess: () => {
      toast.success('Invitation resent successfully');
      utils.invitation.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Cancel invitation mutation
  const cancelMutation = trpc.invitation.cancel.useMutation({
    onSuccess: () => {
      toast.success('Invitation cancelled successfully');
      utils.invitation.list.invalidate();
      setInviteToCancel(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Filter pending invitations
  const pendingInvites = ((invitations || []) as TeamInvitation[]).filter((inv) => !inv.acceptedAt);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
          <CardDescription>
            View and manage pending team invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingInvites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending invitations
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Invited By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvites.map((invitation) => {
                    const isExpired = isPast(new Date(invitation.expiresAt));
                    const isAccepted = !!invitation.acceptedAt;

                    return (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">{invitation.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invitation.role === 'MANAGER'
                                ? 'default'
                                : invitation.role === 'EMPLOYEE'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {invitation.role === 'MANAGER' && <Shield className="mr-1 h-3 w-3" />}
                            {invitation.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invitation.invitedBy.name}
                        </TableCell>
                        <TableCell>
                          {isAccepted ? (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              Accepted
                            </Badge>
                          ) : isExpired ? (
                            <Badge variant="outline" className="gap-1">
                              <XCircle className="h-3 w-3 text-destructive" />
                              Expired
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3 text-yellow-500" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {format(new Date(invitation.expiresAt), 'MMM d, yyyy')}
                            </span>
                            <span className="text-xs text-muted-foreground/70">
                              {isExpired
                                ? 'Expired ' + formatDistanceToNow(new Date(invitation.expiresAt)) + ' ago'
                                : 'In ' + formatDistanceToNow(new Date(invitation.expiresAt))}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!isAccepted && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => resendMutation.mutate({ id: invitation.id })}
                                  disabled={resendMutation.isPending}
                                  title="Resend invitation"
                                >
                                  {resendMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RotateCw className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setInviteToCancel({ id: invitation.id, email: invitation.email })
                                  }
                                  disabled={cancelMutation.isPending}
                                  title="Cancel invitation"
                                >
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={!!inviteToCancel} onOpenChange={(open) => !open && setInviteToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation for {inviteToCancel?.email}? They will no
              longer be able to use this invitation link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => inviteToCancel && cancelMutation.mutate({ id: inviteToCancel.id })}
              className="bg-destructive hover:bg-destructive/90"
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Invitation'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
