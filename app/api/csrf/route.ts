import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';

/**
 * GET /api/csrf
 * Returns a CSRF token for client-side requests
 * The token is also set in cookies automatically
 */
export async function GET() {
  try {
    const token = await generateCsrfToken();

    return NextResponse.json({
      csrfToken: token,
    });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
