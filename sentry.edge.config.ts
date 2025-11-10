/**
 * Sentry Configuration for Edge Runtime
 *
 * This configuration is used for:
 * - Edge API routes
 * - Middleware
 * - Edge functions
 *
 * Note: Edge runtime has limitations compared to Node.js:
 * - Smaller bundle size required
 * - Limited integrations available
 * - No file system access
 * - No Node.js APIs
 *
 * Environment Variables Required:
 * - SENTRY_DSN: Your Sentry project DSN
 * - NODE_ENV: Environment name ('development', 'production', etc.)
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // DSN tells Sentry where to send events
  dsn: process.env.SENTRY_DSN,

  // Environment helps filter errors in Sentry dashboard
  environment: process.env.NODE_ENV || 'development',

  // Performance monitoring - traces sample rate
  // Lower sample rate for edge to reduce overhead
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Filter out common noise errors
  ignoreErrors: [
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
  ],

  // Before sending event to Sentry
  beforeSend(event) {
    // Filter out events in development (optional)
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_FORCE_DEV) {
      console.log('Sentry event (not sent in dev):', event);
      return null;
    }

    // Sanitize user data
    if (event.user) {
      event.user = {
        id: event.user.id,
      };
    }

    // Sanitize request data
    if (event.request) {
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers['x-csrf-token'];
      }
    }

    return event;
  },

  // Note: Edge runtime supports fewer integrations than Node.js
  // Most integrations are not available in edge runtime
});
