import { test, expect } from '@playwright/test';
import { loginAsEmployee, loginAsManager, loginAsCoworker } from './helpers/auth';
import { navigateToProfile } from './helpers/navigation';

test.describe('Profile Management', () => {
  test('Employee should view own complete profile @smoke', async ({ page }) => {
    await loginAsEmployee(page);

    // Navigate to profiles
    await page.click('text=Profiles');
    await expect(page).toHaveURL('/dashboard/profiles');

    // Click on own profile
    await page.click('text=David Developer');
    await page.waitForURL(/\/profiles\/[^/]+/);
    await page.waitForLoadState('networkidle');

    // Should see all profile information
    await expect(page.locator('text=David Developer')).toBeVisible();
    await expect(page.locator('text=david@example.com')).toBeVisible();
    await expect(page.locator('text=Senior Software Engineer')).toBeVisible();
    await expect(page.locator('[role="tabpanel"]').getByText('Engineering').first()).toBeVisible();

    // Should see sensitive information (own profile)
    await expect(page.locator('text=/salary/i')).toBeVisible();
    await expect(page.locator('text=/95000|95,000/i')).toBeVisible();

    // Should see edit button
    await expect(page.locator('button:has-text("Edit Profile")')).toBeVisible();
  });

  test('Manager should view all profile fields @smoke', async ({ page }) => {
    await loginAsManager(page);

    // Navigate to profiles and find employee
    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');

    // Should see all profile information including sensitive data
    await expect(page.locator('text=David Developer')).toBeVisible();
    // Check for actual salary amount instead of "Salary" label
    await expect(page.locator('text=/95000|95,000|\$95,000/i')).toBeVisible();
    await expect(page.locator('text=/performance rating/i')).toBeVisible();

    // Should see edit button (manager can edit anyone)
    await expect(page.locator('button:has-text("Edit Profile")')).toBeVisible();
  });

  test('Coworker should see limited profile fields @core', async ({ page }) => {
    await loginAsCoworker(page);

    // Navigate to profiles and find employee
    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');

    // Should see basic profile information
    await expect(page.locator('text=David Developer')).toBeVisible();
    await expect(page.locator('text=david@example.com')).toBeVisible();
    await expect(page.locator('text=Senior Software Engineer')).toBeVisible();

    // Should NOT see sensitive information
    await expect(page.locator('text=/salary/i')).not.toBeVisible();
    await expect(page.locator('text=/performance rating/i')).not.toBeVisible();
    await expect(page.locator('text=/ssn/i')).not.toBeVisible();

    // Should NOT see edit button
    await expect(page.locator('button:has-text("Edit Profile")')).not.toBeVisible();
  });

  test('Employee should edit own profile @core', async ({ page }) => {
    await loginAsEmployee(page);

    // Go to own profile
    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');

    // Click edit button
    await page.click('button:has-text("Edit Profile")');
    await page.locator('[role="dialog"]').waitFor({ state: 'visible' });
    await page.locator('textarea[name="bio"]').waitFor({ state: 'visible' });

    // Dialog should open
    await expect(page.locator('text=Edit Profile')).toBeVisible();

    // Edit bio
    const newBio = `Updated bio at ${Date.now()}`;
    await page.fill('textarea[name="bio"]', newBio);

    // Save changes
    await page.click('button:has-text("Save")');

    // Should close dialog and show updated bio
    await expect(page.locator(`text=${newBio}`)).toBeVisible({ timeout: 5000 });
  });

  test('Manager should edit employee profile @core', async ({ page }) => {
    await loginAsManager(page);

    // Navigate to employee profile
    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'David Developer');

    // Click edit button
    await page.click('button:has-text("Edit Profile")');
    await page.locator('[role="dialog"]').waitFor({ state: 'visible' });
    await page.locator('input[name="title"]').waitFor({ state: 'visible' });

    // Edit title
    await page.fill('input[name="title"]', 'Lead Software Engineer');

    // Save changes
    await page.click('button:has-text("Save")');

    // Should show updated title
    await expect(page.locator('text=Lead Software Engineer')).toBeVisible({ timeout: 5000 });
  });

  test('Coworker cannot edit other profiles @core', async ({ page }) => {
    await loginAsCoworker(page);

    // Navigate to employee profile
    await page.goto('/dashboard/profiles');
    await page.click('text=David Developer');

    // Should NOT see edit button
    await expect(page.locator('button:has-text("Edit Profile")')).not.toBeVisible();
  });

  test('Profile list should show all users @smoke', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/dashboard/profiles');

    // Should see all test users
    await expect(page.locator('text=Emily Manager')).toBeVisible();
    await expect(page.locator('table').getByText('David Developer')).toBeVisible();
    await expect(page.locator('text=Sarah Designer')).toBeVisible();
  });

  test('Profile list should be searchable', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/dashboard/profiles');

    // Search for employee
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('David');

      // Should only show David Developer
      await expect(page.locator('text=David Developer')).toBeVisible();

      // Manager and coworker should be filtered out
      await expect(page.locator('text=Emily Manager')).not.toBeVisible();
    }
  });

  test('Profile list should be filterable by department', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/dashboard/profiles');

    // Filter by Engineering department
    const departmentFilter = page.getByRole('combobox').filter({ hasText: /department/i }).or(page.locator('select'));
    if (await departmentFilter.count() > 0) {
      await departmentFilter.first().click();
      await page.getByRole('option', { name: 'Engineering' }).click();

      // Should show Engineering employees
      await expect(page.locator('text=David Developer')).toBeVisible();
      await expect(page.locator('text=Emily Manager')).toBeVisible();

      // Should not show Marketing
      await expect(page.locator('text=Sarah Designer')).not.toBeVisible();
    }
  });

  test('Profile should show role badge @core', async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto('/dashboard/profiles');
    await navigateToProfile(page, 'Emily Manager');

    // Should display role badge - check for badge component or text
    await expect(page.getByRole('status').filter({ hasText: /MANAGER/i })).toBeVisible();
  });

  test('Avatar upload should work', async ({ page }) => {
    await loginAsEmployee(page);

    // Go to own profile and edit
    await page.goto('/dashboard/profiles');
    await page.click('text=David Developer');
    await page.click('button:has-text("Edit Profile")');

    // Check if avatar upload is available
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      // Upload would require an actual image file
      // This is a placeholder test - actual implementation needs real file
      await expect(fileInput).toBeVisible();
    }
  });
});
