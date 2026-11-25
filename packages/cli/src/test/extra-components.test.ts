import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getComponent, getRegistryIndex } from '../utils/registry';
import { installComponent } from '../utils/component-installer';
import { buildGhostcnConfig, initializeThemeProject } from '../utils/theme-project';
import { renderPreviewTemplate, demoPost } from '../utils/preview-renderer';

const config = buildGhostcnConfig({ style: 'css', baseColor: 'doks', accentColor: 'doks', radius: '0.625rem' });
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

const NEW_COMPONENTS = [
  'avatar',
  'accordion',
  'theme-toggle',
  'announcement-bar',
  'reading-progress',
  'share-buttons',
  'breadcrumbs',
  'visibility-badge'
] as const;

async function loadPartials(names: readonly string[]) {
  const partials: Record<string, string> = {};
  for (const name of names) {
    const manifest = (await getComponent(name))!;
    assert.ok(manifest, `Expected manifest for ${name}`);
    partials[`components/${name}`] = manifest.files.find(file => file.type === 'partial')!.content;
  }
  return partials;
}

test('registry index includes all 31 components including new editorial and UI additions', async () => {
  const index = await getRegistryIndex();
  const names = new Set(index.map(item => item.name));
  assert.ok(index.length >= 31, `Expected at least 31 components, got ${index.length}`);
  for (const name of NEW_COMPONENTS) {
    assert.ok(names.has(name), `Missing ${name} in registry/index.json`);
  }
});

test('all new components render every documented variant and fall back safely on unsafe input', async () => {
  const partials = await loadPartials(NEW_COMPONENTS);
  for (const name of NEW_COMPONENTS) {
    const manifest = (await getComponent(name))!;
    const variants = manifest.parameters?.variant?.options || ['default'];
    for (const variant of variants) {
      const html = renderPreviewTemplate(partials, `{{> "components/${name}" variant="${variant}"}}`, {
        context: { ...demoPost, visibility: 'paid' }
      });
      assert.ok(html.includes(`data-variant="${variant}"`), `${name} missing data-variant="${variant}"`);
    }
    const safeHtml = renderPreviewTemplate(partials, `{{> "components/${name}" variant=unsafe class=unsafe}}`, {
      context: { ...demoPost, visibility: 'paid', unsafe: 'x" onclick="bad' }
    });
    assert.ok(safeHtml.includes('data-variant="default"'), `${name} did not fall back on unsafe variant`);
    assert.ok(!safeHtml.includes(' onclick="'), `${name} allowed attribute injection`);
  }
});

test('avatar renders image or initials fallback and respects decorative flag', async () => {
  const partials = await loadPartials(['avatar']);
  const fallback = renderPreviewTemplate(partials, '{{> "components/avatar" name="Alex Reader"}}');
  assert.ok(fallback.includes('ghcn-ui-avatar__fallback') && fallback.includes('role="img"') && fallback.includes('aria-label="Alex Reader"'));
  const decorative = renderPreviewTemplate(partials, '{{> "components/avatar" name="Alex Reader" decorative=true}}');
  assert.ok(decorative.includes('aria-hidden="true"') && !decorative.includes('role="img"'));
  const linked = renderPreviewTemplate(partials, '{{> "components/avatar" name="Alex Reader" src="/content/images/alex.jpg" href="/author/alex/"}}');
  assert.ok(linked.includes('<a class="ghcn-ui-avatar"') && linked.includes('href="/author/alex/"') && linked.includes('<img class="ghcn-ui-avatar__image"'));
});

test('accordion supports native details/summary, open state, group name, and partial blocks', async () => {
  const partials = await loadPartials(['accordion']);
  const html = renderPreviewTemplate(partials, '{{#> "components/accordion" heading="FAQ" open=true name="faq-group"}}<p>Block answer</p>{{/components/accordion}}');
  assert.ok(html.includes('<details class="ghcn-ui-accordion"') && html.includes(' open') && html.includes('name="faq-group"') && html.includes('<p>Block answer</p>'));
});

test('visibility-badge switches on Ghost post visibility and hides public by default', async () => {
  const partials = await loadPartials(['visibility-badge']);
  assert.equal(renderPreviewTemplate(partials, '{{> "components/visibility-badge"}}', { context: { visibility: 'public' } }).trim(), '');
  assert.ok(renderPreviewTemplate(partials, '{{> "components/visibility-badge" showPublic=true}}', { context: { visibility: 'public' } }).includes('Public'));
  assert.ok(renderPreviewTemplate(partials, '{{> "components/visibility-badge"}}', { context: { visibility: 'members' } }).includes('Members only'));
  assert.ok(renderPreviewTemplate(partials, '{{> "components/visibility-badge"}}', { context: { visibility: 'paid' } }).includes('Paid only'));
  assert.ok(renderPreviewTemplate(partials, '{{> "components/visibility-badge"}}', { context: { visibility: 'tiers' } }).includes('Specific tiers'));
});

test('breadcrumbs emit Schema.org BreadcrumbList microdata and share-buttons encode URLs safely', async () => {
  const partials = await loadPartials(['breadcrumbs', 'share-buttons']);
  const crumbs = renderPreviewTemplate(partials, '{{#post}}{{> "components/breadcrumbs"}}{{/post}}');
  assert.ok(crumbs.includes('BreadcrumbList') && crumbs.includes('Publishing') && crumbs.includes('aria-current="page"'));
  const share = renderPreviewTemplate(partials, '{{#post}}{{> "components/share-buttons" heading="Share"}}{{/post}}');
  assert.ok(share.includes('data-share-copy') && share.includes('bsky.app/intent/compose') && share.includes('x.com/intent/tweet') && share.includes('linkedin.com/sharing'));
});

test('pricing-table includes progressive billing toggle markup and JS script installs cleanly', async () => {
  const partials = await loadPartials(['pricing-table']);
  const html = renderPreviewTemplate(partials, '{{> "components/pricing-table" defaultBilling="yearly"}}');
  assert.ok(html.includes('data-ghcn-billing-toggle') && html.includes('data-default-billing="yearly"') && html.includes('data-pricing-interval="monthly"') && html.includes('data-pricing-interval="yearly"'));

  const themeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-extra-'));
  roots.push(themeRoot);
  fs.writeFileSync(path.join(themeRoot, 'default.hbs'), '<html><head>{{ghost_head}}</head><body>{{{body}}}{{ghost_foot}}</body></html>');
  initializeThemeProject({ themeRoot, config });

  for (const name of ['pricing-table', 'theme-toggle', 'announcement-bar', 'reading-progress', 'share-buttons']) {
    await installComponent({ themeRoot, config, componentName: name });
  }
  const layout = fs.readFileSync(path.join(themeRoot, 'default.hbs'), 'utf8');
  for (const script of ['pricing-table.js', 'theme-toggle.js', 'announcement-bar.js', 'reading-progress.js', 'share-buttons.js']) {
    assert.ok(layout.includes(`js/components/${script}`), `Expected ${script} to be linked in default.hbs`);
  }
});
