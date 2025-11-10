import { test, expect } from '@playwright/test';
import { loginAsEmployee, loginAsManager, logout } from './helpers/auth';

/**
 * SMOKE TESTS - Critical path verification
 * These tests verify the most essential functionality
 * Run on every commit/PR
 */

test.describe('Smoke Tests @smoke', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should login as employee with email only', async ({ page }) => {
    await page.goto('/login');

    // Fill email (no password required)
    await page.fill('input[type="email"]', 'david@example.com');

    // Select role
    await page.selectOption('select', 'EMPLOYEE');

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('/dashboard');

    // Should see welcome message
    await expect(page.locator('text=/Welcome,/i')).toBeVisible();
  });

  test('should display dashboard with key elements', async ({ page }) => {
    await loginAsEmployee(page);

    // Verify critical dashboard elements are present
    await expect(page.locator('text="Profile Information"')).toBeVisible();
    await expect(page.locator('text="Quick Actions"')).toBeVisible();
    await expect(page.locator('text="Recent Activity"')).toBeVisible();

    // Verify navigation is present
    await expect(page.locator('nav a[href="/dashboard"]')).toBeVisible();
    await expect(page.locator('nav a[href="/dashboard/profiles"]')).toBeVisible();
  });

  test('should navigate to profiles page', async ({ page }) => {
    await loginAsEmployee(page);

    // Click Profiles in sidebar navigation
    await page.locator('nav a[href="/dashboard/profiles"]').click();

    // Wait for navigation to complete
    await page.waitForURL('/dashboard/profiles', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Should see employee profiles page
    await expect(page.locator('text="Employee Profiles"')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await loginAsEmployee(page);

    // Verify we're logged in
    await expect(page).toHaveURL('/dashboard');

    // Click logout button and wait for redirect
    const logoutButton = page.locator('button:has-text("Logout")');
    await logoutButton.waitFor({ state: 'visible' });
    await logoutButton.click();

    // Wait for redirect to login (window.location.href causes hard navigation)
    await page.waitForURL('/login', { timeout: 10000 });

    // Should be on login page
    await expect(page).toHaveURL('/login');

    // Try to access dashboard - should redirect back to login
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show quick action buttons', async ({ page }) => {
    await loginAsEmployee(page);

    // Verify all quick actions are present
    await expect(page.locator('button:has-text("Give Feedback")')).toBeVisible();
    await expect(page.locator('button:has-text("Request Time Off")')).toBeVisible();
    await expect(page.locator('a:has-text("View My Profile")')).toBeVisible();
    await expect(page.locator('a:has-text("Browse Profiles")')).toBeVisible();
  });

  test('should display manager-specific elements', async ({ page }) => {
    await loginAsManager(page);

    // Manager should see "Pending Approvals" link in quick actions (unique to managers)
    await expect(page.locator('a:has-text("Pending Approvals")')).toBeVisible();

    // Manager should see Recent Activity section
    await expect(page.locator('text="Recent Activity"')).toBeVisible();
  });

  test('should navigate to feedback page', async ({ page }) => {
    await loginAsEmployee(page);

    // Click Feedback in sidebar navigation
    await page.locator('nav a[href="/dashboard/feedback"]').click();

    // Wait for navigation to complete
    await page.waitForURL('/dashboard/feedback', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Should see feedback statistics and tabs
    await expect(page.locator('text="Received"')).toBeVisible();
    await expect(page.locator('text="Given"')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Received")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Given")')).toBeVisible();
  });

  test('should navigate to absences page', async ({ page }) => {
    await loginAsEmployee(page);

    // Click Absences in sidebar navigation
    await page.locator('nav a[href="/dashboard/absences"]').click();

    // Wait for navigation to complete
    await page.waitForURL('/dashboard/absences', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Should see absence management sections
    await expect(page.locator('text="Request Time Off"')).toBeVisible();
  });

  test('should display user email on dashboard', async ({ page }) => {
    await loginAsEmployee(page);

    // Should see the logged-in user's email
    await expect(page.locator('text=david@example.com')).toBeVisible();
  });

  test('should persist session after page reload', async ({ page }) => {
    await loginAsEmployee(page);

    // Verify logged in
    await expect(page).toHaveURL('/dashboard');

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=/Welcome,/i')).toBeVisible();
  });

  test('should view employee directory with search', async ({ page }) => {
    await loginAsEmployee(page);

    // Go to profiles
    await page.goto('/dashboard/profiles');

    // Should see search input
    await expect(page.locator('input[placeholder*="Search" i]')).toBeVisible();

    // Should see employee rows (scope to main content to avoid header text)
    const mainContent = page.locator('main');
    await expect(mainContent.locator('text=Emily Manager')).toBeVisible();
    await expect(mainContent.locator('text=David Developer')).toBeVisible();
    await expect(mainContent.locator('text=Sarah Designer')).toBeVisible();
  });
});
