'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isResending, setIsResending] = useState(false);

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      toast.success('Email verified successfully! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || 'Verification failed. Please try again.');
    },
  });

  const email = searchParams.get('email') || '';

  const resendMutation = trpc.auth.resendVerification.useMutation({
    onSuccess: () => {
      toast.success('Verification email sent! Please check your inbox.');
      setIsResending(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send email. Please try again.');
      setIsResending(false);
    },
  });

  useEffect(() => {
    if (token && !verifyMutation.isSuccess && !verifyMutation.isError) {
      verifyMutation.mutate({ token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = () => {
    if (!email) {
      toast.error('Email address is required to resend verification.');
      return;
    }
    setIsResending(true);
    resendMutation.mutate({ email });
  };

  // If we have a token, show verification status
  if (token) {
    return (
      <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Email Verification</CardTitle>
            <CardDescription>
              {verifyMutation.isPending && 'Verifying your email address...'}
              {verifyMutation.isError && 'Verification failed'}
              {verifyMutation.isSuccess && 'Email verified successfully!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verifyMutation.isPending && (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            )}

            {verifyMutation.isError && (
              <div className="space-y-4">
                <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                  {verifyMutation.error.message}
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={handleResend}
                    disabled={isResending}
                    className="w-full"
                  >
                    {isResending ? 'Sending...' : 'Resend verification email'}
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login">Back to login</Link>
                  </Button>
                </div>
              </div>
            )}

            {verifyMutation.isSuccess && (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  Your email has been verified successfully. You will be redirected to the dashboard shortly.
                </div>
                <Button asChild className="w-full">
                  <Link href="/dashboard">Go to dashboard</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
    );
  }

  // No token - show "check your email" message
  return (
    <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We've sent you a verification link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Please check your email inbox for a verification link. Click the link to verify your email address and complete your registration.
            </p>
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or request a new one.
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleResend}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? 'Sending...' : 'Resend verification email'}
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/login">Back to login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
