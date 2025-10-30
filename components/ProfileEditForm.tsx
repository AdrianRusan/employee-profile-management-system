'use client';

import { SerializedUser } from '@/lib/types/user';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileFormData, profileSchema } from '@/lib/validations/user';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { AvatarUpload } from './AvatarUpload';

interface ProfileEditFormProps {
  user: SerializedUser;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * ProfileEditForm component for editing non-sensitive profile fields
 * Uses React Hook Form with Zod validation
 */
export function ProfileEditForm({ user, onSuccess, onCancel }: ProfileEditFormProps) {
  const utils = trpc.useUtils();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      title: user.title || '',
      department: user.department || '',
      bio: user.bio || '',
    },
  });

  const updateMutation = trpc.user.update.useMutation({
    onSuccess: () => {
      toast.success('Profile updated successfully');
      // Invalidate queries to refetch updated data
      utils.user.getById.invalidate({ id: user.id });
      utils.user.getAll.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile. Please try again.');
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate({
      id: user.id,
      data,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <AvatarUpload
          userId={user.id}
          currentAvatar={user.avatar}
          userName={user.name}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>Your full name as it will appear on your profile.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormDescription>Your work email address.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Software Engineer" {...field} />
              </FormControl>
              <FormDescription>Your job title or position.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <FormControl>
                <Input placeholder="Engineering" {...field} />
              </FormControl>
              <FormDescription>The department you work in.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little about yourself..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief description about yourself (max 500 characters).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
