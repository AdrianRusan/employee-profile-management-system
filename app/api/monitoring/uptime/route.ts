import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

/**
 * Uptime Monitoring Endpoint
 *
 * Lightweight endpoint for external uptime monitoring services like:
 * - UptimeRobot
 * - Pingdom
 * - Better Uptime
 * - Datadog Synthetics
 *
 * Returns a simple response with minimal overhead.
 * Use /api/health for detailed health information.
 */

interface UptimeResponse {
  ok: boolean;
  timestamp: number;
  database: boolean;
}

/**
 * GET /api/monitoring/uptime
 *
 * Fast endpoint for uptime checks. Returns:
 * - 200 if application is operational
 * - 503 if database is down
 *
 * @example
 * curl http://localhost:3000/api/monitoring/uptime
 * {"ok":true,"timestamp":1699999999999,"database":true}
 */
export async function GET(): Promise<NextResponse<UptimeResponse>> {
  let databaseOk = false;

  try {
    // Quick database check
    await prisma.$queryRaw`SELECT 1`;
    databaseOk = true;
  } catch {
    databaseOk = false;
  }

  const response: UptimeResponse = {
    ok: databaseOk,
    timestamp: Date.now(),
    database: databaseOk,
  };

  return NextResponse.json(response, {
    status: databaseOk ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}

/**
 * HEAD /api/monitoring/uptime
 *
 * Even faster check - just returns 200 if app is running.
 * Use for basic ping checks.
 */
export async function HEAD(): Promise<NextResponse> {
  let databaseOk = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseOk = true;
  } catch {
    databaseOk = false;
  }

  return new NextResponse(null, {
    status: databaseOk ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
