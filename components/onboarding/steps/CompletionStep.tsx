'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  Users,
  FolderTree,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Calendar,
  Settings,
} from 'lucide-react';

interface CompletionStepProps {
  onComplete: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function CompletionStep({ onComplete, onBack, isLoading }: CompletionStepProps) {
  const quickTips = [
    {
      icon: Users,
      title: 'Invite Team Members',
      description: 'Add your colleagues to start collaborating',
      action: 'Go to Settings → Team',
    },
    {
      icon: MessageSquare,
      title: 'Give Feedback',
      description: 'Share constructive feedback with your team',
      action: 'Visit the Feedback page',
    },
    {
      icon: Calendar,
      title: 'Request Time Off',
      description: 'Submit absence requests for approval',
      action: 'Visit the Absences page',
    },
    {
      icon: Settings,
      title: 'Customize Your Profile',
      description: 'Update your profile information and avatar',
      action: 'Go to Profile Settings',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-2">
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">You&apos;re All Set!</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your organization is ready to go. Here&apos;s what you can do next.
        </p>
      </div>

      {/* Quick Tips */}
      <div className="grid gap-4 md:grid-cols-2">
        {quickTips.map((tip, index) => {
          const Icon = tip.icon;
          return (
            <Card
              key={index}
              className="border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-md"
            >
              <CardContent className="pt-6 pb-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-foreground">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                    <p className="text-xs text-primary font-medium pt-1 flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      {tip.action}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Features Highlight */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">
                What&apos;s Next?
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Explore the dashboard to see your team&apos;s activity and metrics
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Customize your organization settings and preferences
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Start giving and receiving feedback to foster team growth
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button
          size="lg"
          onClick={onComplete}
          disabled={isLoading}
          className="min-w-[200px]"
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Finishing Up...
            </>
          ) : (
            <>
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
