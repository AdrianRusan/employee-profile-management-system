import { test, expect } from '@playwright/test'

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
  })

  test('manager can view and edit any profile', async ({ page }) => {
    // Login as manager
    await page.fill('[name="email"]', 'emily@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')

    // Navigate to profiles
    await page.click('text=Profiles')
    await page.waitForURL('/dashboard/profiles')

    // Click on an employee profile
    await page.click('text=David Developer')
    await page.waitForURL(/\/dashboard\/profiles\/.+/)

    // Verify sensitive data is visible
    await expect(page.locator('text=/salary/i')).toBeVisible()
    await expect(page.locator('text=/performance/i')).toBeVisible()

    // Click edit button
    await page.click('button:has-text("Edit")')

    // Update profile
    await page.fill('[name="title"]', 'Lead Software Engineer')
    await page.click('button:has-text("Save")')

    // Verify success message
    await expect(page.locator('text=/success/i')).toBeVisible()
  })

  test('employee can view and edit their own profile', async ({ page }) => {
    // Login as employee
    await page.fill('[name="email"]', 'david@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')

    // Navigate to own profile
    await page.click('text=My Profile')

    // Verify sensitive data is visible
    await expect(page.locator('text=/salary/i')).toBeVisible()

    // Click edit button
    await page.click('button:has-text("Edit")')

    // Update bio
    await page.fill('[name="bio"]', 'Updated bio with new information')
    await page.click('button:has-text("Save")')

    // Verify update
    await expect(page.locator('text=Updated bio with new information')).toBeVisible()
  })

  test('coworker can only view non-sensitive fields', async ({ page }) => {
    // Login as coworker
    await page.fill('[name="email"]', 'sarah@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Wait for redirect
    await page.waitForURL('/dashboard')

    // Navigate to profiles
    await page.click('text=Profiles')
    await page.click('text=David Developer')

    // Verify non-sensitive data is visible
    await expect(page.locator('text=David Developer')).toBeVisible()
    await expect(page.locator('text=Engineering')).toBeVisible()

    // Verify sensitive data is NOT visible
    await expect(page.locator('text=/salary/i')).not.toBeVisible()
    await expect(page.locator('text=/ssn/i')).not.toBeVisible()
    await expect(page.locator('text=/performance/i')).not.toBeVisible()

    // Verify no edit button
    await expect(page.locator('button:has-text("Edit")')).not.toBeVisible()
  })

  test('profile updates are reflected immediately', async ({ page }) => {
    // Login as employee
    await page.fill('[name="email"]', 'david@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Navigate to profile
    await page.click('text=My Profile')

    // Edit profile
    await page.click('button:has-text("Edit")')
    const newTitle = `Engineer ${Date.now()}`
    await page.fill('[name="title"]', newTitle)
    await page.click('button:has-text("Save")')

    // Verify optimistic update
    await expect(page.locator(`text=${newTitle}`)).toBeVisible()
  })
})
