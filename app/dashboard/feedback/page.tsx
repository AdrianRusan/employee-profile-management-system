'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, ChevronDown, ChevronUp, MessageSquare, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';
import { Feedback, User } from '@prisma/client';

type FeedbackWithUser = Omit<Feedback, 'createdAt' | 'updatedAt'> & {
  giver?: Partial<User> | null;
  receiver?: Partial<User> | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

/**
 * Dedicated Feedback Page
 * Shows all feedback received and given by the current user
 * Features filtering, sorting, and detailed feedback view
 */
export default function FeedbackPage() {
  const { user: currentUser } = useAuthStore();
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');

  const { data: receivedFeedback, isLoading: isLoadingReceived } =
    trpc.feedback.getReceived.useQuery();

  const { data: givenFeedback, isLoading: isLoadingGiven } =
    trpc.feedback.getGiven.useQuery();

  const { data: stats } = trpc.feedback.getStats.useQuery({
    userId: currentUser?.id || '',
  });

  const toggleExpand = (feedbackId: string) => {
    setExpandedFeedback(expandedFeedback === feedbackId ? null : feedbackId);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    return parts
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sortFeedback = <T extends { id: string; createdAt: Date | string }>(feedback: T[]): T[] => {
    return [...feedback].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'recent' ? dateB - dateA : dateA - dateB;
    });
  };

  const renderFeedbackCard = (
    item: FeedbackWithUser,
    type: 'received' | 'given',
    isExpanded: boolean
  ) => {
    const displayPerson = type === 'received' ? item.giver : item.receiver;
    const displayContent =
      isExpanded && item.isPolished && item.polishedContent
        ? item.polishedContent
        : item.content;

    if (!displayPerson) {
      return null;
    }

    return (
      <Card key={item.id}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={displayPerson.avatar || undefined} />
                <AvatarFallback>{getInitials(displayPerson.name || 'Unknown')}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{displayPerson.name || 'Unknown User'}</p>
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
                    Original Version
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (type: 'received' | 'given') => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          {type === 'received' ? (
            <>
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No feedback received yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                When your colleagues provide feedback, it will appear here.
              </p>
            </>
          ) : (
            <>
              <Send className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No feedback given yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Start providing constructive feedback to your colleagues to help them grow.
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderLoadingSkeleton = () => (
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

  if (!currentUser) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Feedback</h1>
        <p className="text-muted-foreground">
          View and manage feedback you&apos;ve received and given
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.received}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Given
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.given}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                AI Polished
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{stats.polished}</div>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Sort by:</label>
          <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as 'recent' | 'oldest')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Feedback Tabs */}
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="received">
            Received ({receivedFeedback?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="given">Given ({givenFeedback?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <div className="space-y-4">
            {isLoadingReceived ? (
              renderLoadingSkeleton()
            ) : !receivedFeedback || receivedFeedback.length === 0 ? (
              renderEmptyState('received')
            ) : (
              sortFeedback(receivedFeedback).map((item) =>
                renderFeedbackCard(item, 'received', expandedFeedback === item.id)
              )
            )}
          </div>
        </TabsContent>

        <TabsContent value="given">
          <div className="space-y-4">
            {isLoadingGiven ? (
              renderLoadingSkeleton()
            ) : !givenFeedback || givenFeedback.length === 0 ? (
              renderEmptyState('given')
            ) : (
              sortFeedback(givenFeedback).map((item) =>
                renderFeedbackCard(item, 'given', expandedFeedback === item.id)
              )
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
