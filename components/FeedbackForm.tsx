'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FeedbackFormData, feedbackSchema } from '@/lib/validations/feedback';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { countWords } from '@/lib/utils';

interface FeedbackFormProps {
  receiverId: string;
  receiverName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * FeedbackForm component for submitting feedback with optional AI polishing
 * Features:
 * - Character count (20-2000) and word count (minimum 5 words)
 * - AI polishing with side-by-side comparison
 * - Toggle between original and polished versions
 */
export function FeedbackForm({
  receiverId,
  receiverName,
  onSuccess,
  onCancel,
}: FeedbackFormProps) {
  const utils = trpc.useUtils();
  const [polishedContent, setPolishedContent] = useState<string | null>(null);
  const [usePolished, setUsePolished] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      receiverId,
      content: '',
    },
  });

  const createMutation = trpc.feedback.create.useMutation({
    onSuccess: () => {
      toast.success('Feedback submitted successfully');
      // Invalidate queries to refetch updated data
      utils.feedback.getForUser.invalidate({ userId: receiverId });
      utils.feedback.getGiven.invalidate();
      form.reset();
      setPolishedContent(null);
      setUsePolished(false);
      setShowComparison(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit feedback. Please try again.');
    },
  });

  const polishMutation = trpc.feedback.polishWithAI.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setPolishedContent(data.polished);
        setShowComparison(true);
        toast.success('Feedback polished with AI');
      } else {
        toast.error('error' in data ? data.error : 'Failed to polish feedback');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to polish feedback. Please try again.');
    },
  });

  const handlePolish = () => {
    const content = form.getValues('content');

    if (!content || content.trim().length < 20) {
      toast.error('Please write at least 20 characters before polishing');
      return;
    }

    if (countWords(content.trim()) < 5) {
      toast.error('Please write at least 5 words before polishing');
      return;
    }

    polishMutation.mutate({ content });
  };

  const handleResetPolish = () => {
    setPolishedContent(null);
    setUsePolished(false);
    setShowComparison(false);
  };

  const onSubmit = (data: FeedbackFormData) => {
    createMutation.mutate({
      receiverId: data.receiverId,
      content: data.content, // Always store original
      polishedContent: polishedContent || undefined,
      isPolished: usePolished && !!polishedContent,
    });
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const currentContent = form.watch('content');
  const charCount = currentContent?.trim().length || 0;
  const wordCount = currentContent ? countWords(currentContent.trim()) : 0;
  const isValidLength = charCount >= 20 && charCount <= 2000;
  const isValidWordCount = wordCount >= 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Give Feedback to {receiverName}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Feedback *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts, observations, or suggestions..."
                      className="min-h-[150px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormDescription>
                      Write constructive feedback (minimum 20 characters, 5 words)
                    </FormDescription>
                    <div className="flex items-center gap-3 text-sm">
                      <span
                        className={`${
                          isValidLength
                            ? 'text-muted-foreground'
                            : charCount > 2000
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {charCount} / 2000 chars
                      </span>
                      <span
                        className={`${
                          isValidWordCount
                            ? 'text-muted-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {wordCount} / 5 words
                      </span>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* AI Polish Button */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePolish}
                disabled={!isValidLength || !isValidWordCount || polishMutation.isPending}
              >
                {polishMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Polishing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Polish with AI
                  </>
                )}
              </Button>

              {polishedContent && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetPolish}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>

            {/* AI Polished Version Comparison */}
            {showComparison && polishedContent && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI-Polished Version
                    </CardTitle>
                    <Badge variant={usePolished ? 'default' : 'outline'}>
                      {usePolished ? 'Will Use Polished' : 'Will Use Original'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Polished feedback:</p>
                    <p className="text-sm whitespace-pre-wrap p-3 bg-background rounded-md border">
                      {polishedContent}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={usePolished ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUsePolished(true)}
                    >
                      Use Polished Version
                    </Button>
                    <Button
                      type="button"
                      variant={!usePolished ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUsePolished(false)}
                    >
                      Use Original Version
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Both versions will be saved. You can always see the original feedback.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={!isValidLength || !isValidWordCount || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
