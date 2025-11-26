'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc/Provider';
import { toast } from 'sonner';
import { Building2, Upload, Globe, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface OrganizationStepProps {
  onNext: () => void;
  onBack: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

export function OrganizationStep({ onNext, onBack, onUpdate }: OrganizationStepProps) {
  const [timezone, setTimezone] = useState('America/New_York');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const updateSettings = trpc.organization.updateSettings.useMutation({
    onSuccess: () => {
      toast.success('Organization settings saved');
      onUpdate({ timezone, description, logo: logoUrl });
      onNext();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to save settings');
    },
  });

  const handleContinue = () => {
    updateSettings.mutate({
      logo: logoUrl || undefined,
      settings: {
        timezone,
        description,
      },
    });
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 mb-2">
          <Building2 className="h-6 w-6 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Organization Profile</h2>
        <p className="text-sm text-muted-foreground">
          Customize your organization settings (optional)
        </p>
      </div>

      <div className="space-y-5">
        {/* Logo Upload */}
        <div className="space-y-2">
          <Label htmlFor="logo" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Organization Logo (Optional)
          </Label>
          <Input
            id="logo"
            type="url"
            placeholder="https://example.com/logo.png"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="transition-all"
          />
          <p className="text-xs text-muted-foreground">
            Enter a URL to your organization&apos;s logo
          </p>
          {logoUrl && (
            <Card className="mt-3">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Logo Preview:</p>
                <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="max-h-20 max-w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      toast.error('Failed to load logo image');
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label htmlFor="timezone" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Timezone
          </Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="timezone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Organization Description (Optional)
          </Label>
          <Textarea
            id="description"
            placeholder="Tell us about your organization..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="resize-none transition-all"
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/500 characters
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={updateSettings.isPending}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={updateSettings.isPending}
          >
            Skip for now
          </Button>
          <Button onClick={handleContinue} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
