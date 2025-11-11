import pino from 'pino';

/**
 * Structured logging utility using Pino
 *
 * Features:
 * - JSON-formatted logs for easy parsing and searching
 * - Log levels: trace, debug, info, warn, error, fatal
 * - Pretty printing in development for readability
 * - Performance-optimized for production
 * - Context-aware logging with child loggers
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * logger.info('User created successfully');
 * logger.error({ error, userId }, 'Failed to create user');
 *
 * // Create child logger with context
 * const requestLogger = createLogger({ requestId: 'abc123', userId: 'user123' });
 * requestLogger.info('Processing request');
 * ```
 */

// Configure base logger
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // Pretty print in development for better readability
  // Disable transport during tests to avoid thread-stream issues
  ...(process.env.NODE_ENV === 'development' && process.env.VITEST !== 'true' && !process.env.PLAYWRIGHT_TEST_BASE_URL && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),

  // Base context included in all logs
  base: {
    env: process.env.NODE_ENV,
    app: 'employee-profile-management',
  },

  // Redact sensitive fields from logs (GDPR/privacy compliance)
  redact: {
    paths: [
      'password',
      'ssn',
      'token',
      'accessToken',
      'refreshToken',
      'authorization',
      'cookie',
      '*.password',
      '*.ssn',
      '*.token',
    ],
    remove: true, // Remove sensitive fields entirely
  },
});

/**
 * Create a child logger with additional context
 *
 * Child loggers inherit all configuration from parent but add extra context
 * that appears in every log message. This is useful for request-scoped logging.
 *
 * @param context - Additional context to include in all logs
 * @returns Child logger instance
 *
 * @example
 * const requestLogger = createLogger({
 *   requestId: crypto.randomUUID(),
 *   userId: session.userId,
 *   path: '/api/users'
 * });
 *
 * requestLogger.info('Starting request processing');
 * // Output: {"level":"info","requestId":"...","userId":"...","path":"/api/users","msg":"Starting request processing"}
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * Log a tRPC procedure call with input and user context
 *
 * @param procedure - tRPC procedure name (e.g., 'user.create', 'feedback.getAll')
 * @param input - Input parameters passed to the procedure
 * @param userId - Optional user ID making the request
 *
 * @example
 * logTrpcCall('user.update', { id: 'user123', data: { name: 'John' } }, 'user123');
 * // Output: {"level":"info","procedure":"user.update","input":{...},"userId":"user123","type":"trpc_call"}
 */
export function logTrpcCall(
  procedure: string,
  input: unknown,
  userId?: string
) {
  logger.info({
    procedure,
    input,
    userId,
    type: 'trpc_call',
  }, `tRPC: ${procedure}`);
}

/**
 * Log a tRPC procedure success with optional result metadata
 *
 * @param procedure - tRPC procedure name
 * @param userId - Optional user ID
 * @param meta - Optional metadata about the result (e.g., affected records count)
 *
 * @example
 * logTrpcSuccess('user.create', 'user123', { createdId: 'newuser123' });
 * // Output: {"level":"info","procedure":"user.create","userId":"user123","meta":{...},"type":"trpc_success"}
 */
export function logTrpcSuccess(
  procedure: string,
  userId?: string,
  meta?: Record<string, unknown>
) {
  logger.info({
    procedure,
    userId,
    meta,
    type: 'trpc_success',
  }, `tRPC Success: ${procedure}`);
}

/**
 * Log a tRPC procedure error with full context
 *
 * @param procedure - tRPC procedure name
 * @param error - Error object or message
 * @param input - Input that caused the error
 * @param userId - Optional user ID
 *
 * @example
 * logTrpcError('user.create', error, input, 'user123');
 * // Output: {"level":"error","procedure":"user.create","error":{...},"input":{...},"userId":"user123","type":"trpc_error"}
 */
export function logTrpcError(
  procedure: string,
  error: unknown,
  input: unknown,
  userId?: string
) {
  logger.error({
    procedure,
    error,
    input,
    userId,
    type: 'trpc_error',
  }, `tRPC Error: ${procedure}`);
}

/**
 * Log a database query for performance monitoring
 *
 * @param model - Prisma model name (e.g., 'User', 'Feedback')
 * @param operation - Operation type (e.g., 'findMany', 'create', 'update')
 * @param duration - Query execution time in milliseconds
 *
 * @example
 * const start = Date.now();
 * await prisma.user.findMany();
 * logDbQuery('User', 'findMany', Date.now() - start);
 * // Output: {"level":"debug","model":"User","operation":"findMany","duration":45,"type":"db_query"}
 */
export function logDbQuery(
  model: string,
  operation: string,
  duration: number
) {
  const level = duration > 1000 ? 'warn' : 'debug'; // Warn on slow queries (>1s)

  logger[level]({
    model,
    operation,
    duration,
    type: 'db_query',
  }, `DB: ${model}.${operation} (${duration}ms)`);
}

/**
 * Log authentication events (login, logout, failed attempts)
 *
 * @param event - Type of auth event
 * @param userId - Optional user ID
 * @param meta - Optional additional metadata
 *
 * @example
 * logAuthEvent('login_success', 'user123', { method: 'credentials' });
 * logAuthEvent('login_failed', undefined, { email: 'user@example.com', reason: 'invalid_password' });
 */
export function logAuthEvent(
  event: 'login_success' | 'login_failed' | 'logout' | 'session_expired',
  userId?: string,
  meta?: Record<string, unknown>
) {
  logger.info({
    event,
    userId,
    meta,
    type: 'auth_event',
  }, `Auth: ${event}`);
}

/**
 * Log security-related events (CSRF failures, permission denials, etc.)
 *
 * @param event - Type of security event
 * @param userId - Optional user ID
 * @param meta - Optional additional metadata
 *
 * @example
 * logSecurityEvent('csrf_validation_failed', undefined, { ip: '192.168.1.1' });
 * logSecurityEvent('permission_denied', 'user123', { action: 'delete_user', targetId: 'user456' });
 */
export function logSecurityEvent(
  event: string,
  userId?: string,
  meta?: Record<string, unknown>
) {
  logger.warn({
    event,
    userId,
    meta,
    type: 'security_event',
  }, `Security: ${event}`);
}

/**
 * Log performance metrics
 *
 * @param metric - Metric name
 * @param value - Metric value
 * @param unit - Unit of measurement
 * @param meta - Optional additional metadata
 *
 * @example
 * logPerformance('api_response_time', 250, 'ms', { endpoint: '/api/users' });
 * logPerformance('memory_usage', 85, 'mb');
 */
export function logPerformance(
  metric: string,
  value: number,
  unit: string,
  meta?: Record<string, unknown>
) {
  logger.debug({
    metric,
    value,
    unit,
    meta,
    type: 'performance',
  }, `Performance: ${metric} = ${value}${unit}`);
}
