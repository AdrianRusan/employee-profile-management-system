'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TwoFactorVerify } from '@/components/auth/TwoFactorVerify';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

import { loginSchema, type LoginInput } from '@/lib/validations/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';
  const utils = trpc.useUtils();

  const [showPassword, setShowPassword] = useState(false);

  // 2FA state
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Use password-based login for real authentication
  const loginWithPasswordMutation = trpc.auth.loginWithPassword.useMutation({
    onSuccess: async (data) => {
      // Check if 2FA is required
      if ('requiresTwoFactor' in data && data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setTwoFactorEmail(data.email);
        setTwoFactorError('');
        return;
      }

      // No 2FA required, proceed to dashboard
      await utils.auth.getCurrentUser.invalidate();
      await utils.auth.getCurrentUser.refetch();
      router.push(from);
    },
    onError: (error) => {
      setError('email', {
        type: 'manual',
        message: error.message,
      });
    },
  });

  // Verify 2FA code
  const verifyTwoFactorMutation = trpc.auth.verifyTwoFactor.useMutation({
    onSuccess: async () => {
      await utils.auth.getCurrentUser.invalidate();
      await utils.auth.getCurrentUser.refetch();
      router.push(from);
    },
    onError: (error) => {
      setTwoFactorError(error.message);
    },
  });

  const onSubmit = (data: LoginInput) => {
    loginWithPasswordMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  const handleTwoFactorVerify = (code: string, isBackupCode: boolean, trustDevice: boolean) => {
    setTwoFactorError('');
    verifyTwoFactorMutation.mutate({
      email: twoFactorEmail,
      code,
      isBackupCode,
      trustDevice,
    });
  };

  const handleTwoFactorCancel = () => {
    setRequiresTwoFactor(false);
    setTwoFactorEmail('');
    setTwoFactorError('');
  };

  // For loading states
  const isLoading = loginWithPasswordMutation.isPending;

  // If 2FA is required, show the 2FA verification component
  if (requiresTwoFactor) {
    return (
      <TwoFactorVerify
        email={twoFactorEmail}
        onVerify={handleTwoFactorVerify}
        onCancel={handleTwoFactorCancel}
        isLoading={verifyTwoFactorMutation.isPending}
        error={twoFactorError}
      />
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to access your profile and manage employee data
        </CardDescription>
      </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                {...register('email')}
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  {...register('password')}
                  aria-invalid={errors.password ? 'true' : 'false'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <OAuthButtons />

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
