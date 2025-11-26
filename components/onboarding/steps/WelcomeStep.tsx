'use client';

import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/Provider';
import { Sparkles, Users, Calendar, MessageSquare, BarChart } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { data: currentUser } = trpc.auth.getCurrentUser.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes - user data rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const features = [
    {
      icon: Users,
      title: 'Employee Management',
      description: 'Manage your team members and their profiles',
    },
    {
      icon: MessageSquare,
      title: 'Feedback System',
      description: 'Give and receive constructive feedback',
    },
    {
      icon: Calendar,
      title: 'Absence Tracking',
      description: 'Request and approve time-off easily',
    },
    {
      icon: BarChart,
      title: 'Performance Analytics',
      description: 'Track team performance and growth',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          Welcome to Employee Hub{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}!
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We&apos;re excited to have you on board. Let&apos;s get your organization set up in just a
          few simple steps.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="flex gap-4 p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onNext} className="min-w-[200px]">
          Let&apos;s Get Started
        </Button>
      </div>
    </div>
  );
}
