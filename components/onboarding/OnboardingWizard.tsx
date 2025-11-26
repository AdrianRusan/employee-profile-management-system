'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/Provider';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { WelcomeStep } from './steps/WelcomeStep';
import { OrganizationStep } from './steps/OrganizationStep';
import { InviteStep } from './steps/InviteStep';
import { DepartmentsStep } from './steps/DepartmentsStep';
import { CompletionStep } from './steps/CompletionStep';
import { CheckCircle2, Building2, Users, FolderTree, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Rocket },
  { id: 'organization', title: 'Organization', icon: Building2 },
  { id: 'invite', title: 'Invite Team', icon: Users },
  { id: 'departments', title: 'Departments', icon: FolderTree },
  { id: 'complete', title: 'Get Started', icon: CheckCircle2 },
] as const;

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [orgData, setOrgData] = useState<Record<string, unknown>>({});
  const [invites, setInvites] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const router = useRouter();
  const utils = trpc.useUtils();

  const completeOnboarding = trpc.organization.completeOnboarding.useMutation({
    onSuccess: async () => {
      // Invalidate the organization settings cache so dashboard sees the updated onboardingCompleted flag
      await utils.organization.getSettings.invalidate();
      toast.success('Welcome aboard! Your organization is ready.');
      router.push('/dashboard');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to complete onboarding');
    },
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    await completeOnboarding.mutateAsync({
      invites: invites.length > 0 ? invites : undefined,
      departments: departments.length > 0 ? departments : undefined,
    });
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return <WelcomeStep onNext={handleNext} />;
      case 'organization':
        return (
          <OrganizationStep
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={setOrgData}
          />
        );
      case 'invite':
        return (
          <InviteStep
            onNext={handleNext}
            onBack={handleBack}
            invites={invites}
            setInvites={setInvites}
          />
        );
      case 'departments':
        return (
          <DepartmentsStep
            onNext={handleNext}
            onBack={handleBack}
            departments={departments}
            setDepartments={setDepartments}
          />
        );
      case 'complete':
        return (
          <CompletionStep
            onComplete={handleComplete}
            onBack={handleBack}
            isLoading={completeOnboarding.isPending}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container max-w-3xl mx-auto py-10 px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />

          {/* Step Indicators */}
          <div className="flex justify-between mt-6">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isFuture = index > currentStep;

              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex flex-col items-center transition-all duration-300',
                    isActive && 'scale-110',
                    isFuture && 'opacity-50'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300',
                      isActive &&
                        'bg-primary text-primary-foreground shadow-lg shadow-primary/50',
                      isCompleted && 'bg-green-500 text-white',
                      isFuture && 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium hidden sm:block transition-colors',
                      isActive && 'text-primary',
                      isCompleted && 'text-green-500',
                      isFuture && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-card rounded-xl shadow-lg p-6 sm:p-8 border">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
