import { Page } from '@playwright/test';

/**
 * Helper function to login as a specific user
 * Uses email-only authentication (demo mode)
 * @param page Playwright page instance
 * @param email User email
 */
export async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Helper function to login as a manager
 * Uses the seeded manager account: Emily Manager
 */
export async function loginAsManager(page: Page) {
  await login(page, 'emily@example.com');
}

/**
 * Helper function to login as an employee
 * Uses the seeded employee account: David Developer
 */
export async function loginAsEmployee(page: Page) {
  await login(page, 'david@example.com');
}

/**
 * Helper function to login as a coworker
 * Uses the seeded coworker account: Sarah Designer
 */
export async function loginAsCoworker(page: Page) {
  await login(page, 'sarah@example.com');
}

/**
 * Helper function to logout
 */
export async function logout(page: Page) {
  // Click logout button (adjust selector based on your UI)
  await page.click('button[aria-label="Logout"], button:has-text("Logout")');

  // Wait for redirect to login
  await page.waitForURL('/login', { timeout: 5000 });
}

/**
 * Helper function to check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check if we're on a protected route (dashboard)
  const url = page.url();
  return url.includes('/dashboard');
}
