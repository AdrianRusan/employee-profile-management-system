import { PrismaClient } from '@prisma/client';
import { validateEnv } from '@/lib/validate-env';
import { initializeZodErrorMap } from '@/lib/validations/error-map';

// Validate environment variables on server startup
validateEnv();

// Initialize custom Zod error messages
initializeZodErrorMap();

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Add graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
