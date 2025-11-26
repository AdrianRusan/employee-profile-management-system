import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

/**
 * Readiness Check Response
 */
interface ReadinessStatus {
  ready: boolean;
  timestamp: string;
  checks: {
    database: boolean;
    environment: boolean;
  };
  errors?: string[];
}

/**
 * GET /api/health/ready
 *
 * Readiness probe for Kubernetes and container orchestration.
 * Indicates whether the application is ready to receive traffic.
 *
 * Unlike the health endpoint, this specifically checks if all
 * dependencies are ready and the application can handle requests.
 *
 * Response codes:
 * - 200: Ready to receive traffic
 * - 503: Not ready - should not receive traffic
 *
 * @example
 * # Kubernetes readinessProbe
 * readinessProbe:
 *   httpGet:
 *     path: /api/health/ready
 *     port: 3000
 *   initialDelaySeconds: 5
 *   periodSeconds: 10
 */
export async function GET(): Promise<NextResponse<ReadinessStatus>> {
  const errors: string[] = [];

  // Check database connectivity
  let dbReady = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbReady = true;
  } catch (error) {
    errors.push(`Database: ${error instanceof Error ? error.message : 'Connection failed'}`);
  }

  // Check required environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'ENCRYPTION_KEY',
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  const envReady = missingEnvVars.length === 0;
  if (!envReady) {
    errors.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  }

  const isReady = dbReady && envReady;

  const response: ReadinessStatus = {
    ready: isReady,
    timestamp: new Date().toISOString(),
    checks: {
      database: dbReady,
      environment: envReady,
    },
    ...(errors.length > 0 && { errors }),
  };

  return NextResponse.json(response, {
    status: isReady ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
