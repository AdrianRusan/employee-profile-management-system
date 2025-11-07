import { test, expect } from '@playwright/test';

/**
 * CSRF Protection E2E Tests
 *
 * These tests verify that Cross-Site Request Forgery (CSRF) protection
 * is properly implemented for all state-changing operations.
 *
 * Test Coverage:
 * 1. CSRF token is generated and set in cookies
 * 2. Mutations fail without valid CSRF token
 * 3. Mutations succeed with valid CSRF token
 * 4. Queries work without CSRF token (read-only operations)
 * 5. Token is included in request headers
 */

test.describe('CSRF Protection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Login as a test user to establish session
    await page.fill('input[name="email"]', 'john.doe@company.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
  });

  test('should generate CSRF token on page load', async ({ page }) => {
    // Check if CSRF token cookie is set
    const cookies = await page.context().cookies();
    const csrfTokenCookie = cookies.find(c => c.name === '__Host-csrf-token');
    const csrfSecretCookie = cookies.find(c => c.name === '__Host-csrf-secret');

    expect(csrfTokenCookie).toBeDefined();
    expect(csrfTokenCookie?.value).toBeTruthy();
    expect(csrfTokenCookie?.httpOnly).toBe(false); // Client needs to read this
    expect(csrfTokenCookie?.sameSite).toBe('Strict');

    expect(csrfSecretCookie).toBeDefined();
    expect(csrfSecretCookie?.httpOnly).toBe(true); // Server-only
    expect(csrfSecretCookie?.sameSite).toBe('Strict');
  });

  test('should fetch CSRF token from API endpoint', async ({ page }) => {
    const response = await page.request.get('/api/csrf');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.csrfToken).toBeTruthy();

    // Verify token is also set in cookies
    const cookies = await page.context().cookies();
    const csrfTokenCookie = cookies.find(c => c.name === '__Host-csrf-token');
    expect(csrfTokenCookie?.value).toBe(data.csrfToken);
  });

  test('should include CSRF token in tRPC mutation requests', async ({ page }) => {
    // Navigate to feedback page
    await page.goto('/feedback');

    // Intercept tRPC requests
    let csrfTokenIncluded = false;
    await page.route('**/api/trpc/**', async (route) => {
      const headers = route.request().headers();
      if (headers['x-csrf-token']) {
        csrfTokenIncluded = true;
      }
      await route.continue();
    });

    // Trigger a mutation (try to create feedback)
    await page.click('button:has-text("Give Feedback")');
    await page.fill('textarea[name="content"]', 'Great work on the project!');

    // Submit the form
    await page.click('button[type="submit"]:has-text("Submit")');

    // Wait a bit for the request
    await page.waitForTimeout(1000);

    // Verify CSRF token was included
    expect(csrfTokenIncluded).toBe(true);
  });

  test('should reject mutations without CSRF token', async ({ page, context }) => {
    // Get authentication cookies but clear CSRF cookies
    const authCookies = (await context.cookies()).filter(
      c => !c.name.includes('csrf')
    );

    // Create a new context without CSRF cookies
    const newContext = await page.context().browser()?.newContext({
      storageState: {
        cookies: authCookies,
        origins: [],
      },
    });

    if (!newContext) {
      throw new Error('Failed to create new context');
    }

    const newPage = await newContext.newPage();

    // Try to make a mutation without CSRF token
    const response = await newPage.request.post('/api/trpc/feedback.create', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        receiverId: 'test-user-id',
        content: 'Test feedback without CSRF',
      },
    });

    // Should fail with 403 Forbidden
    expect(response.status()).toBe(403);

    // Check error message
    const errorData = await response.json();
    expect(errorData.error?.message).toContain('CSRF');

    await newContext.close();
  });

  test('should allow mutations with valid CSRF token', async ({ page }) => {
    // Navigate to feedback page
    await page.goto('/feedback');

    // Get CSRF token from cookie
    const cookies = await page.context().cookies();
    const csrfToken = cookies.find(c => c.name === '__Host-csrf-token')?.value;

    expect(csrfToken).toBeTruthy();

    // Make a tRPC mutation with CSRF token
    // The tRPC client should automatically include the token
    await page.click('button:has-text("Give Feedback")');

    // Fill in feedback form
    await page.fill('textarea[name="content"]', 'Excellent collaboration!');

    // Select a receiver (assuming there's a select element)
    await page.selectOption('select[name="receiverId"]', { index: 1 });

    // Submit form
    await page.click('button[type="submit"]:has-text("Submit")');

    // Wait for success message or redirect
    await expect(page.locator('text=Feedback submitted successfully')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should allow queries without CSRF token', async ({ page, context }) => {
    // Queries (read operations) should work without CSRF token
    // Get authentication cookies but clear CSRF cookies
    const authCookies = (await context.cookies()).filter(
      c => !c.name.includes('csrf')
    );

    // Create a new context without CSRF cookies
    const newContext = await page.context().browser()?.newContext({
      storageState: {
        cookies: authCookies,
        origins: [],
      },
    });

    if (!newContext) {
      throw new Error('Failed to create new context');
    }

    const newPage = await newContext.newPage();

    // Try to fetch data (query operation)
    const response = await newPage.request.get('/api/trpc/user.list');

    // Should succeed without CSRF token (queries don't need CSRF protection)
    expect(response.ok()).toBeTruthy();

    await newContext.close();
  });

  test('should refresh CSRF token on new session', async ({ page, context }) => {
    // Get current CSRF token
    const initialCookies = await context.cookies();
    const initialToken = initialCookies.find(c => c.name === '__Host-csrf-token')?.value;

    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('/login');

    // Login again
    await page.fill('input[name="email"]', 'john.doe@company.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Get new CSRF token
    const newCookies = await context.cookies();
    const newToken = newCookies.find(c => c.name === '__Host-csrf-token')?.value;

    // Token should be different after new session
    expect(newToken).toBeTruthy();
    expect(newToken).not.toBe(initialToken);
  });

  test('should validate session cookie security settings', async ({ page, context }) => {
    // Check session cookie security
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'employee_profile_session');

    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.sameSite).toBe('Strict'); // Upgraded from 'lax'
    expect(sessionCookie?.secure).toBe(process.env.NODE_ENV === 'production');
  });

  test('should prevent CSRF attack scenario', async ({ page, context, browser }) => {
    // Simulate a CSRF attack scenario
    // 1. User is logged into the application (victim)
    // 2. User visits malicious site (attacker)
    // 3. Malicious site tries to perform action without CSRF token

    // Victim has valid session
    await page.goto('/dashboard');

    // Get victim's cookies
    const victimCookies = await context.cookies();

    // Create attacker context with victim's auth cookie but no CSRF token
    const attackerCookies = victimCookies.filter(
      c => c.name === 'employee_profile_session' // Only session cookie, no CSRF
    );

    const attackerContext = await browser.newContext({
      storageState: {
        cookies: attackerCookies,
        origins: [],
      },
    });

    const attackerPage = await attackerContext.newPage();

    // Attacker tries to submit feedback on behalf of victim
    const response = await attackerPage.request.post('/api/trpc/feedback.create', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        receiverId: 'victim-id',
        content: 'Malicious feedback',
      },
    });

    // Should be blocked due to missing CSRF token
    expect(response.status()).toBe(403);

    const errorData = await response.json();
    expect(errorData.error?.message).toContain('CSRF');

    await attackerContext.close();
  });
});
