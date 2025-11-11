/**
 * Client-side CSRF token utilities
 */

/**
 * Get CSRF token from cookies (client-side)
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  // Use __Host- prefix only in production (requires secure: true)
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieName = isProduction ? '__Host-csrf-token' : 'csrf-token';

  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie =>
    cookie.trim().startsWith(`${cookieName}=`)
  );

  if (!csrfCookie) {
    return null;
  }

  return csrfCookie.split('=')[1];
}

/**
 * Fetch a new CSRF token from the server
 * This will also set the token in cookies
 */
export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/csrf');
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.csrfToken;
  } catch (_error) {
    return null;
  }
}

/**
 * Get CSRF token, fetching from server if not available in cookies
 */
export async function ensureCsrfToken(): Promise<string | null> {
  // Try to get from cookie first
  let token = getCsrfTokenFromCookie();

  // If not in cookie, fetch from server
  if (!token) {
    token = await fetchCsrfToken();
  }

  return token;
}
