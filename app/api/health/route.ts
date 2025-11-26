import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

/**
 * Health Check Response Types
 */
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
    };
    memory: {
      status: 'ok' | 'warning' | 'critical';
      used: number;
      total: number;
      percentage: number;
    };
  };
}

/**
 * GET /api/health
 *
 * Health check endpoint for monitoring and load balancers.
 * Returns the overall health status of the application including:
 * - Database connectivity
 * - Memory usage
 * - Application uptime
 *
 * Response codes:
 * - 200: Healthy - all systems operational
 * - 503: Unhealthy - critical systems down
 *
 * @example
 * curl http://localhost:3000/api/health
 */
export async function GET(): Promise<NextResponse<HealthStatus>> {
  const startTime = Date.now();

  // Check database connectivity
  let dbStatus: HealthStatus['checks']['database'] = { status: 'down' };
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    dbStatus = { status: 'up', latency: dbLatency };
  } catch (error) {
    dbStatus = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal;
  const usedMem = memUsage.heapUsed;
  const memPercentage = Math.round((usedMem / totalMem) * 100);

  let memStatus: 'ok' | 'warning' | 'critical' = 'ok';
  if (memPercentage > 90) {
    memStatus = 'critical';
  } else if (memPercentage > 75) {
    memStatus = 'warning';
  }

  // Determine overall health status
  let overallStatus: HealthStatus['status'] = 'healthy';
  if (dbStatus.status === 'down') {
    overallStatus = 'unhealthy';
  } else if (memStatus === 'critical') {
    overallStatus = 'degraded';
  } else if (memStatus === 'warning') {
    overallStatus = 'degraded';
  }

  const healthResponse: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime: process.uptime(),
    checks: {
      database: dbStatus,
      memory: {
        status: memStatus,
        used: Math.round(usedMem / 1024 / 1024), // MB
        total: Math.round(totalMem / 1024 / 1024), // MB
        percentage: memPercentage,
      },
    },
  };

  // Return 503 if unhealthy (for load balancer health checks)
  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(healthResponse, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  });
}
