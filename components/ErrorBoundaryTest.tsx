'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

/**
 * Test component for verifying error boundaries work correctly.
 * This component can throw errors on demand to test error boundary behavior.
 *
 * Usage:
 * 1. Wrap this component in an ErrorBoundary
 * 2. Click "Throw Error" button
 * 3. Verify that:
 *    - The error boundary catches the error
 *    - Fallback UI is displayed
 *    - Rest of the app continues working
 *    - "Try Again" button resets the error state
 *
 * @example
 * <ErrorBoundary level="component">
 *   <ErrorBoundaryTest />
 * </ErrorBoundary>
 */
export function ErrorBoundaryTest() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    // Simulate a typical React component error
    throw new Error('Test error: This is an intentional error to test error boundary functionality');
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <AlertTriangle className="w-5 h-5" />
          Error Boundary Test Component
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-orange-800">
          This component is used to test error boundary functionality.
          Click the button below to throw an intentional error and verify the error boundary catches it.
        </p>

        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={() => setShouldThrow(true)}
          >
            Throw Error
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              // Test different error types
              Promise.reject(new Error('Async error test'));
            }}
          >
            Throw Async Error (Not Caught)
          </Button>
        </div>

        <div className="text-xs text-orange-700 space-y-1">
          <p><strong>Expected behavior after clicking &ldquo;Throw Error&rdquo;:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>This component should be replaced with error fallback UI</li>
            <li>The rest of the page should continue working normally</li>
            <li>Error should be logged to console</li>
            <li>&ldquo;Try Again&rdquo; button should reset and show this component again</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
