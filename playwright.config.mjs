import { defineConfig, devices } from '@playwright/test';

// Mocked API browser scenarios: no database modification and no backend required.
// These verify real rendered React interactions, NOT live MySQL or authenticated CMS CRUD.
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 8000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev:public',
    url: 'http://127.0.0.1:5173',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
