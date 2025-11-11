'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  useEffect(() => {
    // Send error to Sentry for tracking
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global',
      },
      contexts: {
        errorInfo: {
          digest: error.digest,
        },
      },
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Oops! Something went wrong
          </h1>
          <p className="mt-2 text-gray-600">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
        </div>
        {error.message && (
          <p className="text-sm text-gray-500">
            Error: {error.message}
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset}>
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
