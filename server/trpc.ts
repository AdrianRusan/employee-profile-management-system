import { initTRPC, TRPCError } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser, SessionData } from '@/lib/session';

// Create Prisma client instance
const prisma = new PrismaClient();

// Define context type
export interface Context {
  prisma: PrismaClient;
  session: SessionData | null;
}

// Create context for tRPC
export async function createContext(opts?: FetchCreateContextFnOptions): Promise<Context> {
  const session = await getCurrentUser();

  return {
    prisma,
    session,
  };
}

// Initialize tRPC
const t = initTRPC.context<Context>().create();

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure middleware - requires authentication
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action'
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

// Role-based procedure middleware
export const managerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.role !== 'MANAGER') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only managers can perform this action'
    });
  }

  return next({ ctx });
});
