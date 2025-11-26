import { initTRPC, TRPCError } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser, SessionData } from '@/lib/session';
import { prisma } from './db';
import { validateCsrfFromRequest } from '@/lib/csrf';
import { createLogger, logger } from '@/lib/logger';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { tenantStorage, TenantContext } from '@/lib/tenant-context';
import * as Sentry from '@sentry/nextjs';
import { ZodError } from 'zod';
import type { Logger } from 'pino';

// Define context type
export interface Context {
  prisma: PrismaClient;
  session: SessionData | null;
  req: Request;
  logger: Logger;
  requestId: string;
}

// Authenticated context with guaranteed non-null session
export interface AuthenticatedContext extends Context {
  session: SessionData;
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

// Initialize tRPC with error formatting
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

    // Include Zod validation errors in response for client-side handling
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  return forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
}

/**
 * Rate limiting middleware
 * Applies rate limiting based on client IP and optional user ID
 */
const rateLimitMiddleware = t.middleware(async ({ ctx, next, path }) => {
  const clientIp = getClientIp(ctx.req);
  const identifier = ctx.session?.userId
    ? `user:${ctx.session.userId}`
    : `ip:${clientIp}`;

  const result = await checkRateLimit(identifier, 'api');

  if (!result.success) {
    ctx.logger.warn(
      { identifier, path, remaining: result.remaining },
      'Rate limit exceeded'
    );

    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Try again in ${Math.ceil((result.reset - Date.now()) / 1000)} seconds.`,
    });
  }

  ctx.logger.debug(
    { identifier, remaining: result.remaining },
    'Rate limit check passed'
  );

  return next({ ctx });
});

// Protected procedure middleware - requires authentication, CSRF validation, and sets tenant context
export const protectedProcedure = t.procedure.use(rateLimitMiddleware).use(async ({ ctx, next, type, path }) => {
  if (!ctx.session?.userId) {
    ctx.logger.warn({ path, type }, 'Unauthorized access attempt');

    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action'
    });
  }

  // Validate organization context exists in session
  if (!ctx.session.organizationId || !ctx.session.organizationSlug) {
    ctx.logger.warn({
      path,
      type,
      userId: ctx.session.userId,
      hasOrgId: !!ctx.session.organizationId,
      hasOrgSlug: !!ctx.session.organizationSlug,
    }, 'Missing organization context in session');

    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No organization context found. Please log in again.'
    });
  }

  // Validate CSRF token for mutations (state-changing operations)
  // Queries (read operations) don't need CSRF protection
  if (type === 'mutation') {
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

  // Set up tenant context for this request using AsyncLocalStorage
  // This ensures all repository queries are automatically scoped to the organization
  const tenantContext: TenantContext = {
    organizationId: ctx.session.organizationId,
    organizationSlug: ctx.session.organizationSlug,
    organizationName: '', // Not required for queries, just the ID and slug
  };

  // Run the rest of the request within the tenant context
  // Type assertion: at this point session is guaranteed to be non-null due to checks above
  const session = ctx.session as SessionData;

  return tenantStorage.run(tenantContext, () => {
    return next({
      ctx: {
        ...ctx,
        session, // Now TypeScript knows this is non-null
      },
    });
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
