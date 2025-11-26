import { Page, expect } from '@playwright/test';

// Demo password for all seed users (matches prisma/seed.ts)
const DEMO_PASSWORD = 'Password123!';

/**
 * Login helper - uses email + password authentication
 */
export async function login(page: Page, email: string) {
  await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for login form to be ready
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitButton = page.locator('button[type="submit"]');

  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });

  // Fill email
  await emailInput.fill(email);

  // Fill password
  await passwordInput.fill(DEMO_PASSWORD);

  // Click sign in and wait for navigation
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 30000 }),
    submitButton.click(),
  ]);

  // Wait for dashboard to fully load
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // Verify we're on dashboard by checking for a key element
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 15000 });
}

/**
 * Login with custom password (for testing different scenarios)
 */
export async function loginWithPassword(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 });

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitButton = page.locator('button[type="submit"]');

  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });

  await emailInput.fill(email);
  await passwordInput.fill(password);

  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 30000 }),
    submitButton.click(),
  ]);

  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 15000 });
}

/**
 * Login as manager (emily@example.com)
 */
export async function loginAsManager(page: Page) {
  await login(page, 'emily@example.com');
}

/**
 * Login as employee (david@example.com)
 */
export async function loginAsEmployee(page: Page) {
  await login(page, 'david@example.com');
}

/**
 * Login as coworker (sarah@example.com)
 */
export async function loginAsCoworker(page: Page) {
  await login(page, 'sarah@example.com');
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
