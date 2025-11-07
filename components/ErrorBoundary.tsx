'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'app' | 'page' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors in child components.
 * Provides different fallback UIs based on the error level (app, page, component).
 *
 * @example
 * // App-level error boundary
 * <ErrorBoundary level="app">
 *   <App />
 * </ErrorBoundary>
 *
 * @example
 * // Component-level error boundary
 * <ErrorBoundary level="component">
 *   <Sidebar />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);

    // Send error to Sentry for monitoring
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      level: 'error',
      tags: {
        errorBoundary: this.props.level || 'component',
      },
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Different fallbacks based on error level
      const { level = 'component' } = this.props;

      // App-level error: Full screen error with page reload
      if (level === 'app') {
        return (
          <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-center space-y-4 max-w-md px-4">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h1 className="text-2xl font-bold text-gray-900">Application Error</h1>
              <p className="text-gray-600">
                Something went wrong with the application. Please refresh the page to try again.
              </p>
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto text-red-600">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <Button onClick={() => window.location.reload()} className="mt-4">
                Refresh Page
              </Button>
            </div>
          </div>
        );
      }

      // Page-level error: Shows error within the app layout
      if (level === 'page') {
        return (
          <div className="p-6 space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Page Error</h2>
            </div>
            <p className="text-gray-600">
              This page encountered an error. You can try again or return to the dashboard.
            </p>
            {this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Technical Details
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto text-red-600">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <Button onClick={this.handleReset}>Try Again</Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        );
      }

      // Component-level error: Minimal disruption, inline error message
      return (
        <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800">
                This component failed to load.{' '}
                <button
                  onClick={this.handleReset}
                  className="underline font-medium hover:text-yellow-900"
                >
                  Try again
                </button>
              </p>
              {this.state.error && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-yellow-700 hover:text-yellow-900">
                    Technical Details
                  </summary>
                  <pre className="mt-1 text-xs overflow-auto text-yellow-800">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
