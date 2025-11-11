import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Dynamic worker configuration based on test suite */
  workers: process.env.CI
    ? process.env.TEST_SUITE === 'smoke'
      ? 4
      : process.env.TEST_SUITE === 'core'
        ? 3
        : 2
    : 3, // Reduced from unlimited to 3 workers locally to prevent server overload
  /* Dynamic timeout based on test suite */
  timeout: process.env.TEST_SUITE === 'smoke' ? 30 * 1000 : 45 * 1000, // Increased timeouts for local dev server
  /* Grep patterns for test filtering by suite */
  grep: process.env.TEST_SUITE === 'smoke'
    ? /@smoke/
    : process.env.TEST_SUITE === 'core'
      ? /@smoke|@core/
      : undefined, // Run all tests if no suite specified
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [['html'], ['github'], ['list']] : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Navigation timeout */
    navigationTimeout: 10 * 1000, // 10 seconds for page loads
    /* Action timeout */
    actionTimeout: 10 * 1000, // 10 seconds for actions
    /* Screenshot on failure only to save space */
    screenshot: 'only-on-failure',
    /* Video only for full suite runs */
    video: process.env.TEST_SUITE === 'full' ? 'retain-on-failure' : 'off',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Only run Chromium tests locally for speed
    // Uncomment below to test other browsers when needed
    // ...(process.env.CI
    //   ? []
    //   : [
    //       {
    //         name: 'firefox',
    //         use: { ...devices['Desktop Firefox'] },
    //       },
    //
    //       {
    //         name: 'webkit',
    //         use: { ...devices['Desktop Safari'] },
    //       },
    //
    //       /* Test against mobile viewports. */
    //       {
    //         name: 'Mobile Chrome',
    //         use: { ...devices['Pixel 5'] },
    //         },
    //       {
    //         name: 'Mobile Safari',
    //         use: { ...devices['iPhone 12'] },
    //       },
    //     ]),
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npx prisma generate && npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for server startup
  },
})
