'use client';

import { useState } from 'react';
import { User } from '@prisma/client';
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileEditForm } from '@/components/ProfileEditForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc/Provider';

interface ProfilePageClientProps {
  user: User;
}

/**
 * Client Component - Handles interactive profile features
 * Manages edit dialog state and real-time updates
 */
export function ProfilePageClient({ user }: ProfilePageClientProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Get current user session
  const { data: session } = trpc.auth.getCurrentUser.useQuery();

  if (!session) {
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
          <ProfileCard
            user={user}
            currentUserId={session.id}
            currentUserRole={session.role}
            onEdit={() => setIsEditDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="feedback">
          <div className="text-center py-12 text-muted-foreground">
            <p>Feedback functionality coming in Phase 4</p>
          </div>
        </TabsContent>

        <TabsContent value="absences">
          <div className="text-center py-12 text-muted-foreground">
            <p>Absence management coming in Phase 5</p>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <ProfileEditForm
            user={user}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
