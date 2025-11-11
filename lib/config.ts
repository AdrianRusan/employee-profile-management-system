/**
 * Centralized configuration with environment variable support
 *
 * This module provides a single source of truth for all configurable
 * values in the application. All values can be overridden via environment
 * variables, with sensible defaults provided.
 */

/**
 * Parse integer from environment variable with fallback
 * @param key - Environment variable name
 * @param fallback - Default value if env var is not set or invalid
 * @returns Parsed integer or fallback
 */
function getEnvInt(key: string, fallback: number): number {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Parse boolean from environment variable with fallback
 * @param key - Environment variable name
 * @param fallback - Default value if env var is not set
 * @returns Parsed boolean or fallback
 */
function getEnvBool(key: string, fallback: boolean): boolean {
  const value = process.env[key];
  if (!value) return fallback;
  return value.toLowerCase() === 'true';
}

/**
 * Session configuration
 * Controls cookie-based session behavior
 */
export const sessionConfig = {
  /** Session cookie name - customize per environment to avoid conflicts */
  cookieName: process.env.SESSION_COOKIE_NAME || 'employee_profile_session',

  /** Session duration in seconds - default 7 days */
  maxAge: getEnvInt('SESSION_MAX_AGE', 60 * 60 * 24 * 7),

  /** Use secure cookies - auto-enabled in production */
  secure: getEnvBool('SESSION_SECURE', process.env.NODE_ENV === 'production'),

  /**
   * SameSite cookie attribute - 'strict' | 'lax' | 'none'
   *
   * Default: 'lax' for production compatibility
   * - 'lax': Cookies sent on top-level navigation (e.g., clicking links, redirects)
   *          while still protecting against CSRF. Best for most production apps.
   * - 'strict': Cookies ONLY sent on same-site requests. Breaks navigation flows.
   * - 'none': Cookies sent everywhere (requires secure=true). Use for cross-domain.
   */
  sameSite: (process.env.SESSION_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax',
} as const;

/**
 * React Query configuration
 * Controls client-side cache behavior
 *
 * Strategy: Different data types have different update frequencies
 * - Static data (departments): 30 minutes
 * - Normal data (profiles): 5 minutes (default)
 * - Semi-frequent (feedback): 2 minutes
 * - Real-time (pending approvals): 1 minute
 */
export const queryConfig = {
  /** Time in ms before cached data is considered stale - default 5 minutes */
  staleTime: getEnvInt('QUERY_STALE_TIME', 5 * 60 * 1000),

  /** Time in ms before unused cached data is garbage collected - default 10 minutes */
  gcTime: getEnvInt('QUERY_GC_TIME', 10 * 60 * 1000),

  /** Whether to refetch queries when window regains focus */
  refetchOnWindowFocus: getEnvBool('QUERY_REFETCH_ON_FOCUS', false),

  /**
   * Per-query staleTime overrides for different data types
   * Use these constants to maintain consistent cache behavior across the app
   */
  staleTimePresets: {
    /** Static data that rarely changes (departments, roles) - 30 minutes */
    static: 30 * 60 * 1000,

    /** Semi-frequent updates (feedback, notifications) - 2 minutes */
    semiFrequent: 2 * 60 * 1000,

    /** Real-time data (pending approvals, live dashboards) - 1 minute */
    realtime: 1 * 60 * 1000,
  },
} as const;

/**
 * Application limits
 * Controls resource constraints and timeouts
 */
export const appLimits = {
  /** Maximum file upload size in bytes - default 5MB */
  maxFileSize: getEnvInt('MAX_FILE_SIZE', 5 * 1024 * 1024),

  /** API request timeout in milliseconds - default 30 seconds */
  requestTimeout: getEnvInt('REQUEST_TIMEOUT', 30000),

  /** Number of retries for failed requests - default 3 */
  retryCount: getEnvInt('RETRY_COUNT', 3),
} as const;

/**
 * Feature flags
 * Enable/disable features per environment
 */
export const features = {
  /** Enable analytics tracking */
  enableAnalytics: getEnvBool('FEATURE_ANALYTICS', true),

  /** Enable push notifications */
  enableNotifications: getEnvBool('FEATURE_NOTIFICATIONS', true),
} as const;
