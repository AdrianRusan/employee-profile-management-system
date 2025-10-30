'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Trash2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';

interface FeedbackListProps {
  userId: string;
}

/**
 * FeedbackList component displays feedback entries for a user
 * Features:
 * - Shows giver name, timestamp, and content
 * - AI Polished badge for enhanced feedback
 * - Expandable to view original vs polished versions
 * - Delete button (visible to giver or managers)
 * - Empty state
 */
export function FeedbackList({ userId }: FeedbackListProps) {
  const { user: currentUser } = useAuthStore();
  const utils = trpc.useUtils();
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  const { data: feedback, isLoading } = trpc.feedback.getForUser.useQuery({
    userId,
  });

  const deleteMutation = trpc.feedback.delete.useMutation({
    onSuccess: () => {
      toast.success('Feedback deleted successfully');
      utils.feedback.getForUser.invalidate({ userId });
      utils.feedback.getGiven.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete feedback');
    },
  });

  const handleDelete = (feedbackId: string) => {
    deleteMutation.mutate({ id: feedbackId });
  };

  const toggleExpand = (feedbackId: string) => {
    setExpandedFeedback(expandedFeedback === feedbackId ? null : feedbackId);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!feedback || feedback.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No feedback yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Be the first to provide constructive feedback to help this person grow and improve.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => {
        const isExpanded = expandedFeedback === item.id;
        const canDelete =
          currentUser?.role === 'MANAGER' || currentUser?.id === item.giverId;
        const displayContent =
          isExpanded && item.isPolished && item.polishedContent
            ? item.polishedContent
            : item.content;

        return (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={item.giver.avatar || undefined} />
                    <AvatarFallback>{getInitials(item.giver.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{item.giver.name}</p>
                      {item.isPolished && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="mr-1 h-3 w-3" />
                          AI Polished
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this feedback? This action cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(item.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{displayContent}</p>

              {item.isPolished && item.polishedContent && (
                <div className="mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(item.id)}
                    className="h-8"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="mr-2 h-4 w-4" />
                        Show Original
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Show Polished Version
                      </>
                    )}
                  </Button>

                  {isExpanded && (
                    <div className="mt-3 p-3 bg-muted rounded-md space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        {isExpanded ? 'Polished Version' : 'Original Version'}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {isExpanded ? item.polishedContent : item.content}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
