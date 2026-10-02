import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', testMatch: '**/*.spec.mjs', workers: 1, fullyParallel: false,
  outputDir: './test-results/ghost-browser',
  timeout: 180000, expect: { timeout: 15000 }, retries: 0, maxFailures: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/ghost-regression.json' }], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: { browserName: 'chromium', headless: true, actionTimeout: 15000, navigationTimeout: 45000, trace: 'retain-on-failure', screenshot: 'only-on-failure' }
});
