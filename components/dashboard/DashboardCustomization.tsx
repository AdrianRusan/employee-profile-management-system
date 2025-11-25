'use client';

import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

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

interface DashboardCustomizationProps {
  onPreferencesChange?: (preferences: DashboardPreferences) => void;
}

export function DashboardCustomization({ onPreferencesChange }: DashboardCustomizationProps) {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);

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

  const handlePreferenceChange = (key: keyof DashboardPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    localStorage.setItem('dashboard-preferences', JSON.stringify(newPreferences));
    onPreferencesChange?.(newPreferences);
    toast.success('Dashboard updated');
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.setItem('dashboard-preferences', JSON.stringify(DEFAULT_PREFERENCES));
    onPreferencesChange?.(DEFAULT_PREFERENCES);
    toast.success('Preferences reset to default');
  };

  const visibleCount = Object.values(preferences).filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Customize Dashboard
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Dashboard Customization</SheetTitle>
          <SheetDescription>
            Show or hide dashboard widgets to personalize your view. {visibleCount} of 5 widgets visible.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Metrics Card */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="metrics" className="text-base font-medium">
                Key Metrics
              </Label>
              <p className="text-sm text-muted-foreground">
                Your activity statistics and team metrics
              </p>
            </div>
            <Switch
              id="metrics"
              checked={preferences.showMetrics}
              onCheckedChange={(checked) => handlePreferenceChange('showMetrics', checked)}
            />
          </div>

          {/* Feedback Chart */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="feedback-chart" className="text-base font-medium">
                Feedback Chart
              </Label>
              <p className="text-sm text-muted-foreground">
                Visualization of feedback trends over time
              </p>
            </div>
            <Switch
              id="feedback-chart"
              checked={preferences.showFeedbackChart}
              onCheckedChange={(checked) => handlePreferenceChange('showFeedbackChart', checked)}
            />
          </div>

          {/* Absence Chart */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="absence-chart" className="text-base font-medium">
                Absence Chart
              </Label>
              <p className="text-sm text-muted-foreground">
                Breakdown of absence request statuses
              </p>
            </div>
            <Switch
              id="absence-chart"
              checked={preferences.showAbsenceChart}
              onCheckedChange={(checked) => handlePreferenceChange('showAbsenceChart', checked)}
            />
          </div>

          {/* Upcoming Absences */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="upcoming-absences" className="text-base font-medium">
                Upcoming Absences
              </Label>
              <p className="text-sm text-muted-foreground">
                List of your scheduled time off
              </p>
            </div>
            <Switch
              id="upcoming-absences"
              checked={preferences.showUpcomingAbsences}
              onCheckedChange={(checked) => handlePreferenceChange('showUpcomingAbsences', checked)}
            />
          </div>

          {/* Activity Feed */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="activity-feed" className="text-base font-medium">
                Activity Feed
              </Label>
              <p className="text-sm text-muted-foreground">
                Recent activities and updates
              </p>
            </div>
            <Switch
              id="activity-feed"
              checked={preferences.showActivityFeed}
              onCheckedChange={(checked) => handlePreferenceChange('showActivityFeed', checked)}
            />
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={resetPreferences}
              className="w-full"
            >
              Reset to Default
            </Button>
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900">
              <strong>Tip:</strong> Your preferences are saved automatically and will persist across sessions.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
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
