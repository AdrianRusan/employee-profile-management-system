'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays, addWeeks, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar as CalendarIcon, Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';
import { absenceRequestFormSchema, type AbsenceRequestFormInput } from '@/lib/validations/absence';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AbsenceRequestDialogProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

/**
 * Dialog component for creating absence requests
 * Includes date range picker and reason textarea
 */
export function AbsenceRequestDialog({ children, onSuccess }: AbsenceRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  // Helper to get normalized date (today at midnight)
  const getTodayNormalized = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const form = useForm<AbsenceRequestFormInput>({
    resolver: zodResolver(absenceRequestFormSchema),
    defaultValues: {
      startDate: getTodayNormalized(),
      endDate: getTodayNormalized(),
      reason: '',
    },
  });

  const createMutation = trpc.absence.create.useMutation({
    onSuccess: () => {
      toast.success('Absence request created successfully!');
      form.reset({
        startDate: getTodayNormalized(),
        endDate: getTodayNormalized(),
        reason: '',
      });
      setOpen(false);

      // Invalidate queries to refresh data
      utils.absence.getMy.invalidate();
      utils.absence.getMyStats.invalidate();

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create absence request');
    },
  });

  const onSubmit = (data: AbsenceRequestFormInput) => {
    createMutation.mutate(data);
  };

  // Quick date preset functions
  const applyDatePreset = (preset: string) => {
    const today = getTodayNormalized();
    let startDate = today;
    let endDate = today;

    switch (preset) {
      case 'tomorrow':
        startDate = addDays(today, 1);
        endDate = addDays(today, 1);
        break;
      case 'next-week':
        startDate = addDays(today, 7);
        endDate = addDays(today, 11); // 5 business days
        break;
      case 'two-weeks':
        startDate = addDays(today, 7);
        endDate = addDays(today, 18); // 10 business days
        break;
      case 'this-week':
        startDate = today;
        endDate = endOfWeek(today, { weekStartsOn: 1 }); // Monday to Friday
        break;
      case 'next-month':
        const nextMonth = addDays(today, 30);
        startDate = startOfMonth(nextMonth);
        endDate = endOfMonth(nextMonth);
        break;
    }

    form.setValue('startDate', startDate);
    form.setValue('endDate', endDate);
    toast.success(`Dates set: ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`);
  };

  // Reset form when dialog opens to ensure dates are always current
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      form.reset({
        startDate: getTodayNormalized(),
        endDate: getTodayNormalized(),
        reason: '',
      });
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            Request Time Off
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Request Time Off</DialogTitle>
          <DialogDescription>
            Submit an absence request for manager approval. Please provide the date range and reason for your absence.
          </DialogDescription>
        </DialogHeader>

        {/* Quick Date Presets */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
            <span className="text-sm font-medium text-foreground">Quick Presets</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyDatePreset('tomorrow')}
            >
              Tomorrow
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyDatePreset('next-week')}
            >
              Next Week (5 days)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyDatePreset('two-weeks')}
            >
              Next 2 Weeks
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      The first day of your absence
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      The last day of your absence
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide a reason for your absence request..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0} / 500 characters (minimum 10)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
