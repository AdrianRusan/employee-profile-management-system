import { NextResponse } from 'next/server';

/**
 * Status Endpoint
 *
 * Ultra-lightweight endpoint that confirms the application is running.
 * Does NOT check database or other dependencies.
 * Use for:
 * - Load balancer health checks (before database is ready)
 * - Basic connectivity tests
 * - Container orchestration liveness probes
 */

/**
 * GET /api/monitoring/status
 *
 * Always returns 200 if the application is running.
 * No database or external service checks.
 *
 * @example
 * curl http://localhost:3000/api/monitoring/status
 * {"status":"ok"}
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { status: 'ok' },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}

/**
 * HEAD /api/monitoring/status
 *
 * Fastest possible health check - just returns 200.
 */
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
