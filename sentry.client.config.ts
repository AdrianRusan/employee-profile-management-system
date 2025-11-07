/**
 * Sentry Configuration for Client-Side (Browser)
 *
 * This configuration is used for:
 * - React components
 * - Client-side navigation
 * - Browser-side errors
 * - User interactions
 *
 * Environment Variables Required:
 * - NEXT_PUBLIC_SENTRY_DSN: Your Sentry project DSN (must be prefixed with NEXT_PUBLIC_)
 * - NODE_ENV: Environment name ('development', 'production', etc.)
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // Client-side DSN (must be public and prefixed with NEXT_PUBLIC_)
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment helps filter errors in Sentry dashboard
  environment: process.env.NODE_ENV || 'development',

  // Performance monitoring - traces sample rate
  // Lower sample rate on client to reduce network usage and costs
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // Session Replay - records user sessions when errors occur
  // This helps reproduce bugs by seeing what the user did
  replaysSessionSampleRate: 0.1, // 10% of sessions recorded
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors recorded

  // Enable debug mode in development for troubleshooting
  debug: process.env.NODE_ENV === 'development',

  // Release tracking (optional)
  // release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // Filter out common browser noise that isn't actionable
  ignoreErrors: [
    // Random plugins/extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    "Can't find variable: ZiteReader",
    'jigsaw is not defined',
    'ComboSearch is not defined',
    'atomicFindClose',
    'fb_xd_fragment',
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
    // Browser quirks
    'Non-Error promise rejection captured',
    'Non-Error exception captured',
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Network errors (often not actionable)
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    // Safari quirks
    'webkitExitFullScreen',
    // Chrome extensions
    'chrome-extension://',
    'moz-extension://',
  ],

  // Ignore errors from third-party scripts
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    // Third-party scripts
    /google-analytics\.com/i,
    /googletagmanager\.com/i,
    /facebook\.net/i,
    /connect\.facebook\.net/i,
  ],

  // Configure which URLs to trace
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/[^/]*\.vercel\.app/, // Your production domain
  ],

  // Before sending event to Sentry, allow modifications
  beforeSend(event, hint) {
    // Filter out events in development (optional)
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_FORCE_DEV) {
      console.log('Sentry event (not sent in dev):', event);
      return null; // Don't send to Sentry in development
    }

    // Check if this is a chunk loading error (common with deployments)
    const error = hint.originalException;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message);
      if (
        message.includes('Loading chunk') ||
        message.includes('ChunkLoadError') ||
        message.includes('dynamically imported module')
      ) {
        // Don't send chunk loading errors to Sentry
        // These often happen during deployments and aren't actionable
        return null;
      }
    }

    // Sanitize user data - only send minimal info for privacy
    if (event.user) {
      event.user = {
        id: event.user.id,
        // Don't send email, name, or other PII
        // Add back if your privacy policy allows it:
        // email: event.user.email,
      };
    }

    // Sanitize request data
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers['x-csrf-token'];
      }

      // Sanitize query parameters
      if (event.request.query_string) {
        const params = new URLSearchParams(event.request.query_string);
        if (params.has('token')) params.delete('token');
        if (params.has('password')) params.delete('password');
        if (params.has('secret')) params.delete('secret');
        event.request.query_string = params.toString();
      }
    }

    return event;
  },

  // Breadcrumbs help trace what happened before an error
  beforeBreadcrumb(breadcrumb) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null; // Don't track console.log
    }

    // Don't track navigation to sensitive URLs
    if (breadcrumb.category === 'navigation') {
      // Remove sensitive query parameters from URLs
      if (breadcrumb.data?.to) {
        try {
          const url = new URL(breadcrumb.data.to, window.location.origin);
          url.searchParams.delete('token');
          url.searchParams.delete('password');
          url.searchParams.delete('secret');
          breadcrumb.data.to = url.pathname + url.search + url.hash;
        } catch {
          // If URL parsing fails, just use the original
        }
      }
    }

    // Sanitize breadcrumb data
    if (breadcrumb.data) {
      if ('password' in breadcrumb.data) delete breadcrumb.data.password;
      if ('token' in breadcrumb.data) delete breadcrumb.data.token;
      if ('ssn' in breadcrumb.data) delete breadcrumb.data.ssn;
    }

    return breadcrumb;
  },

  // Integrations for browser-specific features
  integrations: [
    // Session Replay - records user sessions to help debug issues
    Sentry.replayIntegration({
      // Mask all text content by default for privacy
      maskAllText: true,
      // Block all media (images, video, audio) from being recorded
      blockAllMedia: true,
    }),

    // Browser tracing - tracks page loads and navigation
    Sentry.browserTracingIntegration({
      // Track page load performance
      enableLongTask: true,
      // Track React component render performance
      enableInp: true,
    }),
  ],
});
