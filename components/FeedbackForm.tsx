'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Loader2, Sparkles, RefreshCw, FileText, Save, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { countWords } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FeedbackFormProps {
  receiverId: string;
  receiverName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Feedback templates for common scenarios
const FEEDBACK_TEMPLATES = [
  {
    name: 'Positive Collaboration',
    content: 'I really appreciated your collaboration on [project/task]. Your [specific contribution] made a significant difference. Keep up the great work!',
  },
  {
    name: 'Growth Opportunity',
    content: 'I noticed an opportunity for growth in [area]. Specifically, [observation]. I think focusing on [suggestion] could be beneficial.',
  },
  {
    name: 'Technical Skills',
    content: 'Your technical skills in [technology/area] were impressive during [project/situation]. I particularly valued [specific skill].',
  },
  {
    name: 'Communication',
    content: 'Your communication during [meeting/project] was [positive aspect]. This helped the team [outcome]. Thank you!',
  },
  {
    name: 'Problem Solving',
    content: 'I was impressed by how you approached [problem/challenge]. Your [approach/solution] demonstrated strong problem-solving skills.',
  },
];

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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      receiverId,
      content: '',
    },
  });

  // Auto-save draft to localStorage
  const saveDraft = useCallback((content: string) => {
    if (content.trim().length > 0) {
      const draftKey = `feedback-draft-${receiverId}`;
      localStorage.setItem(draftKey, content);
      setLastSaved(new Date());
      setIsSaving(false);
    }
  }, [receiverId]);

  // Load draft on mount
  useEffect(() => {
    const draftKey = `feedback-draft-${receiverId}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      form.setValue('content', savedDraft);
      toast.info('Draft restored');
    }
  }, [receiverId, form]);

  // Auto-save with debounce
  useEffect(() => {
    const content = form.watch('content');
    if (!content || content.trim().length === 0) return;

    setIsSaving(true);
    const timeoutId = setTimeout(() => {
      saveDraft(content);
    }, 2000); // Save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [form.watch('content'), saveDraft]);

  // Clear draft on successful submission
  const clearDraft = useCallback(() => {
    const draftKey = `feedback-draft-${receiverId}`;
    localStorage.removeItem(draftKey);
    setLastSaved(null);
  }, [receiverId]);

  // Apply template
  const applyTemplate = useCallback((template: string) => {
    form.setValue('content', template);
    toast.success('Template applied');
  }, [form]);

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
      clearDraft(); // Clear draft on successful submission
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit feedback. Please try again.');
    },
  });

  const polishMutation = trpc.feedback.polishWithAI.useMutation({
    onSuccess: (data) => {
      if ('polishedContent' in data) {
        setPolishedContent(data.polishedContent || null);
        setShowComparison(true);
        toast.success('Feedback polished with AI');
      } else if ('isPolished' in data && data.polishedContent) {
        setPolishedContent(data.polishedContent || null);
        setShowComparison(true);
        toast.success('Feedback polished with AI');
      } else {
        toast.error('Failed to polish feedback');
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
        <div className="flex items-center justify-between">
          <CardTitle>Give Feedback to {receiverName}</CardTitle>
          <div className="flex items-center gap-2">
            {/* Auto-save indicator */}
            {lastSaved && (
              <Badge variant="outline" className="text-xs">
                <Save className="mr-1 h-3 w-3" />
                {isSaving ? 'Saving...' : 'Saved'}
              </Badge>
            )}
            {/* Template dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Use Template
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Feedback Templates</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {FEEDBACK_TEMPLATES.map((template) => (
                  <DropdownMenuItem
                    key={template.name}
                    onClick={() => applyTemplate(template.content)}
                    className="flex flex-col items-start"
                  >
                    <span className="font-medium">{template.name}</span>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {template.content.substring(0, 60)}...
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Your Feedback *</FormLabel>
                    {isValidLength && isValidWordCount && (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Valid
                      </Badge>
                    )}
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Textarea
                        placeholder="Share your thoughts, observations, or suggestions..."
                        className={`min-h-[150px] resize-y transition-colors ${
                          charCount > 0 && isValidLength && isValidWordCount
                            ? 'border-green-300 focus-visible:ring-green-500'
                            : charCount > 0 && (charCount > 2000 || (charCount >= 20 && !isValidWordCount))
                            ? 'border-orange-300 focus-visible:ring-orange-500'
                            : ''
                        }`}
                        {...field}
                      />
                      {charCount > 0 && (
                        <div className="absolute bottom-2 right-2 pointer-events-none">
                          {isValidLength && isValidWordCount ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : charCount >= 20 && !isValidWordCount ? (
                            <Info className="h-5 w-5 text-orange-500" />
                          ) : charCount > 2000 ? (
                            <AlertCircle className="h-5 w-5 text-destructive" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormDescription className="flex items-center gap-2">
                      {charCount === 0 && (
                        <>Write constructive feedback (minimum 20 characters, 5 words)</>
                      )}
                      {charCount > 0 && charCount < 20 && (
                        <span className="text-muted-foreground">
                          {20 - charCount} more characters needed
                        </span>
                      )}
                      {charCount >= 20 && !isValidWordCount && (
                        <span className="text-orange-600 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          {5 - wordCount} more words needed
                        </span>
                      )}
                      {isValidLength && isValidWordCount && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Looks good!
                        </span>
                      )}
                    </FormDescription>
                    <div className="flex items-center gap-3 text-sm">
                      <span
                        className={`${
                          isValidLength
                            ? 'text-green-600'
                            : charCount > 2000
                            ? 'text-destructive'
                            : charCount >= 20
                            ? 'text-orange-600'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {charCount} / 2000
                      </span>
                      <span
                        className={`${
                          isValidWordCount
                            ? 'text-green-600'
                            : wordCount > 0
                            ? 'text-orange-600'
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
