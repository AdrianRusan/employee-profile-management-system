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

  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie =>
    cookie.trim().startsWith('__Host-csrf-token=')
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
      console.error('Failed to fetch CSRF token:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
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
