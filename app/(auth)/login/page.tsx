'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isValidRole } from '@/lib/type-guards';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'COWORKER']).optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';
  const utils = trpc.useUtils();

  const [selectedRole, setSelectedRole] = useState<'EMPLOYEE' | 'MANAGER' | 'COWORKER' | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      // Invalidate and refetch user data to update tRPC query cache
      await utils.auth.getCurrentUser.invalidate();
      // Wait for refetch to complete before navigation to ensure session is fully established
      await utils.auth.getCurrentUser.refetch();
      router.push(from);
    },
    onError: (error) => {
      // Log error for debugging in CI logs
      console.error('[LOGIN ERROR]:', error.message, error);
      setError('email', {
        type: 'manual',
        message: error.message,
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate({
      email: data.email,
      role: selectedRole,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Employee Profile System</CardTitle>
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
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role (Demo Feature)</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => {
                  if (isValidRole(value)) {
                    setSelectedRole(value);
                  }
                }}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Use profile default role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="COWORKER">Coworker</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Optional: Override your default role for demo purposes
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 space-y-2 border-t pt-6">
            <p className="text-sm font-medium text-gray-700">Demo Accounts:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>Manager: emily@example.com</p>
              <p>Employee: david@example.com</p>
              <p>Coworker: sarah@example.com</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
