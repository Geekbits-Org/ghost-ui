import fs from 'node:fs';
import { test, expect } from '@playwright/test';
const registry = JSON.parse(fs.readFileSync(new URL('../../registry/index.json', import.meta.url), 'utf8'));

for (const component of registry) test(`${component.name}: documentation controls and responsive customized previews`, async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect((await page.goto(`/components/${component.name}/`)).status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    const preview = page.locator('[data-component-preview]');
    const frame = page.frameLocator('.preview-frame');
    await preview.locator('[name="variant"]').selectOption('custom');
    for (const style of ['css', 'tailwind']) {
      await preview.locator('[name="style"]').selectOption(style);
      await preview.locator('[name="scheme"]').selectOption('dark');
      await expect(page.locator('.preview-frame')).toHaveAttribute('src', new RegExp(`-${style}-dark-custom-visitor.html$`));
      await expect(frame.locator('.demo-root')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect(await frame.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      if (component.name === 'table-of-contents') {
        await expect(frame.locator('.demo-link')).toHaveCount(3);
        await frame.locator('.demo-link').nth(1).focus();
        await frame.locator('.demo-link').nth(1).press('Enter');
        await expect(frame.locator('.ghcn-article-content h3')).toBeFocused();
      }
    }
    const copy = page.locator('[data-copy]').first();
    await copy.click();
    await expect(copy.locator('..').locator('..').locator('.copy-status')).toContainText(/Copied|Select and copy/);
  }
  expect(errors).toEqual([]);
});

test('membership demo switching never submits reader data', async ({ page }) => {
  const writes = [];
  page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url()); });
  await page.goto('/components/newsletter-form/');
  const frame = page.frameLocator('.preview-frame');
  await frame.getByRole('textbox').fill('demo@example.test');
  await frame.getByRole('button', { name: 'Subscribe', exact: true }).click();
  await expect(page.locator('.preview-status')).toContainText('No email was sent or stored');
  await page.locator('[name="member"]').selectOption('disabled');
  await expect(frame.locator('.preview-empty')).toBeVisible();
  expect(writes).toEqual([]);
});
