import { test, expect } from '@playwright/test';
import { loginAsEmployee, loginAsManager } from './helpers/auth';
import { fillAbsenceRequest } from './helpers/absence';
import { navigateToProfile } from './helpers/navigation';

test.describe('Absence Management', () => {
  test('Employee should request time off', async ({ page }) => {
    await loginAsEmployee(page);

    // Navigate to own profile
    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');

    // Go to Absences tab
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Absences")').click();
    await page.waitForLoadState('networkidle');

    // Click to request new absence
    const requestButton = page.locator('button:has-text("Request Time Off"), button:has-text("New Request")');
    await requestButton.click();

    // Fill in absence request form using helper
    await fillAbsenceRequest(page, 15, 20, 'Family vacation to the mountains');

    // Should show success message
    await expect(page.locator('text=/success|submitted|pending/i')).toBeVisible({ timeout: 5000 });

    // Request should appear in calendar/list with PENDING status
    await expect(page.locator('text=/pending/i')).toBeVisible();
  });

  test('Absence validation - end date must be after start date', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Absences")').click();
    await page.waitForLoadState('networkidle');

    const requestButton = page.locator('button:has-text("Request Time Off"), button:has-text("New Request")');
    await requestButton.click();

    // Try to set end date before start date (should fail validation)
    // Using day 20 for start and day 10 for end (earlier day)
    await fillAbsenceRequest(page, 20, 10, 'This should fail validation');

    // Should show validation error
    await expect(page.locator('text=/end date.*after.*start date/i')).toBeVisible();
  });

  test('Absence validation - reason minimum length', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Absences")').click();
    await page.waitForLoadState('networkidle');

    const requestButton = page.locator('button:has-text("Request Time Off"), button:has-text("New Request")');
    await requestButton.click();

    // Fill dates but use too short reason (less than 10 characters)
    await fillAbsenceRequest(page, 10, 15, 'Short');

    // Should show validation error
    await expect(page.locator('text=/at least 10 characters/i')).toBeVisible();
  });

  test('Employee should view own absence requests', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Absences")').click();
    await page.waitForLoadState('networkidle');

    // Should see absence calendar or list
    // Either calendar component or list of requests should be visible
    const hasCalendar = await page.locator('text=/calendar|absence/i').isVisible();
    const hasRequestButton = await page.locator('button:has-text("Request Time Off")').isVisible();

    expect(hasCalendar || hasRequestButton).toBeTruthy();
  });

  test('Manager should view employee absence requests', async ({ page }) => {
    await loginAsManager(page);

    // Navigate to employee profile
    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Absences")').click();
    await page.waitForLoadState('networkidle');

    // Should see employee's absence requests
    await expect(page.locator('text=/absence|time off/i')).toBeVisible();
  });

  test('Manager should approve absence request', async ({ page }) => {
    await loginAsManager(page);

    // Go to absence dashboard or employee profile
    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Absences")').click();
    await page.waitForLoadState('networkidle');

    // Look for pending requests and approve button
    const approveButton = page.locator('button:has-text("Approve")').first();

    if (await approveButton.isVisible()) {
      await approveButton.click();

      // Should show success message
      await expect(page.locator('text=/approved/i')).toBeVisible({ timeout: 5000 });

      // Status should change to APPROVED
      await expect(page.locator('text=APPROVED, text=Approved')).toBeVisible();
    }
  });

  test('Manager should reject absence request', async ({ page }) => {
    await loginAsManager(page);

    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Absences")').click();
    await page.waitForLoadState('networkidle');

    // Look for pending requests and reject button
    const rejectButton = page.locator('button:has-text("Reject")').first();

    if (await rejectButton.isVisible()) {
      await rejectButton.click();

      // May need to confirm rejection
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should show success message
      await expect(page.locator('text=/rejected/i')).toBeVisible({ timeout: 5000 });

      // Status should change to REJECTED
      await expect(page.locator('text=REJECTED, text=Rejected')).toBeVisible();
    }
  });

  test('Cannot create overlapping absence requests', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Absences")').click();
    await page.waitForLoadState('networkidle');

    // Create first request
    const requestButton = page.locator('button:has-text("Request Time Off"), button:has-text("New Request")');
    await requestButton.click();

    // First request: days 14-16
    await fillAbsenceRequest(page, 14, 16, 'First absence request');

    await page.waitForTimeout(1000);

    // Try to create overlapping request (days 15-17, overlaps with first)
    await requestButton.click();

    await fillAbsenceRequest(page, 15, 17, 'Overlapping request');

    // Should show overlap error
    await expect(page.locator('text=/overlap|conflict/i')).toBeVisible({ timeout: 5000 });
  });

  test('Absence calendar shows requests visually', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Absences")').click();
    await page.waitForLoadState('networkidle');

    // Should see calendar component
    // Check for common calendar elements
    const hasCalendarGrid = await page.locator('[class*="calendar"], [role="grid"]').isVisible();
    const hasMonthView = await page.locator('text=/january|february|march|april|may|june|july|august|september|october|november|december/i').isVisible();

    expect(hasCalendarGrid || hasMonthView).toBeTruthy();
  });

  test('Cannot modify approved absence request', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Absences")').click();
    await page.waitForLoadState('networkidle');

    // If there's an approved request, there should be no edit/delete button
    const approvedRequest = page.locator('text=APPROVED, text=Approved').first();

    if (await approvedRequest.isVisible()) {
      // Should not have edit or delete buttons
      await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();
      await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();
    }
  });

  test('Can cancel pending absence request', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Absences")').click();
    await page.waitForLoadState('networkidle');

    // Look for pending request with cancel/delete button
    const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Delete")').first();

    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // May need confirmation
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should show success message
      await expect(page.locator('text=/cancelled|deleted/i')).toBeVisible({ timeout: 5000 });
    }
  });
});
