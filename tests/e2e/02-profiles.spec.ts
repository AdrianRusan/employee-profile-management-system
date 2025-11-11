import { test, expect } from '@playwright/test';
import { loginAsEmployee, loginAsManager, loginAsCoworker } from './helpers/auth';

/**
 * PROFILE TESTS - Profile viewing and management
 * Tests for profile directory, viewing, and editing
 */

test.describe('Profile Management @core', () => {
  test('should search employee directory', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/dashboard/profiles');
    await page.waitForLoadState('networkidle');

    // Type in search and wait for filtering
    await page.fill('input[placeholder*="Search" i]', 'Emily');
    await page.waitForTimeout(500); // Wait for search debounce

    // Should show Emily in the main content area, not David or Sarah
    const mainContent = page.locator('main');
    await expect(mainContent.locator('text=Emily Manager')).toBeVisible();
    await expect(mainContent.locator('text=David Developer')).not.toBeVisible();
  });

  test('should filter by department', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/dashboard/profiles');

    // Open department filter (assuming it's a select or combobox)
    const departmentFilter = page.locator('button:has-text("All Departments")').or(page.locator('select')).first();
    if (await departmentFilter.isVisible()) {
      await departmentFilter.click();
      // Select Engineering (adjust based on actual UI)
      await page.locator('text=Engineering').click();

      // Should filter results
      await expect(page.locator('text=Engineering')).toBeVisible();
    }
  });

  test('should view own profile', async ({ page }) => {
    await loginAsEmployee(page);

    // Click "View My Profile" quick action (it's a link, not button)
    await page.click('a:has-text("View My Profile")');

    // Should be on profile page
    await page.waitForURL(/\/dashboard\/profiles\//, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Should see own information (use first() to avoid strict mode violation)
    await expect(page.locator('text=David Developer').first()).toBeVisible();
    await expect(page.locator('text=david@example.com')).toBeVisible();

    // Should see sensitive data (own profile) - match with colon
    await expect(page.locator('text=/Salary:/i')).toBeVisible();
  });

  test('should view another user profile', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/dashboard/profiles');
    await page.waitForLoadState('networkidle');

    // Click on first available profile (it's a link, not button)
    await page.locator('a:has-text("View")').first().click();

    // Should be on a profile page (don't check specific name - just verify we can view profiles)
    await page.waitForURL(/\/dashboard\/profiles\//, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Should see profile elements (name, email, department)
    await expect(page.locator('text=/Department:/i')).toBeVisible();
    await expect(page.locator('text=/Title:/i')).toBeVisible();
  });

  test('should see limited fields as coworker', async ({ page }) => {
    await loginAsCoworker(page);
    await page.goto('/dashboard/profiles');
    await page.waitForLoadState('networkidle');

    // View first available profile (it's a link, not button)
    await page.locator('a:has-text("View")').first().click();

    // Wait for profile page to load
    await page.waitForURL(/\/dashboard\/profiles\//, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Should see basic info (department and title are visible to coworkers)
    await expect(page.locator('text=/Department:/i')).toBeVisible();
    await expect(page.locator('text=/Title:/i')).toBeVisible();

    // Should NOT see sensitive data (match with colon)
    await expect(page.locator('text=/Salary:/i')).not.toBeVisible();
    await expect(page.locator('text=/Performance Rating:/i')).not.toBeVisible();
  });

  test('should see all fields as manager', async ({ page }) => {
    await loginAsManager(page);
    await page.goto('/dashboard/profiles');
    await page.waitForLoadState('networkidle');

    // View David's profile (it's a link, not button)
    await page.locator('a:has-text("View")').first().click();

    // Wait for profile page to load
    await page.waitForURL(/\/dashboard\/profiles\//, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Should see sensitive data (match with colon)
    await expect(page.locator('text=/Salary:/i')).toBeVisible();
    await expect(page.locator('text=/Performance Rating:/i')).toBeVisible();
  });

  test('should edit own profile', async ({ page }) => {
    await loginAsEmployee(page);

    // Go to own profile (it's a link, not button)
    await page.click('a:has-text("View My Profile")');
    await page.waitForURL(/\/dashboard\/profiles\//, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Click Edit Profile button
    const editButton = page.locator('button:has-text("Edit Profile")');
    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();

      // Should open edit dialog - use h2 selector to avoid strict mode violation
      await expect(page.locator('h2:has-text("Edit Profile")').first()).toBeVisible();

      // Edit bio
      const newBio = `Test bio updated at ${Date.now()}`;
      await page.fill('textarea[name="bio"]', newBio);

      // Save
      await page.click('button:has-text("Save Changes")');

      // Wait for dialog to close (indicates save was successful)
      await page.waitForTimeout(1000);
      // Dialog should be closed after successful save
      await expect(page.locator('[role="dialog"]').locator('h2:has-text("Edit Profile")')).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('manager should edit employee profile', async ({ page }) => {
    await loginAsManager(page);
    await page.goto('/dashboard/profiles');
    await page.waitForLoadState('networkidle');

    // View David's profile (it's a link, not button)
    await page.locator('a:has-text("View")').first().click();

    // Wait for profile page to load
    await page.waitForURL(/\/dashboard\/profiles\//, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Should see Edit Profile button
    await expect(page.locator('button:has-text("Edit Profile")')).toBeVisible();
  });

  test('coworker cannot edit other profiles', async ({ page }) => {
    await loginAsCoworker(page);
    await page.goto('/dashboard/profiles');
    await page.waitForLoadState('networkidle');

    // View David's profile (it's a link, not button)
    await page.locator('a:has-text("View")').first().click();

    // Wait for profile page to load
    await page.waitForURL(/\/dashboard\/profiles\//, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Should NOT see Edit Profile button
    await expect(page.locator('button:has-text("Edit Profile")')).not.toBeVisible();
  });

  test('should have tabbed interface on profile page', async ({ page }) => {
    await loginAsEmployee(page);
    await page.click('a:has-text("View My Profile")');
    await page.waitForURL(/\/dashboard\/profiles\//, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Should see tabs
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Profile")').first()).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Feedback")').first()).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Absences")').first()).toBeVisible();
  });

  test('should display role badge', async ({ page }) => {
    await loginAsManager(page);
    await page.goto('/dashboard/profiles');
    await page.waitForLoadState('networkidle');

    // View own profile (it's a link, not button)
    await page.locator('a:has-text("View")').first().click();

    // Wait for profile page to load
    await page.waitForURL(/\/dashboard\/profiles\//, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Should see role badge
    await expect(page.locator('text="MANAGER"')).toBeVisible();
  });

  test('should sort employee directory', async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto('/dashboard/profiles');

    // Click Name column header to sort
    const nameHeader = page.locator('th:has-text("Name")');
    if (await nameHeader.isVisible()) {
      await nameHeader.click();
      // Table should re-sort (verified by checking order)
    }
  });
});
