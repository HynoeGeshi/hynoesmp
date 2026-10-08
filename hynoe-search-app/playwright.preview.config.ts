import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-2027',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { outputFolder: 'preview-test-report', open: 'never' }]],
  outputDir: 'preview-test-results',
  use: { baseURL: 'http://127.0.0.1:3100', browserName: 'chromium', headless: true, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run start -- -H 127.0.0.1 -p 3100', url: 'http://127.0.0.1:3100/preview', reuseExistingServer: false, timeout: 120000 },
});
