'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, User, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const completeRegistrationSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
});

type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>;

interface PendingOAuthData {
  email: string;
  name: string;
  provider: string;
  providerId: string;
  avatar?: string;
  org?: string;
}

function CompleteRegistrationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [oauthData, setOauthData] = useState<PendingOAuthData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteRegistrationInput>({
    resolver: zodResolver(completeRegistrationSchema),
  });

  // Fetch OAuth data from secure cookie via API
  useEffect(() => {
    async function fetchPendingOAuthData() {
      try {
        const response = await fetch('/api/auth/pending-oauth');

        if (!response.ok) {
          toast.error('Missing registration information. Please try signing in again.');
          router.push('/login');
          return;
        }

        const data = await response.json();

        if (!data.email || !data.name || !data.provider || !data.providerId) {
          toast.error('Invalid registration data. Please try again.');
          router.push('/login');
          return;
        }

        setOauthData(data);
      } catch (error) {
        console.error('Failed to fetch OAuth data:', error);
        toast.error('Something went wrong. Please try again.');
        router.push('/login');
      } finally {
        setIsFetchingData(false);
      }
    }

    fetchPendingOAuthData();
  }, [router]);

  const onSubmit = async (data: CompleteRegistrationInput) => {
    if (!oauthData) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/complete-oauth-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: data.organizationName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      toast.success('Registration successful! Welcome to your organization.');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while fetching OAuth data
  if (isFetchingData) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading your information...</p>
      </div>
    );
  }

  // If no OAuth data, component will redirect (handled in useEffect)
  if (!oauthData) {
    return null;
  }

  const providerName = oauthData.provider.charAt(0).toUpperCase() + oauthData.provider.slice(1);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-semibold tracking-tight">Complete your registration</CardTitle>
        <CardDescription className="text-muted-foreground">
          One more step to set up your workspace
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        {/* Connected Account Info */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 mb-6">
          <Avatar className="h-12 w-12">
            <AvatarImage src={oauthData.avatar} alt={oauthData.name} />
            <AvatarFallback>{oauthData.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{oauthData.name}</p>
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            </div>
            <p className="text-sm text-muted-foreground truncate">{oauthData.email}</p>
          </div>
          <Badge variant="secondary" className="flex-shrink-0">
            {providerName}
          </Badge>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Organization Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Create your organization</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationName" className="sr-only">Organization Name</Label>
              <Input
                id="organizationName"
                type="text"
                placeholder="Your company name"
                className="h-11"
                {...register('organizationName')}
                aria-invalid={errors.organizationName ? 'true' : 'false'}
              />
              {errors.organizationName && (
                <p className="text-sm text-destructive">{errors.organizationName.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This will be your organization's workspace name
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
            {isLoading ? 'Creating organization...' : 'Complete registration'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function CompleteRegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <CompleteRegistrationForm />
    </Suspense>
  );
}
