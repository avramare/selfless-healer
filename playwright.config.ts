import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: 'https://testautomationpractice.blogspot.com',
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    testIdAttribute: "data-test",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});