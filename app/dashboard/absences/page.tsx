'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { useAuthStore } from '@/stores/authStore';
import { AbsenceRequestDialog } from '@/components/AbsenceRequestDialog';
import { AbsenceCalendar } from '@/components/AbsenceCalendar';
import { AbsenceTable } from '@/components/AbsenceTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

/**
 * Absences management page
 * Shows user's own absence requests and manager approval interface
 */
export default function AbsencesPage() {
  const { user } = useAuthStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('my-requests');

  const utils = trpc.useUtils();

  // Fetch current user's absences
  const { data: myAbsences, isLoading: myAbsencesLoading } = trpc.absence.getMy.useQuery();

  // Fetch all absences (manager only)
  const { data: allAbsences, isLoading: allAbsencesLoading } = trpc.absence.getAll.useQuery(
    undefined,
    {
      enabled: user?.role === 'MANAGER',
    }
  );

  // Fetch statistics
  const { data: stats } = trpc.absence.getMyStats.useQuery();

  // Delete mutation
  const deleteMutation = trpc.absence.delete.useMutation({
    onSuccess: () => {
      toast.success('Absence request deleted successfully');
      utils.absence.getMy.invalidate();
      utils.absence.getMyStats.invalidate();
      setDeleteDialogOpen(false);
      setSelectedAbsence(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete absence request');
    },
  });

  const handleDelete = (id: string) => {
    setSelectedAbsence(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedAbsence) {
      deleteMutation.mutate({ id: selectedAbsence });
    }
  };

  // Approve/Reject mutations
  const updateStatusMutation = trpc.absence.updateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Absence request ${data.status.toLowerCase()} successfully`);
      utils.absence.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update absence request');
    },
  });

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'APPROVED' });
  };

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'REJECTED' });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Absence Management</h1>
          <p className="text-muted-foreground">
            Manage your time-off requests and view absence calendar
          </p>
        </div>
        <AbsenceRequestDialog>
          <Button>Request Time Off</Button>
        </AbsenceRequestDialog>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Requests</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Approved</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.approved}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Rejected</CardDescription>
              <CardTitle className="text-3xl text-red-600">{stats.rejected}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          {user?.role === 'MANAGER' && (
            <TabsTrigger value="team-requests">Team Requests</TabsTrigger>
          )}
        </TabsList>

        {/* My Requests Tab */}
        <TabsContent value="my-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Absence Requests</CardTitle>
              <CardDescription>
                View and manage your absence requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myAbsencesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <AbsenceTable
                  absences={myAbsences}
                  onDelete={handleDelete}
                  isUpdating={deleteMutation.isPending}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <AbsenceCalendar />
        </TabsContent>

        {/* Team Requests Tab (Manager Only) */}
        {user?.role === 'MANAGER' && (
          <TabsContent value="team-requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Absence Requests</CardTitle>
                <CardDescription>
                  Review and approve absence requests from your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allAbsencesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <AbsenceTable
                    absences={allAbsences}
                    showUser
                    showApproval
                    showActions={false}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isUpdating={updateStatusMutation.isPending}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your absence request. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
