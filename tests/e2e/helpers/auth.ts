import { Page } from '@playwright/test';

/**
 * Login helper - uses email-only authentication
 */
export async function login(page: Page, email: string, role?: 'MANAGER' | 'EMPLOYEE' | 'COWORKER') {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Fill email
  await page.fill('input[type="email"]', email);

  // Select role if specified (otherwise uses profile default)
  if (role) {
    await page.selectOption('select', role);
  }

  // Click sign in
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 15000 });

  // Wait for dashboard to fully load (all network requests complete)
  await page.waitForLoadState('networkidle', { timeout: 10000 });
}

/**
 * Login as manager
 */
export async function loginAsManager(page: Page) {
  await login(page, 'emily@example.com', 'MANAGER');
}

/**
 * Login as employee
 */
export async function loginAsEmployee(page: Page) {
  await login(page, 'david@example.com', 'EMPLOYEE');
}

/**
 * Login as coworker
 */
export async function loginAsCoworker(page: Page) {
  await login(page, 'sarah@example.com', 'COWORKER');
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  // Click logout button in sidebar
  const logoutButton = page.locator('button:has-text("Logout")');
  await logoutButton.waitFor({ state: 'visible' });
  await logoutButton.click();

  // Wait for redirect to login with extended timeout and networkidle
  await page.waitForURL('/login', { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}
