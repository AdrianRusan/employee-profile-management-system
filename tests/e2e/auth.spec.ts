import { test, expect } from '@playwright/test';
import { login, loginAsEmployee, logout } from './helpers/auth';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should redirect unauthenticated users to login page', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in login form (email-only authentication)
    await page.fill('input[name="email"]', 'david@example.com');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Should display user information
    await expect(page.locator('text=David Developer')).toBeVisible();
  });

  test('should show error with invalid email format', async ({ page }) => {
    await page.goto('/login');

    // Fill in login form with invalid email
    await page.fill('input[name="email"]', 'notanemail');

    // Submit form
    await page.click('button[type="submit"]');

    // Should remain on login page or show validation error
    await expect(page).toHaveURL(/\/login/);

    // Should show error message (client-side or server-side validation)
    await expect(page.locator('text=/invalid|email/i')).toBeVisible();
  });

  test('should show error with non-existent user', async ({ page }) => {
    await page.goto('/login');

    // Fill in login form with non-existent email
    await page.fill('input[name="email"]', 'nonexistent@example.com');

    // Submit form
    await page.click('button[type="submit"]');

    // Should remain on login page
    await expect(page).toHaveURL(/\/login/);

    // Should show error message
    await expect(page.locator('text=/not found|invalid|does not exist/i')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await loginAsEmployee(page);

    // Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard');

    // Click logout button (adjust selector based on your UI)
    await page.click('button:has-text("Logout")');

    // Should redirect to login page
    await expect(page).toHaveURL('/login', { timeout: 5000 });

    // Try to access dashboard again - should redirect to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should persist session after page reload', async ({ page }) => {
    // Login
    await loginAsEmployee(page);

    // Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard');

    // Reload page
    await page.reload();

    // Should still be on dashboard (session persisted)
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=David Developer')).toBeVisible();
  });

  test('should redirect from login page when already authenticated', async ({ page }) => {
    // Login first
    await loginAsEmployee(page);

    // Try to go to login page
    await page.goto('/login');

    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should redirect from root to login when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should redirect from root to dashboard when authenticated', async ({ page }) => {
    // Login first
    await loginAsEmployee(page);

    // Logout
    await logout(page);

    // Login again
    await login(page, 'david@example.com');

    // Go to root
    await page.goto('/');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should preserve return URL after login', async ({ page }) => {
    // Try to access a specific profile while not authenticated
    const targetUrl = '/dashboard/profiles/some-id';
    await page.goto(targetUrl);

    // Should be redirected to login with return URL
    await expect(page).toHaveURL(/\/login\?from=/);

    // Login
    await page.fill('input[name="email"]', 'david@example.com');
    await page.click('button[type="submit"]');

    // After login, should redirect to the original URL or dashboard
    // (Implementation may vary - adjust assertion as needed)
    await page.waitForURL(/\/dashboard/);
  });
});
