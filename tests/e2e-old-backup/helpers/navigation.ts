import { Page } from '@playwright/test';

/**
 * Navigate to a specific user's profile from the profiles list page
 * @param page - Playwright page object
 * @param userName - Full name of the user (e.g., "David Developer")
 */
export async function navigateToProfile(page: Page, userName: string) {
  // Find the row containing the user's name and click the View button
  await page
    .getByRole('row', { name: new RegExp(userName, 'i') })
    .getByRole('link', { name: 'View' })
    .click();

  // Wait for navigation to complete
  await page.waitForURL(/\/profiles\/[^/]+/);
  await page.waitForLoadState('networkidle');
}
