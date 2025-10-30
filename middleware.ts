import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData } from '@/lib/session';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/dashboard/**'];

// Public routes that should redirect to dashboard if authenticated
const publicRoutes = ['/login', '/'];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

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

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from login page to dashboard
  if (isPublicRoute && isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect from root to appropriate page
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
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
