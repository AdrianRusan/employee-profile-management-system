import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData } from '@/lib/session';

// Request ID header name
const REQUEST_ID_HEADER = 'x-request-id';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/dashboard/**'];

// Public routes that should redirect to dashboard if authenticated
const publicRoutes = ['/login', '/'];

/**
 * Proxy function (formerly middleware in Next.js 15)
 * Handles authentication, routing logic, and security headers at the Edge Runtime
 */
export async function proxy(request: NextRequest) {
  // Generate or use existing request ID
  const existingId = request.headers.get(REQUEST_ID_HEADER);
  const requestId =
    existingId && /^[\w-]{1,64}$/.test(existingId)
      ? existingId
      : crypto.randomUUID();

  // Clone request headers and add request ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add request ID to response
  response.headers.set(REQUEST_ID_HEADER, requestId);

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Get session from cookies
  const session = await getIronSession<SessionData>(request, response, {
    password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
    cookieName: 'employee_profile_session',
  });

  const isAuthenticated = !!session.userId;
  const { pathname } = request.nextUrl;

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route.endsWith('/**')) {
      const basePath = route.slice(0, -3);
      return pathname.startsWith(basePath);
    }
    return pathname === route;
  });

  // Check if current path is public
  const isPublicRoute = publicRoutes.includes(pathname);

  // Helper to add security headers to redirects
  const createSecureRedirect = (url: URL | string) => {
    const redirectResponse = NextResponse.redirect(url instanceof URL ? url : new URL(url, request.url));
    redirectResponse.headers.set(REQUEST_ID_HEADER, requestId);
    redirectResponse.headers.set('X-Content-Type-Options', 'nosniff');
    redirectResponse.headers.set('X-Frame-Options', 'DENY');
    redirectResponse.headers.set('X-XSS-Protection', '1; mode=block');
    redirectResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return redirectResponse;
  };

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return createSecureRedirect(loginUrl);
  }

  // Redirect authenticated users from login page to dashboard
  if (isPublicRoute && isAuthenticated && pathname === '/login') {
    return createSecureRedirect(new URL('/dashboard', request.url));
  }

  // Redirect from root to appropriate page
  if (pathname === '/') {
    if (isAuthenticated) {
      return createSecureRedirect(new URL('/dashboard', request.url));
    } else {
      return createSecureRedirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
