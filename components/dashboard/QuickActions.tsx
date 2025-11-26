'use client';

import { useState, useEffect, useRef } from 'react';
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
  Sparkles,
} from 'lucide-react';
import { Permissions } from '@/lib/permissions';
import type { AppRouter } from '@/server';
import type { inferRouterOutputs } from '@trpc/server';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types/user';

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
  const absenceDialogTriggerRef = useRef<HTMLButtonElement>(null);

  // Check if user is a manager
  const isManager = Permissions.absence.viewAll({ id: user.id, role: user.role, email: user.email });

  // Fetch pending absences count for managers
  const { data: pendingCount } = trpc.absence.getAll.useQuery(
    {},
    {
      enabled: isManager,
      select: (data: RouterOutputs['absence']['getAll']) =>
        data.absences.filter((absence: any) => absence.status === 'PENDING').length,
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

  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleShortcutAction = (e: Event) => {
      const customEvent = e as CustomEvent<{ action: string }>;
      const { action } = customEvent.detail;

      if (action === 'new-feedback') {
        handleGiveFeedback();
      } else if (action === 'new-absence') {
        absenceDialogTriggerRef.current?.click();
      }
    };

    window.addEventListener('keyboard-shortcut-action', handleShortcutAction);
    return () => {
      window.removeEventListener('keyboard-shortcut-action', handleShortcutAction);
    };
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Give Feedback */}
          <Button
            variant="outline"
            className="group justify-between h-auto py-3 px-4 transition-all duration-200 hover:shadow-md hover:border-primary/30"
            onClick={handleGiveFeedback}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <MessageSquare className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-left">
                <div className="font-medium">Give Feedback</div>
                <div className="text-xs text-muted-foreground">Share peer feedback</div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-0.5">
              <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground">N</kbd>
              <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground">F</kbd>
            </div>
          </Button>

          {/* Request Time Off */}
          <AbsenceRequestDialog
            onSuccess={() => {
              // Optional: Add success callback
            }}
          >
            <Button
              ref={absenceDialogTriggerRef}
              variant="outline"
              className="group justify-between h-auto py-3 px-4 w-full transition-all duration-200 hover:shadow-md hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <CalendarDays className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Request Time Off</div>
                  <div className="text-xs text-muted-foreground">Submit absence request</div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-0.5">
                <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground">N</kbd>
                <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground">A</kbd>
              </div>
            </Button>
          </AbsenceRequestDialog>

          {/* View My Profile */}
          <Button variant="outline" className="group justify-start h-auto py-3 px-4" asChild>
            <Link href={`/dashboard/profiles/${user.id}`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors mr-3">
                <User className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-left">
                <div className="font-medium">View My Profile</div>
                <div className="text-xs text-muted-foreground">See your details</div>
              </div>
            </Link>
          </Button>

          {/* Browse All Profiles */}
          <Button variant="outline" className="group justify-between h-auto py-3 px-4" asChild>
            <Link href="/dashboard/profiles">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Users className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Browse Profiles</div>
                  <div className="text-xs text-muted-foreground">View all employees</div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-0.5">
                <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground">G</kbd>
                <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground">P</kbd>
              </div>
            </Link>
          </Button>

          {/* Manager: Pending Approvals */}
          {isManager && (
            <Button variant="outline" className="group justify-between h-auto py-3 px-4 sm:col-span-2" asChild>
              <Link href="/dashboard/absences">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                    pendingCount && pendingCount > 0
                      ? 'bg-rose-500/10 group-hover:bg-rose-500/20'
                      : 'bg-gray-500/10 group-hover:bg-gray-500/20'
                  )}>
                    <Clock className={cn(
                      'h-4 w-4',
                      pendingCount && pendingCount > 0 ? 'text-rose-500' : 'text-gray-500'
                    )} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium flex items-center gap-2">
                      Pending Approvals
                      {pendingCount !== undefined && pendingCount > 0 && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                          {pendingCount}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">Review time off requests</div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-0.5">
                  <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground">G</kbd>
                  <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground">A</kbd>
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
    return <div className="text-center py-4 text-muted-foreground">Loading users...</div>;
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
        <div className="text-center py-8 text-muted-foreground">No colleagues found</div>
      ) : (
        allUsers.map((user: UserData) => (
          <button
            key={user.id}
            onClick={() =>
              onSelect(user.id, user.name)
            }
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
              {getInitials(user.name)}
            </div>
            <div>
              <div className="font-medium">
                {user.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {user.title} • {user.department}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
