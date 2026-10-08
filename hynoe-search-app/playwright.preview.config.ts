import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-2027',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { outputFolder: 'preview-test-report', open: 'never' }]],
  outputDir: 'preview-test-results',
  use: { baseURL: 'http://localhost:3100', browserName: 'chromium', headless: true, actionTimeout: 12000, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  // localhost is allowed by the existing host router; do not broaden production hosts for a test.
  webServer: { command: 'npm start -- --hostname 127.0.0.1 --port 3100', url: 'http://localhost:3100/preview', reuseExistingServer: false, timeout: 60000, stdout: 'pipe', stderr: 'pipe' },
});
