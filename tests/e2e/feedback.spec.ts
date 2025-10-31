import { test, expect } from '@playwright/test'

test.describe('Feedback System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('coworker can leave feedback on employee profile', async ({ page }) => {
    // Login as coworker
    await page.fill('[name="email"]', 'sarah@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Navigate to employee profile
    await page.click('text=Profiles')
    await page.click('text=David Developer')

    // Navigate to feedback tab
    await page.click('text=Feedback')

    // Write feedback
    const feedbackContent = 'Great work on the recent project! Your attention to detail was impressive.'
    await page.fill('textarea[name="content"]', feedbackContent)

    // Submit feedback
    await page.click('button:has-text("Submit")')

    // Verify success message
    await expect(page.locator('text=/success/i')).toBeVisible()
  })

  test('AI polish feature works with feedback', async ({ page }) => {
    // Login as coworker
    await page.fill('[name="email"]', 'sarah@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Navigate to employee profile
    await page.click('text=Profiles')
    await page.click('text=David Developer')
    await page.click('text=Feedback')

    // Write feedback
    await page.fill('textarea[name="content"]', 'good job on project')

    // Click polish button
    await page.click('button:has-text("Polish with AI")')

    // Wait for polished version
    await expect(page.locator('text=/polished/i')).toBeVisible({ timeout: 10000 })

    // Verify toggle between versions
    await page.click('text=/show original/i')
    await expect(page.locator('text=good job on project')).toBeVisible()
  })

  test('employee can view feedback on their profile', async ({ page }) => {
    // Login as employee
    await page.fill('[name="email"]', 'david@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Navigate to feedback page
    await page.click('text=Feedback')

    // Verify feedback list is visible
    await expect(page.locator('text=/feedback/i')).toBeVisible()
  })

  test('manager can view all feedback', async ({ page }) => {
    // Login as manager
    await page.fill('[name="email"]', 'emily@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Navigate to any employee profile
    await page.click('text=Profiles')
    await page.click('text=David Developer')
    await page.click('text=Feedback')

    // Verify feedback is visible
    await expect(page.locator('text=/feedback/i')).toBeVisible()
  })

  test('coworker cannot view another employee feedback', async ({ page }) => {
    // Login as coworker
    await page.fill('[name="email"]', 'sarah@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Try to navigate to another employee's feedback
    await page.goto('/dashboard/feedback')

    // Should only see own feedback or empty state
    await expect(page.locator('text=/your feedback/i')).toBeVisible()
  })

  test('feedback shows giver name and timestamp', async ({ page }) => {
    // Login as employee to view received feedback
    await page.fill('[name="email"]', 'david@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    await page.click('text=Feedback')

    // Verify feedback metadata
    await expect(page.locator('text=/from/i')).toBeVisible()
    await expect(page.locator('text=/ago/i')).toBeVisible()
  })
})
