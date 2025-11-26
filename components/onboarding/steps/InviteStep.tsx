'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Mail, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InviteStepProps {
  onNext: () => void;
  onBack: () => void;
  invites: string[];
  setInvites: (invites: string[]) => void;
}

export function InviteStep({ onNext, onBack, invites, setInvites }: InviteStepProps) {
  const [emailInput, setEmailInput] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleAddEmails = () => {
    // Parse emails from input (comma or newline separated)
    const emails = emailInput
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    const validEmails: string[] = [];
    const invalidEmails: string[] = [];

    emails.forEach((email) => {
      if (validateEmail(email)) {
        if (!invites.includes(email) && !validEmails.includes(email)) {
          validEmails.push(email);
        }
      } else {
        invalidEmails.push(email);
      }
    });

    if (validEmails.length > 0) {
      setInvites([...invites, ...validEmails]);
      setEmailInput('');
      toast.success(`Added ${validEmails.length} email${validEmails.length > 1 ? 's' : ''}`);
    }

    if (invalidEmails.length > 0) {
      setErrors(invalidEmails);
      toast.error(`${invalidEmails.length} invalid email${invalidEmails.length > 1 ? 's' : ''}`);
    } else {
      setErrors([]);
    }
  };

  const handleRemoveEmail = (email: string) => {
    setInvites(invites.filter((e) => e !== email));
    toast.success('Email removed');
  };

  const handleContinue = () => {
    if (invites.length === 0) {
      toast.info('Skipping team invitations');
    } else {
      toast.success(`${invites.length} team member${invites.length > 1 ? 's' : ''} will be invited`);
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-2">
          <UserPlus className="h-6 w-6 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Invite Your Team</h2>
        <p className="text-sm text-muted-foreground">
          Add team members to collaborate (optional - you can do this later)
        </p>
      </div>

      <div className="space-y-4">
        {/* Email Input */}
        <div className="space-y-2">
          <Label htmlFor="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Team Member Emails
          </Label>
          <Textarea
            id="emails"
            placeholder="Enter email addresses (one per line or comma-separated)&#10;example1@company.com&#10;example2@company.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            rows={5}
            className="resize-none font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Separate multiple emails with commas or new lines
            </p>
            <Button
              size="sm"
              onClick={handleAddEmails}
              disabled={!emailInput.trim()}
            >
              Add Emails
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-2">
                    Invalid emails:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {errors.map((email, i) => (
                      <code
                        key={i}
                        className="text-xs bg-background px-2 py-1 rounded"
                      >
                        {email}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Added Emails List */}
        {invites.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground">
                  Team Members to Invite ({invites.length})
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setInvites([]);
                    toast.success('All emails cleared');
                  }}
                  className="h-7 text-xs"
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {invites.map((email, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-sm py-1.5 px-3 gap-2"
                  >
                    {email}
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="hover:text-destructive transition-colors"
                      aria-label={`Remove ${email}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {invites.length === 0 && !emailInput && (
          <Card className="border-dashed">
            <CardContent className="pt-6 pb-6 text-center">
              <UserPlus className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                No team members added yet. You can invite them later from settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue}>
          Continue
          {invites.length > 0 && ` with ${invites.length} invite${invites.length > 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}
