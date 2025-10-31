import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('unauthenticated users are redirected to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('users can login with valid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="email"]', 'emily@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
  })

  test('users cannot login with invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="email"]', 'wrong@example.com')
    await page.fill('[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=/invalid/i')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('session persists across page refreshes', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="email"]', 'emily@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')

    // Refresh page
    await page.reload()

    // Verify still on dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Emily Manager')).toBeVisible()
  })

  test('users can switch roles for demo purposes', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="email"]', 'emily@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')

    // Verify current role
    await expect(page.locator('text=Manager')).toBeVisible()

    // Switch role
    await page.click('[data-testid="role-selector"]')
    await page.click('text=Employee')

    // Verify role changed
    await expect(page.locator('text=Employee')).toBeVisible()
  })

  test('users can logout', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="email"]', 'emily@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')

    // Logout
    await page.click('text=Logout')

    // Verify redirected to login
    await expect(page).toHaveURL('/login')

    // Try to access dashboard
    await page.goto('/dashboard')

    // Verify redirected back to login
    await expect(page).toHaveURL('/login')
  })

  test('authenticated users are redirected from login page', async ({ page }) => {
    await page.goto('/login')

    await page.fill('[name="email"]', 'emily@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')

    // Try to go back to login
    await page.goto('/login')

    // Verify redirected to dashboard
    await expect(page).toHaveURL('/dashboard')
  })
})
