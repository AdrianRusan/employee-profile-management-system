'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FeedbackForm } from '@/components/FeedbackForm';
import { AbsenceRequestDialog } from '@/components/AbsenceRequestDialog';
import {
  Users,
  MessageSquare,
  CalendarDays,
  User,
  Clock,
  Zap,
} from 'lucide-react';
import { Permissions } from '@/lib/permissions';
import type { AppRouter } from '@/server';
import type { inferRouterOutputs } from '@trpc/server';
import { Role } from '@prisma/client';

type RouterOutputs = inferRouterOutputs<AppRouter>;

interface QuickActionsProps {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

/**
 * QuickActions component displays action buttons for common tasks
 * Includes role-specific actions for managers
 */
export function QuickActions({ user }: QuickActionsProps) {
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Check if user is a manager
  const isManager = Permissions.absence.viewAll({ id: user.id, role: user.role, email: user.email });

  // Fetch pending absences count for managers
  const { data: pendingCount } = trpc.absence.getAll.useQuery(
    {},
    {
      enabled: isManager,
      select: (data: RouterOutputs['absence']['getAll']) =>
        data.absenceRequests.filter((absence) => absence.status === 'PENDING').length,
    }
  );

  // Handle feedback button click - open dialog to show user selector
  const handleGiveFeedback = () => {
    setFeedbackDialogOpen(true);
  };

  // Handle user selection from the list
  const handleUserSelect = (userId: string, userName: string) => {
    setSelectedReceiver({ id: userId, name: userName });
  };

  // Reset feedback dialog state
  const handleFeedbackSuccess = () => {
    setFeedbackDialogOpen(false);
    setSelectedReceiver(null);
  };

  const handleFeedbackCancel = () => {
    setSelectedReceiver(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <CardTitle>Quick Actions</CardTitle>
        </div>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Give Feedback */}
          <Button
            variant="outline"
            className="justify-start h-auto py-3"
            onClick={handleGiveFeedback}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Give Feedback</div>
              <div className="text-xs text-gray-500">Share peer feedback</div>
            </div>
          </Button>

          {/* Request Time Off */}
          <AbsenceRequestDialog
            onSuccess={() => {
              // Optional: Add success callback
            }}
          >
            <Button variant="outline" className="justify-start h-auto py-3 w-full">
              <CalendarDays className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Request Time Off</div>
                <div className="text-xs text-gray-500">Submit absence request</div>
              </div>
            </Button>
          </AbsenceRequestDialog>

          {/* View My Profile */}
          <Button variant="outline" className="justify-start h-auto py-3" asChild>
            <Link href={`/dashboard/profiles/${user.id}`}>
              <User className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">View My Profile</div>
                <div className="text-xs text-gray-500">See your details</div>
              </div>
            </Link>
          </Button>

          {/* Browse All Profiles */}
          <Button variant="outline" className="justify-start h-auto py-3" asChild>
            <Link href="/dashboard/profiles">
              <Users className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Browse Profiles</div>
                <div className="text-xs text-gray-500">View all employees</div>
              </div>
            </Link>
          </Button>

          {/* Manager: Pending Approvals */}
          {isManager && (
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <Link href="/dashboard/absences">
                <Clock className="mr-2 h-4 w-4" />
                <div className="text-left flex items-center gap-2">
                  <div>
                    <div className="font-medium">Pending Approvals</div>
                    <div className="text-xs text-gray-500">Review time off requests</div>
                  </div>
                  {pendingCount !== undefined && pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {pendingCount}
                    </Badge>
                  )}
                </div>
              </Link>
            </Button>
          )}
        </div>

        {/* Feedback Dialog with User Selector */}
        <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Give Feedback</DialogTitle>
              <DialogDescription>
                {selectedReceiver
                  ? `Giving feedback to ${selectedReceiver.name}`
                  : 'Select a colleague to give feedback to'}
              </DialogDescription>
            </DialogHeader>

            {!selectedReceiver ? (
              <UserSelector onSelect={handleUserSelect} currentUserId={user.id} />
            ) : (
              <FeedbackForm
                receiverId={selectedReceiver.id}
                receiverName={selectedReceiver.name}
                onSuccess={handleFeedbackSuccess}
                onCancel={handleFeedbackCancel}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

/**
 * UserSelector component for choosing feedback recipient
 */
type InfiniteUserPage = RouterOutputs['user']['getAll'];
type UserData = InfiniteUserPage['users'][number];

function UserSelector({
  onSelect,
  currentUserId,
}: {
  onSelect: (userId: string, userName: string) => void;
  currentUserId: string;
}) {
  const { data: users, isLoading } = trpc.user.getAll.useInfiniteQuery(
    { limit: 50 },
    {
      getNextPageParam: (lastPage: InfiniteUserPage) => lastPage.nextCursor,
    }
  );

  const allUsers =
    users?.pages.flatMap((page: InfiniteUserPage) => page.users).filter((u) => u.id !== currentUserId) || [];

  if (isLoading) {
    return <div className="text-center py-4">Loading users...</div>;
  }

  // Helper to get initials from name
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return names[0].substring(0, 2);
  };

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {allUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No colleagues found</div>
      ) : (
        allUsers.map((user: UserData) => (
          <button
            key={user.id}
            onClick={() =>
              onSelect(user.id, user.name)
            }
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
              {getInitials(user.name)}
            </div>
            <div>
              <div className="font-medium">
                {user.name}
              </div>
              <div className="text-sm text-gray-500">
                {user.title} • {user.department}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
