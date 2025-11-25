import pino from 'pino';
import { ILogger } from '../../application/ports/ILogger';

/**
 * Pino implementation of ILogger interface
 * Wraps the existing Pino logger to conform to the application port
 *
 * Features:
 * - JSON-formatted logs for easy parsing
 * - Pretty printing in development
 * - Performance-optimized for production
 * - Automatic sensitive field redaction
 */
export class PinoLogger implements ILogger {
  private logger: pino.Logger;

  constructor(options?: pino.LoggerOptions) {
    // Detect environments where pino-pretty transport should be disabled
    // - Test environments (CI, Vitest, Playwright)
    // - Turbopack (uses different worker model that conflicts with pino-pretty threads)
    const shouldDisableTransport =
      process.env.CI === 'true' ||
      process.env.VITEST === 'true' ||
      !!process.env.PLAYWRIGHT_TEST_BASE_URL ||
      process.env.TURBOPACK === '1' ||
      // Next.js 15+ with Turbopack sets this
      process.env.__NEXT_PRIVATE_PREBUNDLED_REACT != null;

    this.logger = pino({
      level: options?.level || process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

      // Pretty print in development for better readability
      // Disable transport in CI/test/Turbopack environments to avoid thread-stream issues
      ...(process.env.NODE_ENV === 'development' && !shouldDisableTransport && {
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

      ...options,
    });
  }

  /**
   * Log debug-level messages
   * Used for detailed troubleshooting information
   */
  debug(obj: unknown, msg?: string): void;
  debug(msg: string): void;
  debug(objOrMsg: unknown, msg?: string): void {
    if (typeof objOrMsg === 'string') {
      this.logger.debug(objOrMsg);
    } else {
      this.logger.debug(objOrMsg, msg);
    }
  }

  /**
   * Log info-level messages
   * Used for general informational messages
   */
  info(obj: unknown, msg?: string): void;
  info(msg: string): void;
  info(objOrMsg: unknown, msg?: string): void {
    if (typeof objOrMsg === 'string') {
      this.logger.info(objOrMsg);
    } else {
      this.logger.info(objOrMsg, msg);
    }
  }

  /**
   * Log warn-level messages
   * Used for warning messages that don't stop execution
   */
  warn(obj: unknown, msg?: string): void;
  warn(msg: string): void;
  warn(objOrMsg: unknown, msg?: string): void {
    if (typeof objOrMsg === 'string') {
      this.logger.warn(objOrMsg);
    } else {
      this.logger.warn(objOrMsg, msg);
    }
  }

  /**
   * Log error-level messages
   * Used for error conditions that affect functionality
   */
  error(obj: unknown, msg?: string): void;
  error(msg: string): void;
  error(objOrMsg: unknown, msg?: string): void {
    if (typeof objOrMsg === 'string') {
      this.logger.error(objOrMsg);
    } else {
      this.logger.error(objOrMsg, msg);
    }
  }

  /**
   * Log fatal-level messages
   * Used for critical errors that may cause application termination
   */
  fatal(obj: unknown, msg?: string): void;
  fatal(msg: string): void;
  fatal(objOrMsg: unknown, msg?: string): void {
    if (typeof objOrMsg === 'string') {
      this.logger.fatal(objOrMsg);
    } else {
      this.logger.fatal(objOrMsg, msg);
    }
  }

  /**
   * Create a child logger with additional context
   * Useful for request-scoped logging
   */
  child(context: Record<string, unknown>): ILogger {
    const childLogger = new PinoLogger();
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }
}
