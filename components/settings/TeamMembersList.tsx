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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Users, Loader2, Trash2, Shield, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export function TeamMembersList() {
  // Get current user session
  const { data: session } = trpc.auth.getCurrentUser.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes - user data rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null);
  const [roleChanging, setRoleChanging] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Fetch all team members
  const { data, isLoading } = trpc.user.getAll.useQuery({
    limit: 100,
  }, {
    staleTime: 2 * 60 * 1000, // 2 minutes - team list can change
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Delete member mutation
  const deleteMutation = trpc.user.softDelete.useMutation({
    onSuccess: () => {
      toast.success('Team member removed successfully');
      utils.user.getAll.invalidate();
      setMemberToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update role mutation
  const updateRoleMutation = trpc.user.updateRole.useMutation({
    onSuccess: () => {
      toast.success('Role updated successfully');
      utils.user.getAll.invalidate();
      setRoleChanging(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setRoleChanging(null);
    },
  });

  const members = data?.users || [];
  const isManager = session?.role === 'MANAGER';

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (newRole !== 'EMPLOYEE' && newRole !== 'MANAGER' && newRole !== 'COWORKER') return;
    setRoleChanging(userId);
    updateRoleMutation.mutate({
      id: userId,
      role: newRole as 'EMPLOYEE' | 'MANAGER' | 'COWORKER',
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            Manage your organization's team members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No team members found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    {isManager && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const isCurrentUser = member.id === session?.id;
                    return (
                      <TableRow key={member.id} className={isCurrentUser ? 'bg-muted/50' : ''}>
                        <TableCell className="font-medium">
                          {member.name}
                          {isCurrentUser && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{member.email}</TableCell>
                        <TableCell>
                          {isManager && !isCurrentUser ? (
                            <Select
                              value={member.role}
                              onValueChange={(value) => handleRoleChange(member.id, value)}
                              disabled={roleChanging === member.id}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                <SelectItem value="MANAGER">Manager</SelectItem>
                                <SelectItem value="COWORKER">Coworker</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant={
                                member.role === 'MANAGER'
                                  ? 'default'
                                  : member.role === 'EMPLOYEE'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {member.role === 'MANAGER' && <Shield className="mr-1 h-3 w-3" />}
                              {member.role}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{member.department || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.createdAt ? format(new Date(member.createdAt), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            Active
                          </Badge>
                        </TableCell>
                        {isManager && (
                          <TableCell className="text-right">
                            {!isCurrentUser && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setMemberToDelete({ id: member.id, name: member.name })}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToDelete?.name} from your organization? This action
              will deactivate their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToDelete && deleteMutation.mutate({ id: memberToDelete.id })}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
