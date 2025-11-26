import { NextResponse } from 'next/server';

/**
 * Liveness Check Response
 */
interface LivenessStatus {
  alive: boolean;
  timestamp: string;
}

/**
 * GET /api/health/live
 *
 * Liveness probe for Kubernetes and container orchestration.
 * Indicates whether the application process is running.
 *
 * This is a lightweight check that should always return 200
 * if the Node.js process is running. It does NOT check
 * dependencies - that's what the readiness probe is for.
 *
 * If this endpoint fails, the container should be restarted.
 *
 * Response codes:
 * - 200: Process is alive
 *
 * @example
 * # Kubernetes livenessProbe
 * livenessProbe:
 *   httpGet:
 *     path: /api/health/live
 *     port: 3000
 *   initialDelaySeconds: 15
 *   periodSeconds: 20
 */
export async function GET(): Promise<NextResponse<LivenessStatus>> {
  return NextResponse.json(
    {
      alive: true,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
