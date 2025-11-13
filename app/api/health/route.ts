import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

/**
 * GET /api/health
 * Health check endpoint for monitoring and load balancers
 */
export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
