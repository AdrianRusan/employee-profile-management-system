import { test, expect } from '@playwright/test'

test.describe('Absence Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('employee can request time off', async ({ page }) => {
    // Login as employee
    await page.fill('[name="email"]', 'david@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Navigate to absences
    await page.click('text=Absences')

    // Click request time off button
    await page.click('button:has-text("Request Time Off")')

    // Fill in absence request form
    await page.fill('[name="startDate"]', '2024-03-01')
    await page.fill('[name="endDate"]', '2024-03-05')
    await page.fill('[name="reason"]', 'Family vacation for spring break')

    // Submit request
    await page.click('button:has-text("Submit Request")')

    // Verify success
    await expect(page.locator('text=/success/i')).toBeVisible()
    await expect(page.locator('text=Pending')).toBeVisible()
  })

  test('system prevents overlapping absence requests', async ({ page }) => {
    // Login as employee
    await page.fill('[name="email"]', 'david@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    await page.click('text=Absences')

    // Create first absence request
    await page.click('button:has-text("Request Time Off")')
    await page.fill('[name="startDate"]', '2024-04-01')
    await page.fill('[name="endDate"]', '2024-04-05')
    await page.fill('[name="reason"]', 'First vacation period')
    await page.click('button:has-text("Submit Request")')
    await page.waitForTimeout(1000)

    // Try to create overlapping request
    await page.click('button:has-text("Request Time Off")')
    await page.fill('[name="startDate"]', '2024-04-03')
    await page.fill('[name="endDate"]', '2024-04-07')
    await page.fill('[name="reason"]', 'Overlapping vacation')
    await page.click('button:has-text("Submit Request")')

    // Verify error message
    await expect(page.locator('text=/overlap/i')).toBeVisible()
  })

  test('manager can approve absence request', async ({ page }) => {
    // Login as manager
    await page.fill('[name="email"]', 'emily@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    await page.click('text=Absences')

    // View pending requests
    await expect(page.locator('text=Pending Requests')).toBeVisible()

    // Approve a request
    await page.click('button:has-text("Approve")').first()

    // Verify status updated
    await expect(page.locator('text=Approved')).toBeVisible()
  })

  test('manager can reject absence request', async ({ page }) => {
    // Login as manager
    await page.fill('[name="email"]', 'emily@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    await page.click('text=Absences')

    // Reject a request
    await page.click('button:has-text("Reject")').first()

    // Confirm rejection in dialog
    await page.click('button:has-text("Confirm")')

    // Verify status updated
    await expect(page.locator('text=Rejected')).toBeVisible()
  })

  test('calendar view shows absence dates', async ({ page }) => {
    // Login as employee
    await page.fill('[name="email"]', 'david@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    await page.click('text=Absences')

    // Switch to calendar view
    await page.click('text=Calendar View')

    // Verify calendar is visible
    await expect(page.locator('.calendar')).toBeVisible()

    // Verify absence dates are marked
    await expect(page.locator('.absence-date')).toBeVisible()
  })

  test('absence requests are visible to managers and requester', async ({ page }) => {
    // Login as employee
    await page.fill('[name="email"]', 'david@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    await page.click('text=Absences')

    // Verify employee sees their requests
    await expect(page.locator('text=/my requests/i')).toBeVisible()

    // Logout and login as manager
    await page.click('text=Logout')
    await page.fill('[name="email"]', 'emily@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    await page.click('text=Absences')

    // Verify manager sees all requests
    await expect(page.locator('text=/team requests/i')).toBeVisible()
  })
})
