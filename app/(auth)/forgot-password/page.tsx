'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success('Password reset instructions sent!');
    },
    onError: (error) => {
      // For security reasons, we still show success even on error
      // This prevents attackers from discovering which emails exist
      setIsSubmitted(true);
      toast.success('Password reset instructions sent!');
    },
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPasswordMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              Password reset instructions sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
              If an account exists with that email address, you will receive password reset instructions shortly.
            </div>
            <p className="text-sm text-muted-foreground">
              Please check your email inbox (and spam folder) for a link to reset your password. The link will expire in 1 hour.
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/login">Back to login</Link>
            </Button>
          </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
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

            <Button
              type="submit"
              className="w-full"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? 'Sending...' : 'Send reset link'}
            </Button>

            <div className="text-center text-sm">
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Back to login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
  );
}
