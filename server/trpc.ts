import { initTRPC, TRPCError } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser, SessionData } from '@/lib/session';
import { prisma } from './db';
import { validateCsrfFromRequest } from '@/lib/csrf';
import { createLogger, logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { ZodError } from 'zod';
import type { Logger } from 'pino';
import { rateLimit, getRateLimitIdentifier, checkRateLimit } from '@/lib/rate-limit';

// Define context type
export interface Context {
  prisma: PrismaClient;
  session: SessionData | null;
  req: Request;
  logger: Logger;
  requestId: string;
}

// Create context for tRPC
export async function createContext(opts: FetchCreateContextFnOptions): Promise<Context> {
  const session = await getCurrentUser();

  // Generate unique request ID for tracing
  const requestId = crypto.randomUUID();

  // Create request-scoped logger with context
  const requestLogger = createLogger({
    requestId,
    userId: session?.userId,
    userRole: session?.role,
    path: new URL(opts.req.url).pathname,
  });

  // Set user context for Sentry
  if (session?.userId) {
    Sentry.setUser({
      id: session.userId,
    });
  }

  // Set request ID as tag for Sentry
  Sentry.setTag('requestId', requestId);

  return {
    prisma,
    session,
    req: opts.req,
    logger: requestLogger,
    requestId,
  };
}

/**
 * Get user-friendly error message based on error code
 */
function getUserFriendlyMessage(code: string, originalMessage: string): string {
  const errorMessages: Record<string, string> = {
    'UNAUTHORIZED': 'Please log in to continue',
    'FORBIDDEN': 'You don\'t have permission to perform this action',
    'NOT_FOUND': 'The requested item could not be found',
    'BAD_REQUEST': 'Invalid request. Please check your input and try again',
    'CONFLICT': 'This action conflicts with existing data',
    'TOO_MANY_REQUESTS': 'Too many requests. Please wait a moment and try again',
    'INTERNAL_SERVER_ERROR': 'Something went wrong on our end. Please try again later',
    'TIMEOUT': 'The request took too long. Please try again',
  };

  // Use custom message if provided, otherwise use friendly default
  return originalMessage && originalMessage !== code
    ? originalMessage
    : errorMessages[code] || 'An unexpected error occurred. Please try again';
}

// Initialize tRPC with enhanced error formatting
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error, ctx }) {
    // Log all errors with context
    if (ctx?.logger) {
      ctx.logger.error({
        code: error.code,
        message: error.message,
        cause: error.cause,
      }, 'tRPC Error');
    } else {
      // Fallback if logger not available
      logger.error({
        code: error.code,
        message: error.message,
        cause: error.cause,
      }, 'tRPC Error (no context)');
    }

    // Send internal server errors to Sentry
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      Sentry.captureException(error.cause || error, {
        contexts: {
          trpc: {
            code: error.code,
            message: error.message,
          },
        },
        tags: {
          error_code: error.code,
        },
      });
    }

    // Get user-friendly message
    const userFriendlyMessage = getUserFriendlyMessage(error.code, error.message);

    // Include Zod validation errors and enhanced messaging
    return {
      ...shape,
      message: userFriendlyMessage,
      data: {
        ...shape.data,
        code: error.code,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
        hint: getErrorHint(error.code),
      },
    };
  },
});

/**
 * Get helpful hint for users based on error code
 */
function getErrorHint(code: string): string | null {
  const hints: Record<string, string> = {
    'UNAUTHORIZED': 'Try refreshing the page or logging in again',
    'FORBIDDEN': 'Contact your manager if you need access',
    'TOO_MANY_REQUESTS': 'Wait a few moments before trying again',
    'INTERNAL_SERVER_ERROR': 'If this persists, please contact support',
  };

  return hints[code] || null;
}

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure middleware - requires authentication and CSRF validation
export const protectedProcedure = t.procedure.use(async ({ ctx, next, type, path }) => {
  if (!ctx.session?.userId) {
    ctx.logger.warn({ path, type }, 'Unauthorized access attempt');

    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action'
    });
  }

  // Validate CSRF token for mutations (state-changing operations)
  // Queries (read operations) don't need CSRF protection
  if (type === 'mutation') {
    // Rate limiting for mutations (30 per minute)
    const identifier = getRateLimitIdentifier(ctx.req, ctx.session.userId);
    const rateLimitCheck = await checkRateLimit(rateLimit.mutation, identifier, `mutation:${path}`);
    if (!rateLimitCheck.allowed) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please slow down and try again.',
      });
    }

    const isValidCsrf = await validateCsrfFromRequest(ctx.req);

    if (!isValidCsrf) {
      ctx.logger.warn({
        path,
        userId: ctx.session.userId,
      }, 'CSRF validation failed');

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Invalid or missing CSRF token. Please refresh the page and try again.'
      });
    }
  }

  // Log successful authentication
  ctx.logger.debug({ path, type }, 'Authenticated request');

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

// Role-based procedure middleware
export const managerProcedure = protectedProcedure.use(async ({ ctx, next, path }) => {
  if (ctx.session.role !== 'MANAGER') {
    ctx.logger.warn({
      path,
      userId: ctx.session.userId,
      userRole: ctx.session.role,
    }, 'Manager-only action attempted by non-manager');

    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only managers can perform this action'
    });
  }

  ctx.logger.debug({ path }, 'Manager-only request authorized');

  return next({ ctx });
});
