/**
 * Sentry Configuration for Server-Side (Node.js)
 *
 * This configuration is used for:
 * - API routes
 * - Server-side rendering (getServerSideProps, etc.)
 * - tRPC procedures
 * - Background jobs
 *
 * Environment Variables Required:
 * - SENTRY_DSN: Your Sentry project DSN (Data Source Name)
 * - SENTRY_AUTH_TOKEN: Auth token for uploading source maps (optional, for releases)
 * - NODE_ENV: Environment name ('development', 'production', etc.)
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // DSN tells Sentry where to send events
  // Get this from your Sentry project settings
  dsn: process.env.SENTRY_DSN,

  // Environment helps filter errors in Sentry dashboard
  environment: process.env.NODE_ENV || 'development',

  // Performance monitoring - traces sample rate
  // 1.0 = 100% of transactions (use lower in production to reduce costs)
  // 0.1 = 10% of transactions sampled
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable debug mode in development for troubleshooting
  debug: process.env.NODE_ENV === 'development',

  // Release tracking (optional) - helps track which version had errors
  // You can set this in your CI/CD pipeline
  // release: process.env.SENTRY_RELEASE || `employee-profile-management@${process.env.npm_package_version}`,

  // Filter out common noise errors that aren't actionable
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'Can\'t find variable: ZiteReader',
    'jigsaw is not defined',
    'ComboSearch is not defined',
    // Random plugins/extensions
    'atomicFindClose',
    'fb_xd_fragment',
    // Other common non-actionable errors
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],

  // Ignore transactions from health check endpoints
  ignoreTransactions: [
    '/api/health',
    '/api/ping',
  ],

  // Configure which URLs to trace
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/[^/]*\.vercel\.app/, // Your production domain
  ],

  // Before sending event to Sentry, allow modifications
  beforeSend(event, _hint) {
    // Filter out events in development (optional)
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_FORCE_DEV) {
      console.log('Sentry event (not sent in dev):', event);
      return null; // Don't send to Sentry in development
    }

    // Sanitize user data - only send minimal info for privacy
    if (event.user) {
      event.user = {
        id: event.user.id,
        // Don't send email, name, or other PII to Sentry
        // Add back if your privacy policy allows it:
        // email: event.user.email,
      };
    }

    // Sanitize request data - remove sensitive headers
    if (event.request) {
      if (event.request.headers) {
        // Remove sensitive headers
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers['x-csrf-token'];
      }

      // Sanitize query parameters (remove tokens, passwords, etc.)
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

    // Sanitize breadcrumb data
    if (breadcrumb.data) {
      // Remove sensitive data from breadcrumbs
      if ('password' in breadcrumb.data) delete breadcrumb.data.password;
      if ('token' in breadcrumb.data) delete breadcrumb.data.token;
      if ('ssn' in breadcrumb.data) delete breadcrumb.data.ssn;
    }

    return breadcrumb;
  },

  // Integrate with tRPC and other frameworks
  integrations: [
    // HTTP integration captures fetch/http calls
    Sentry.httpIntegration(),
  ],
});
