import { NextResponse } from 'next/server';
import { metrics, updateBusinessMetrics } from '@/lib/metrics';
import { prisma } from '@/server/db';

/**
 * GET /api/metrics
 *
 * Prometheus-compatible metrics endpoint for monitoring.
 * Returns metrics in Prometheus text exposition format.
 *
 * Security: Authentication is REQUIRED in production.
 * Set METRICS_TOKEN environment variable.
 *
 * @example
 * # Prometheus scrape config
 * scrape_configs:
 *   - job_name: 'epms'
 *     static_configs:
 *       - targets: ['localhost:3000']
 *     metrics_path: '/api/metrics'
 *     bearer_token: 'your-secret-token'
 */
export async function GET(request: Request): Promise<Response> {
  // Verify metrics token for security - REQUIRED in production
  const metricsToken = process.env.METRICS_TOKEN;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && !metricsToken) {
    console.error('METRICS_TOKEN environment variable is required in production');
    return new Response('Metrics endpoint not configured', { status: 503 });
  }

  if (metricsToken) {
    const authHeader = request.headers.get('authorization');
    const providedToken = authHeader?.replace('Bearer ', '');

    if (providedToken !== metricsToken) {
      return new Response('Unauthorized', { status: 401 });
    }
  } else if (isProduction) {
    // Extra safety: should not reach here due to check above
    return new Response('Unauthorized', { status: 401 });
  }

  // Update business metrics from database
  try {
    const [userCount, feedbackCount, absenceCount, unreadNotifications] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.feedback.count({ where: { deletedAt: null } }),
      prisma.absenceRequest.count({ where: { deletedAt: null } }),
      prisma.notification.count({ where: { read: false } }),
    ]);

    updateBusinessMetrics({
      users: userCount,
      feedback: feedbackCount,
      absences: absenceCount,
      unreadNotifications,
    });
  } catch (error) {
    // Log but don't fail - metrics should still be returned
    console.error('Failed to update business metrics:', error);
  }

  // Return metrics in Prometheus format
  const metricsOutput = metrics.toPrometheusFormat();

  return new Response(metricsOutput, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * POST /api/metrics
 *
 * JSON format for debugging and dashboards
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Verify metrics token - REQUIRED in production
  const metricsToken = process.env.METRICS_TOKEN;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && !metricsToken) {
    return NextResponse.json(
      { error: 'Metrics endpoint not configured' },
      { status: 503 }
    );
  }

  if (metricsToken) {
    const authHeader = request.headers.get('authorization');
    const providedToken = authHeader?.replace('Bearer ', '');

    if (providedToken !== metricsToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (isProduction) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(metrics.toJSON(), {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
