import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/docs', workers: 1, timeout: 45000, retries: 0,
  outputDir: './test-results/docs-browser',
  reporter: [['list'], ['json', { outputFile: 'test-results/docs-regression.json' }]],
  use: { baseURL: 'http://127.0.0.1:4180', headless: true, actionTimeout: 10000, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'node scripts/serve-docs.mjs', url: 'http://127.0.0.1:4180', reuseExistingServer: !process.env.CI }
});
