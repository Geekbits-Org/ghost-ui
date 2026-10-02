import { test, expect } from '@playwright/test';
import { createGhostFixture } from './ghost-fixture.mjs';

let fixture;
test.beforeAll(async () => { fixture = await createGhostFixture(process.env.GHOST_E2E_ROOT); });
test.afterAll(async () => { if (fixture) await fixture.close(); });

async function checkLayout(page) {
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(dimensions.scroll, 'No horizontal document overflow').toBeLessThanOrEqual(dimensions.width + 1);
  // Ghost lazily loads article images and deliberately hides empty audio thumbnails.
  for (const image of await page.locator('img').all()) {
    if (!await image.isVisible()) continue;
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0), { message: `Visible Ghost image loads: ${await image.getAttribute('src')}`, timeout: 10000 }).toBe(true);
  }
}

for (const style of ['css', 'tailwind']) for (const scheme of ['Light', 'Dark', 'Auto'])
for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }])
for (const colorScheme of scheme === 'Auto' ? ['light', 'dark'] : [scheme.toLowerCase()]) {
  test(`${style} ${scheme} ${viewport.width}px ${colorScheme}: live Ghost layouts, editor cards, reading navigation and member access`, async ({ browser }, testInfo) => {
    const theme = fixture.themes.find(theme => theme.style === style && theme.scheme === scheme);
    await fixture.activate(theme);
      await test.step(`${viewport.width}px ${colorScheme}`, async () => {
        const context = await browser.newContext({ viewport, colorScheme });
        // Fixtures never send subscription emails or perform payment requests.
        await context.route('**/*', async route => {
          const request = route.request();
          if (!['GET', 'HEAD'].includes(request.method())) return route.abort();
          if (request.url().startsWith('https://js.stripe.com/')) return route.abort();
          return route.continue();
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        try {
          expect((await page.goto(fixture.url)).status()).toBe(200);
          await expect(page.locator('.ghcn-header')).toBeVisible();
          await expect(page.locator('.gh-post-card').first()).toBeVisible();
          await expect(page.locator('.gh-newsletter-form')).toBeVisible();
          await expect(page.locator('.pricing-test .custom-card').first()).toHaveCSS('padding', '32px');
          const customButton = page.locator('.pricing-test .custom-button').first();
          await expect(customButton).toBeVisible();
          const purple = await customButton.evaluate(el => {
            // Resolve colors through the browser; Tailwind 4 may return oklch instead of rgb.
            const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
            ctx.fillStyle = getComputedStyle(el).backgroundColor; ctx.fillRect(0, 0, 1, 1);
            return [...ctx.getImageData(0, 0, 1, 1).data];
          });
          expect(purple[0]).toBeGreaterThan(100); expect(purple[1]).toBeLessThan(100); expect(purple[2]).toBeGreaterThan(180);
          const headerClass = await page.locator('html').getAttribute('class');
          expect(headerClass || '').toBe(scheme === 'Dark' ? 'dark-mode' : scheme === 'Auto' ? 'auto-color' : '');
          const background = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);
          expect(background).toBe(colorScheme === 'dark' ? 'rgb(9, 9, 11)' : 'rgb(255, 255, 255)');
          await checkLayout(page);
          if (viewport.width === 390) {
            const toggle = page.locator('summary[aria-label="Open navigation"]');
            await toggle.focus();
            await toggle.press('Enter');
            await expect(page.locator('.ghcn-header__panel')).toBeVisible();
          }
          expect((await page.goto(`${fixture.url}/editor-cards/`)).status()).toBe(200);
          await expect(page.locator('.ghcn-article-content > h2').first()).toHaveText('Getting started');
          await expect(page.locator('.toc-test')).toBeVisible();
          await expect(page.locator('.toc-second')).toBeVisible();
          const links = page.locator('.toc-test .ghcn-toc__link');
          await expect(links).toHaveCount(3);
          await expect(page.locator('.toc-second .toc-second-link')).toHaveCount(3);
          await expect(page.locator('.toc-test .toc-first-link')).toHaveCount(3);
          await expect(page.locator('.toc-test .toc-second-link')).toHaveCount(0);
          const targets = await links.evaluateAll(links => links.map(link => link.getAttribute('href')));
          expect(new Set(targets).size).toBe(targets.length);
          await links.nth(1).focus(); await links.nth(1).press('Enter');
          await expect(page.locator('.ghcn-article-content > h3')).toBeFocused();
          await expect(page.locator('.ghcn-tag-list')).toContainText('Reading');
          await expect(page.locator('.ghcn-tag-list')).not.toContainText('test-internal');
          await expect(page.locator('.ghcn-post-navigation [rel="prev"]')).toHaveAttribute('href', /first-story/);
          await expect(page.locator('.ghcn-post-navigation [rel="next"]')).toHaveAttribute('href', /last-story/);
          await expect(page.locator('.ghcn-related__card')).toHaveCount(3);
          expect(await page.locator('.ghcn-related__card a').evaluateAll(links => links.some(link => link.href.includes('/editor-cards/')))).toBe(false);
          for (const type of ['image', 'gallery', 'callout', 'button', 'bookmark', 'toggle', 'video', 'audio', 'product', 'header', 'signup']) await expect(page.locator(`.kg-${type}-card`)).toBeVisible();
          await page.locator('.kg-toggle-card button').click();
          await expect(page.locator('.kg-toggle-content')).toBeVisible();
          await checkLayout(page);
          // Exercise the actual comments UI iframe, not a mocked replacement.
          const comments = page.locator('iframe[title="comments-frame"]');
          await expect(comments).toBeVisible({ timeout: 45000 });
          expect(await comments.evaluate(el => getComputedStyle(el).colorScheme)).toBe('normal');
          await expect(page.frameLocator('iframe[title="comments-frame"]').getByText('Start the conversation', { exact: false })).toBeVisible();
          await page.screenshot({ path: testInfo.outputPath(`${style}-${scheme}-${viewport.width}-${colorScheme}.png`), fullPage: true });
          // Protected text must not leak; a single custom CTA should be shown instead.
          await page.goto(`${fixture.url}/members-story/`);
          await expect(page.locator('.ghcn-article-content')).not.toContainText('Private text sentinel');
          await expect(page.locator('.ghcn-member-cta')).toHaveCount(1);
          await context.addCookies(fixture.cookies('free'));
          await page.reload();
          await expect(page.locator('.ghcn-article-content')).toContainText('Private text sentinel members-story');
          await expect(page.locator('.ghcn-header__actions')).toContainText('Account');
          await page.goto(`${fixture.url}/paid-story/`);
          await expect(page.locator('.ghcn-article-content')).not.toContainText('Private text sentinel');
          await context.clearCookies(); await context.addCookies(fixture.cookies('paid'));
          await page.reload();
          await expect(page.locator('.ghcn-article-content')).toContainText('Private text sentinel paid-story');
          await page.goto(`${fixture.url}/empty-headings/`);
          await expect(page.locator('.toc-test')).toBeHidden();
          await expect(page.locator('.toc-second')).toBeHidden();
          await expect(page.locator('.ghcn-tag-list')).toHaveCount(0);
          await expect(page.locator('.ghcn-post-navigation [rel="next"]')).toHaveCount(0);
          await page.goto(`${fixture.url}/first-story/`);
          await expect(page.locator('.ghcn-post-navigation [rel="prev"]')).toHaveCount(0);
          await page.goto(`${fixture.url}/untagged-story/`);
          await expect(page.locator('.ghcn-related__card')).toHaveCount(3);
          await expect(page.locator('.toc-test .ghcn-toc__link')).toHaveCount(2);
          expect(await page.locator('.ghcn-article-content h2, .ghcn-article-content h3').evaluateAll(headings => new Set(headings.map(h => h.id)).size)).toBe(2);
          expect(errors, 'No browser JavaScript errors').toEqual([]);
        } finally { await context.close(); }
      });
  });
}

for (const style of ['css', 'tailwind']) for (const signup of ['none', 'invite']) {
  test(`${style}: real Ghost ${signup === 'none' ? 'disabled' : 'invite-only'} membership`, async ({ page }) => {
    await fixture.activate(fixture.themes.find(theme => theme.style === style && theme.scheme === 'Light'), signup);
    await page.goto(fixture.url);
    await expect(page.locator('.gh-newsletter-form')).toHaveCount(0);
    await expect(page.locator('.gh-pricing')).toHaveCount(0);
    await expect(page.locator('.ghcn-header a[data-portal="signup"]')).toHaveCount(0);
    await expect(page.locator('.ghcn-header')).toBeVisible();
    if (signup === 'invite') await expect(page.locator('.ghcn-header__signin')).toBeVisible();
  });
}
