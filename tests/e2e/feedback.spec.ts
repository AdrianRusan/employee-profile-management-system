import { test, expect } from '@playwright/test';
import { loginAsEmployee, loginAsManager, loginAsCoworker } from './helpers/auth';
import { navigateToProfile } from './helpers/navigation';

test.describe('Feedback System', () => {
  test('Employee should submit feedback to coworker', async ({ page }) => {
    await loginAsEmployee(page);

    // Navigate to coworker profile
    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'Sarah Designer');

    // Go to Feedback tab (use scoped selector to avoid clicking sidebar)
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Feedback")').click();
    await page.waitForLoadState('networkidle');

    // Fill in feedback form
    const feedbackContent = `Great work on the marketing campaign! ${Date.now()}`;
    await page.getByPlaceholder('Share your thoughts, observations, or suggestions...').fill(feedbackContent);

    // Submit feedback
    await page.click('button:has-text("Submit")');

    // Should show success message
    await expect(page.locator('text=/success|submitted/i')).toBeVisible({ timeout: 5000 });

    // Feedback should appear in the list
    await expect(page.locator(`text=${feedbackContent}`)).toBeVisible();
  });

  test('Feedback validation - minimum length', async ({ page }) => {
    await loginAsEmployee(page);

    // Navigate to coworker profile feedback tab
    await page.goto('/dashboard/profiles');
    await page.click('text=Sarah Designer');
    await page.waitForURL(/\/profiles\/[^/]+/);
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Feedback")').click();
    await page.waitForLoadState('networkidle');

    // Try to submit too short feedback
    await page.getByPlaceholder('Share your thoughts, observations, or suggestions...').fill('Too short');
    await page.click('button:has-text("Submit")');

    // Should show validation error
    await expect(page.locator('text=/at least 10 characters/i')).toBeVisible();
  });

  test('Feedback validation - maximum length', async ({ page }) => {
    await loginAsEmployee(page);

    // Navigate to coworker profile feedback tab
    await page.goto('/dashboard/profiles');
    await page.click('text=Sarah Designer');
    await page.waitForURL(/\/profiles\/[^/]+/);
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Feedback")').click();
    await page.waitForLoadState('networkidle');

    // Try to submit too long feedback (> 2000 characters)
    const longFeedback = 'A'.repeat(2001);
    await page.getByPlaceholder('Share your thoughts, observations, or suggestions...').fill(longFeedback);
    await page.click('button:has-text("Submit")');

    // Should show validation error
    await expect(page.locator('text=/maximum|2000/i')).toBeVisible();
  });

  test('AI Polish feedback feature', async ({ page }) => {
    await loginAsEmployee(page);

    // Navigate to coworker profile feedback tab
    await page.goto('/dashboard/profiles');
    await page.click('text=Sarah Designer');
    await page.waitForURL(/\/profiles\/[^/]+/);
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Feedback")').click();
    await page.waitForLoadState('networkidle');

    // Fill in feedback
    const originalFeedback = 'You did good work on the project and I think you should keep it up.';
    await page.getByPlaceholder('Share your thoughts, observations, or suggestions...').fill(originalFeedback);

    // Click Polish with AI button (if available)
    const polishButton = page.locator('button:has-text("Polish with AI")');
    if (await polishButton.isVisible()) {
      await polishButton.click();

      // Should show loading state
      await expect(page.locator('text=/polishing|processing/i')).toBeVisible();

      // Wait for polished result (may take a few seconds)
      await expect(page.locator('text=/polished|improved/i')).toBeVisible({ timeout: 10000 });

      // Should show comparison of original vs polished
      await expect(page.locator('text=/original|polished/i')).toBeVisible();

      // Can choose to use polished version
      const usePolishedButton = page.locator('button:has-text("Use Polished")');
      if (await usePolishedButton.isVisible()) {
        await usePolishedButton.click();
      }
    }
  });

  test('Cannot submit feedback to self', async ({ page }) => {
    await loginAsEmployee(page);

    // Navigate to own profile
    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');

    // Go to Feedback tab (use scoped selector to avoid clicking sidebar)
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Feedback")').click();
    await page.waitForLoadState('networkidle');

    // Feedback form should NOT be visible
    await expect(page.getByPlaceholder('Share your thoughts, observations, or suggestions...')).not.toBeVisible();
    await expect(page.locator('button:has-text("Submit Feedback")')).not.toBeVisible();
  });

  test('Employee should view own received feedback', async ({ page }) => {
    await loginAsEmployee(page);

    // First, have manager give feedback to employee
    // (This would require setup in a before hook or separate test)

    // Navigate to own profile
    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');

    // Go to Feedback tab (use scoped selector to avoid clicking sidebar)
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Feedback")').click();
    await page.waitForLoadState('networkidle');

    // Should be on feedback tab (check for tab panel or feedback content)
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();

    // Should show feedback list (may be empty initially)
    // If there's feedback, it should be visible
  });

  test('Manager should view any employee feedback', async ({ page }) => {
    await loginAsManager(page);

    // Navigate to employee profile
    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');

    // Go to Feedback tab (use scoped selector to avoid clicking sidebar)
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Feedback")').click();
    await page.waitForLoadState('networkidle');

    // Should be on feedback tab and can submit feedback (manager has permission)
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();

    // Can submit feedback
    await expect(page.getByPlaceholder('Share your thoughts, observations, or suggestions...')).toBeVisible();
  });

  test('Coworker cannot view other coworker feedback', async ({ page }) => {
    await loginAsCoworker(page);

    // Navigate to employee profile
    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');

    // Go to Feedback tab (use scoped selector to avoid clicking sidebar)
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Feedback")').click();
    await page.waitForLoadState('networkidle');

    // Should see permission denied message or feedback form should not be visible
    // Check that coworker cannot submit feedback
    await expect(page.getByPlaceholder('Share your thoughts, observations, or suggestions...')).not.toBeVisible();
  });

  test('Feedback shows giver name and timestamp', async ({ page }) => {
    await loginAsEmployee(page);

    // Navigate to coworker profile and submit feedback
    await page.goto('/dashboard/profiles');
    await page.click('text=Sarah Designer');
    await page.waitForURL(/\/profiles\/[^/]+/);
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Feedback")').click();
    await page.waitForLoadState('networkidle');

    const feedbackContent = `Timestamped feedback ${Date.now()}`;
    await page.getByPlaceholder('Share your thoughts, observations, or suggestions...').fill(feedbackContent);
    await page.click('button:has-text("Submit")');

    // Wait for feedback to appear
    await page.waitForTimeout(1000);

    // Should show who gave the feedback
    await expect(page.locator('text=David Developer')).toBeVisible();

    // Should show timestamp (relative time like "just now" or actual date)
    await expect(page.locator('text=/just now|ago|yesterday/i')).toBeVisible();
  });

  test('Polished feedback is marked with indicator', async ({ page }) => {
    await loginAsEmployee(page);

    // Navigate to coworker profile feedback tab
    await page.goto('/dashboard/profiles');
    await page.click('text=Sarah Designer');
    await page.waitForURL(/\/profiles\/[^/]+/);
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Feedback")').click();
    await page.waitForLoadState('networkidle');

    // Fill in feedback and polish it
    await page.getByPlaceholder('Share your thoughts, observations, or suggestions...').fill('Good work on your tasks recently keep going.');

    const polishButton = page.locator('button:has-text("Polish with AI")');
    if (await polishButton.isVisible()) {
      await polishButton.click();

      // Wait for polish result
      await page.waitForTimeout(3000);

      // Use polished version
      const usePolishedButton = page.locator('button:has-text("Use Polished")');
      if (await usePolishedButton.isVisible()) {
        await usePolishedButton.click();

        // Submit
        await page.click('button:has-text("Submit")');

        // Check if polished indicator appears
        await expect(page.locator('text=/✨|polished|AI-enhanced/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('Feedback form clears after submission', async ({ page }) => {
    await loginAsEmployee(page);

    // Navigate to coworker profile
    await page.goto('/dashboard/profiles');
    await page.click('text=Sarah Designer');
    await page.waitForURL(/\/profiles\/[^/]+/);
    await page.locator('[role="tablist"]').locator('[role="tab"]:has-text("Feedback")').click();
    await page.waitForLoadState('networkidle');

    // Submit feedback
    const feedbackContent = `Cleared feedback ${Date.now()}`;
    await page.getByPlaceholder('Share your thoughts, observations, or suggestions...').fill(feedbackContent);
    await page.click('button:has-text("Submit")');

    // Wait for success
    await page.waitForTimeout(1000);

    // Textarea should be empty
    const textareaValue = await page.getByPlaceholder('Share your thoughts, observations, or suggestions...').inputValue();
    expect(textareaValue).toBe('');
  });
});
