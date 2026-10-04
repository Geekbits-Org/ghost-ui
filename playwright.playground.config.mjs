import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/playground', workers: 1, timeout: 60000, retries: 0, maxFailures: 1,
  outputDir: './test-results/playground-browser',
  reporter: [['list'], ['json', { outputFile: 'test-results/playground-regression.json' }]],
  use: { headless: true, actionTimeout: 10000, screenshot: 'only-on-failure', trace: 'retain-on-failure' }
});
