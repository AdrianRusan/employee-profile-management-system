'use client';

import { useState } from 'react';
import { SerializedUser } from '@/lib/types/user';
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileEditForm } from '@/components/ProfileEditForm';
import { FeedbackForm } from '@/components/FeedbackForm';
import { FeedbackList } from '@/components/FeedbackList';
import { AbsenceCalendar } from '@/components/AbsenceCalendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc/Provider';
import { Permissions } from '@/lib/permissions';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ProfilePageClientProps {
  user: SerializedUser;
}

/**
 * Client Component - Handles interactive profile features
 * Manages edit dialog state and real-time updates
 */
export function ProfilePageClient({ user }: ProfilePageClientProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Get current user session
  const { data: session } = trpc.auth.getCurrentUser.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes - user data rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  if (!session || !user) {
    return <div>Loading...</div>;
  }

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
  };

  return (
    <>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="absences">Absences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ErrorBoundary level="component">
            <ProfileCard
              user={user}
              currentUserId={session.id}
              currentUserRole={session.role}
              onEdit={() => setIsEditDialogOpen(true)}
            />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="feedback">
          <div className="space-y-6">
            {/* Show feedback form if current user can give feedback and viewing another user profile - using centralized permissions */}
            {Permissions.feedback.give(session, user) && (
              <ErrorBoundary level="component">
                <FeedbackForm
                  receiverId={user.id}
                  receiverName={user.name}
                  onSuccess={() => {
                    // Feedback list will automatically refresh via query invalidation
                  }}
                />
              </ErrorBoundary>
            )}

            {/* Show feedback list if user can view feedback - using centralized permissions */}
            {Permissions.feedback.viewForUser(session, user.id) && (
              <ErrorBoundary level="component">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {session.id === user.id ? 'Your Feedback' : `Feedback for ${user.name}`}
                  </h3>
                  <FeedbackList userId={user.id} />
                </div>
              </ErrorBoundary>
            )}

            {/* Show message if user cannot view feedback - using centralized permissions */}
            {!Permissions.feedback.viewForUser(session, user.id) && (
              <div className="text-center py-12 text-muted-foreground">
                <p>You do not have permission to view feedback for this user.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="absences">
          <div className="space-y-6">
            {/* Show absence calendar if user can view absences (manager or self) - using centralized permissions */}
            {Permissions.absence.viewForUser(session, user.id) ? (
              <ErrorBoundary level="component">
                <AbsenceCalendar userId={user.id} />
              </ErrorBoundary>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>You do not have permission to view absence requests for this user.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile information. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <ErrorBoundary level="component">
            <ProfileEditForm
              user={user}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </ErrorBoundary>
        </DialogContent>
      </Dialog>
    </>
  );
}
