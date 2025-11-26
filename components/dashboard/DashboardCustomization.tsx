'use client';

import { useState, useEffect, useCallback, type ElementType } from 'react';
import {
  Settings,
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  CalendarClock,
  Activity,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface DashboardPreferences {
  showMetrics: boolean;
  showFeedbackChart: boolean;
  showAbsenceChart: boolean;
  showUpcomingAbsences: boolean;
  showActivityFeed: boolean;
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  showMetrics: true,
  showFeedbackChart: true,
  showAbsenceChart: true,
  showUpcomingAbsences: true,
  showActivityFeed: true,
};

interface WidgetConfig {
  key: keyof DashboardPreferences;
  label: string;
  description: string;
  icon: ElementType;
  color: string;
}

const WIDGET_CONFIGS: WidgetConfig[] = [
  {
    key: 'showMetrics',
    label: 'Key Metrics',
    description: 'Activity statistics and team performance',
    icon: LayoutDashboard,
    color: 'text-blue-500',
  },
  {
    key: 'showFeedbackChart',
    label: 'Feedback Chart',
    description: 'Visualize feedback trends over time',
    icon: MessageSquare,
    color: 'text-emerald-500',
  },
  {
    key: 'showAbsenceChart',
    label: 'Absence Chart',
    description: 'Request status breakdown',
    icon: CalendarDays,
    color: 'text-amber-500',
  },
  {
    key: 'showUpcomingAbsences',
    label: 'Upcoming Absences',
    description: 'Your scheduled time off',
    icon: CalendarClock,
    color: 'text-purple-500',
  },
  {
    key: 'showActivityFeed',
    label: 'Activity Feed',
    description: 'Recent activities and updates',
    icon: Activity,
    color: 'text-rose-500',
  },
];

interface DashboardCustomizationProps {
  onPreferencesChange?: (preferences: DashboardPreferences) => void;
}

export function DashboardCustomization({ onPreferencesChange }: DashboardCustomizationProps) {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [hasChanges, setHasChanges] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('dashboard-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
        onPreferencesChange?.(parsed);
      } catch {
        // Invalid preferences in localStorage, use defaults
      }
    }
  }, []);

  const handlePreferenceChange = useCallback((key: keyof DashboardPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    localStorage.setItem('dashboard-preferences', JSON.stringify(newPreferences));
    onPreferencesChange?.(newPreferences);
    setHasChanges(true);
  }, [preferences, onPreferencesChange]);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.setItem('dashboard-preferences', JSON.stringify(DEFAULT_PREFERENCES));
    onPreferencesChange?.(DEFAULT_PREFERENCES);
    setHasChanges(false);
    toast.success('Preferences reset to default');
  }, [onPreferencesChange]);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && hasChanges) {
      toast.success('Dashboard updated');
      setHasChanges(false);
    }
  }, [hasChanges]);

  const visibleCount = Object.values(preferences).filter(Boolean).length;
  const allVisible = visibleCount === WIDGET_CONFIGS.length;
  const noneVisible = visibleCount === 0;

  // Keyboard shortcut to open (Shift + D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D' && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 group hover:border-primary/50 transition-colors"
        >
          <Settings className="h-4 w-4 transition-transform group-hover:rotate-90 duration-300" />
          <span className="hidden sm:inline">Customize</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Customize Dashboard</DialogTitle>
              <DialogDescription className="text-sm">
                Toggle widgets to personalize your view
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Widget Count Indicator */}
        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50 border">
          <span className="text-sm text-muted-foreground">Widgets visible</span>
          <Badge
            variant={noneVisible ? 'destructive' : allVisible ? 'default' : 'secondary'}
            className="font-mono"
          >
            {visibleCount} / {WIDGET_CONFIGS.length}
          </Badge>
        </div>

        {/* Widget List */}
        <div className="space-y-2 py-2">
          {WIDGET_CONFIGS.map((widget, index) => {
            const Icon = widget.icon;
            const isEnabled = preferences[widget.key];

            return (
              <div
                key={widget.key}
                className={cn(
                  'group flex items-center gap-4 p-3 rounded-lg border transition-all duration-200 cursor-pointer',
                  isEnabled
                    ? 'bg-card border-border hover:border-primary/30 hover:shadow-sm'
                    : 'bg-muted/30 border-transparent hover:bg-muted/50'
                )}
                onClick={() => handlePreferenceChange(widget.key, !isEnabled)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isEnabled ? 'bg-primary/10' : 'bg-muted'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      isEnabled ? widget.color : 'text-muted-foreground'
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'font-medium text-sm transition-colors',
                        isEnabled ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {widget.label}
                    </span>
                    {isEnabled && (
                      <Check className="h-3.5 w-3.5 text-primary animate-in fade-in zoom-in duration-200" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {widget.description}
                  </p>
                </div>

                {/* Switch */}
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked: boolean) => handlePreferenceChange(widget.key, checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0"
                />
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetPreferences}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to default
          </Button>
          <Button
            size="sm"
            onClick={() => handleOpenChange(false)}
            className="gap-2"
          >
            Done
          </Button>
        </DialogFooter>

        {/* Keyboard Shortcut Hint */}
        <div className="flex items-center justify-center gap-1.5 pt-2 border-t">
          <span className="text-xs text-muted-foreground">Press</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            Shift
          </kbd>
          <span className="text-xs text-muted-foreground">+</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            D
          </kbd>
          <span className="text-xs text-muted-foreground">to open</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export a hook to get current preferences
export function useDashboardPreferences(): DashboardPreferences {
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const savedPreferences = localStorage.getItem('dashboard-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
      } catch {
        // Invalid preferences in localStorage, use defaults
      }
    }
  }, []);

  return preferences;
}
