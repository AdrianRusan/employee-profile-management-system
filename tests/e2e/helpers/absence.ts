import { Page } from '@playwright/test';

/**
 * Helper function to fill absence request form with date picker interactions
 * @param page - Playwright page object
 * @param startDay - Day of month for start date (e.g., 15)
 * @param endDay - Day of month for end date (e.g., 20)
 * @param reason - Reason for absence request
 */
export async function fillAbsenceRequest(
  page: Page,
  startDay: number,
  endDay: number,
  reason: string
) {
  // Fill reason first
  await page.getByPlaceholder('Please provide a reason for your absence request...').fill(reason);

  // Select start date
  await page.getByRole('button', { name: /pick a date/i }).first().click();
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  await page.locator('[role="gridcell"]').filter({ hasText: new RegExp(`^${startDay}$`) }).click();

  // Select end date
  await page.getByRole('button', { name: /pick a date/i }).nth(1).click();
  await page.locator('[role="gridcell"]').filter({ hasText: new RegExp(`^${endDay}$`) }).click();

  // Submit
  await page.getByRole('button', { name: 'Submit Request' }).click();
}
