import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { test, expect } from '@playwright/test';
import { textContrast as contrast } from '../helpers/contrast.mjs';
const require = createRequire(new URL('../../packages/cli/package.json', import.meta.url));
const { startPlayground } = require('./dist/utils/playground-server');
const { buildGhostcnConfig, initializeThemeProject } = require('./dist/utils/theme-project');
const { scaffoldTheme } = require('./dist/utils/theme-scaffold');
const { installComponent } = require('./dist/utils/component-installer');
const registry = JSON.parse(fs.readFileSync(new URL('../../registry/index.json', import.meta.url)));
let parent;
const fixtures = {};
test.beforeAll(async () => {
  parent = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-playground-browser-'));
  for (const style of ['css','tailwind']) {
    const { themeRoot } = scaffoldTheme({ parentDirectory: parent, themeName: `playground-${style}`, style, colorScheme: 'Auto', packageManager: 'npm' });
    const config = buildGhostcnConfig({ style, baseColor: 'zinc', accentColor: 'ghost', radius: '0.5rem' });
    initializeThemeProject({ themeRoot, config });
    for (const item of registry) await installComponent({ themeRoot, config, componentName: item.name });
    fs.appendFileSync(path.join(themeRoot, 'index.hbs'), '\n{{> "components/button" class="bg-purple-600 text-white rounded-xl"}}\n{{> "components/pricing-table" cardClass="bg-purple-50 text-purple-950 dark:bg-purple-950 dark:text-purple-50 bg-purple-950 text-purple-50"}}\n');
    if (style === 'css') fs.appendFileSync(path.join(themeRoot, 'assets/css/source.css'), '\n.purple-action { background: #9333ea; color: white; border-radius: 12px; }\n');
    if (style === 'css') fs.appendFileSync(path.join(themeRoot, 'assets/css/source.css'), `
.contrast-light { background: #faf5ff; color: #3b0764; }
.contrast-dark { background: #3b0764; color: #faf5ff; }
.contrast-adaptive { background: #faf5ff; color: #3b0764; }
.dark-mode .contrast-adaptive { background: #3b0764; color: #faf5ff; }
@media (prefers-color-scheme: dark) { .auto-color .contrast-adaptive { background: #3b0764; color: #faf5ff; } }
`);
    let build;
    if (style === 'css') build = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: themeRoot, encoding: 'utf8' });
    else {
      fs.mkdirSync(path.join(themeRoot, 'node_modules'));
      fs.symlinkSync(path.dirname(require.resolve('tailwindcss/package.json')), path.join(themeRoot, 'node_modules/tailwindcss'), 'junction');
      build = spawnSync(process.execPath, [path.join(path.dirname(require.resolve('@tailwindcss/cli/package.json')), 'dist/index.mjs'), '-i', 'assets/css/source.css', '-o', 'assets/built/screen.css'], { cwd: themeRoot, encoding: 'utf8' });
    }
    if (build.status !== 0) throw new Error(build.stderr);
    fixtures[style] = { ...(await startPlayground({ themeRoot, port: 0 })), themeRoot };
  }
});
test.afterAll(async () => {
  for (const fixture of Object.values(fixtures)) await fixture.close();
  if (parent && path.dirname(parent) === os.tmpdir() && path.basename(parent).startsWith('ghostcn-playground-browser-')) fs.rmSync(parent, { recursive: true, force: true });
});
for (const style of ['css', 'tailwind']) for (const width of [1280, 390]) test(`${style} ${width}px: installed previews, variants, custom classes, keyboard and schemes`, async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const writes = [];
  page.on('request', request => { if (!['GET','HEAD'].includes(request.method())) writes.push(request.url()); });
  await page.setViewportSize({ width, height: 900 });
  await page.goto(fixtures[style].url);
  await page.locator('#component').selectOption('button');
  const frame = page.frameLocator('#preview');
  await page.locator('[name="variant"]').selectOption('outline');
  await page.locator('[name="size"]').selectOption('sm');
  await expect(frame.locator('.ghcn-ui-button')).toHaveAttribute('data-variant', 'outline');
  await expect(frame.locator('.ghcn-ui-button')).toHaveAttribute('data-size', 'sm');
  const classes = style === 'css' ? 'purple-action' : 'bg-purple-600 text-white rounded-xl';
  await page.locator('[name="class"]').fill(classes);
  await page.locator('[name="class"]').press('Tab');
  await expect(page.locator('#usage')).toContainText(`class="${classes}"`);
  const action = frame.locator('.ghcn-ui-button');
  await expect(action).toHaveCSS('border-radius', '12px');
  const purple = await action.evaluate(el => {
    const canvas = document.createElement('canvas'); const context = canvas.getContext('2d');
    context.fillStyle = getComputedStyle(el).backgroundColor; context.fillRect(0, 0, 1, 1); return [...context.getImageData(0, 0, 1, 1).data];
  });
  expect(purple).toEqual(style === 'tailwind' ? [152,16,250,255] : [147,51,234,255]);
  await action.focus(); await action.press('Enter');
  await expect(frame.locator('#preview-feedback')).toContainText('Demo action');
  await page.locator('[name="disabled"]').selectOption('true');
  await expect(frame.getByRole('button', { name: 'Read the story' })).toBeDisabled();
  for (const scheme of ['light','dark','auto']) {
    await page.locator('#scheme').selectOption(scheme);
    await expect(frame.locator('html')).toHaveClass(scheme === 'dark' ? /dark-mode/ : scheme === 'auto' ? /auto-color/ : '');
  }
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme });
    await page.locator('#reload').click();
    await expect(frame.locator('body')).toHaveCSS('background-color', colorScheme === 'dark' ? 'rgb(9, 9, 11)' : 'rgb(255, 255, 255)');
  }
  for (const item of registry) {
    await page.locator('#component').selectOption(item.name);
    await expect(frame.locator('[id="preview-feedback"]')).toBeAttached();
    expect(await frame.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth + 1), item.name).toBe(true);
    if (item.name === 'table-of-contents') {
      await expect(frame.locator('.ghcn-toc__link')).toHaveCount(3);
      await frame.locator('.ghcn-toc__link').nth(1).focus(); await frame.locator('.ghcn-toc__link').nth(1).press('Enter');
      await expect(frame.locator('h3')).toBeFocused();
    }
  }
  await page.locator('#component').selectOption('newsletter-form');
  await frame.getByRole('textbox').fill('demo@example.test');
  await frame.getByRole('button', { name: 'Subscribe', exact: true }).click();
  await expect(frame.locator('#preview-feedback')).toContainText('No email was sent');
  await page.locator('#state').selectOption('disabled');
  await expect(frame.locator('.gh-newsletter-form')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(writes).toEqual([]); expect(errors).toEqual([]);
});
test('playground watches actual installed files and reloads without discarding controls', async ({ page }) => {
  const fixture = fixtures.css;
  await page.goto(fixture.url);
  await page.locator('#component').selectOption('button');
  await page.locator('[name="variant"]').selectOption('outline');
  await expect(page.frameLocator('#preview').locator('.ghcn-ui-button')).toBeVisible();
  await expect.poll(async () => page.locator('#status').textContent()).toContain('Read-only');
  // Give the watcher its first baseline, then edit the test-owned installed partial.
  await page.waitForResponse(response => response.url().endsWith('/revision'));
  fs.appendFileSync(path.join(fixture.themeRoot, 'partials/components/button.hbs'), '\n<p class="local-edit">A local template edit</p>');
  await expect(page.frameLocator('#preview').locator('.local-edit')).toHaveText('A local template edit');
  await expect(page.locator('[name="variant"]')).toHaveValue('outline');
});

for (const style of ['css', 'tailwind']) for (const width of [1280, 390]) {
  test(`${style} ${width}px: pricing and card text contrast on default, light, dark and adaptive surfaces`, async ({ page }, testInfo) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 1000 });
    const surfaces = style === 'tailwind'
      ? ['', 'bg-purple-50 text-purple-950', 'bg-purple-950 text-purple-50', 'bg-purple-50 text-purple-950 dark:bg-purple-950 dark:text-purple-50']
      : ['', 'contrast-light', 'contrast-dark', 'contrast-adaptive'];
    for (const [scheme, colorScheme] of [['light','light'], ['dark','dark'], ['auto','light'], ['auto','dark']]) {
      await page.emulateMedia({ colorScheme });
      for (const classes of surfaces) {
        for (const component of ['pricing-table', 'card']) {
          const params = new URLSearchParams({ scheme, [component === 'card' ? 'class' : 'cardClass']: classes });
          if (component === 'pricing-table') params.set('buttonClass', style === 'tailwind' ? 'bg-purple-600 text-white' : 'purple-action');
          const response = await page.goto(`${fixtures[style].url}/preview/${component}?${params}`);
          expect(response.status()).toBe(200);
          const surface = component === 'card' ? '.ghcn-ui-card' : '.gh-pricing-card';
          await expect(page.locator(surface).first()).toBeVisible();
          const text = component === 'card'
            ? '.ghcn-ui-card__title, .ghcn-ui-card__description, .ghcn-ui-card__content, .ghcn-ui-card__footer'
            : '.gh-pricing-card-title, .gh-pricing-description, .gh-pricing-benefits li, .gh-pricing-price, .gh-pricing-price span';
          for (const element of await page.locator(text).all()) {
            expect(await contrast(element, surface), `${component} ${scheme}/${colorScheme} ${classes}: ${await element.textContent()}`).toBeGreaterThanOrEqual(4.5);
          }
          if (component === 'pricing-table') for (const button of await page.locator('.gh-pricing-card .ghcn-button').all()) {
            expect(await contrast(button, '.ghcn-button')).toBeGreaterThanOrEqual(4.5);
          }
          expect(await page.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        }
      }
    }
    const params = new URLSearchParams({ scheme: 'dark', cardClass: surfaces[3], buttonClass: style === 'tailwind' ? 'bg-purple-600 text-white' : 'purple-action' });
    await page.goto(`${fixtures[style].url}/preview/pricing-table?${params}`);
    await page.screenshot({ path: testInfo.outputPath('pricing-dark.png'), fullPage: true });
  });
}
