import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';
import { spawnSync } from 'child_process';
import { comparisonManifest, compareComponent, unifiedDiff } from '../utils/component-diff';
import { buildGhostcnConfig, initializeThemeProject } from '../utils/theme-project';
import { installComponent } from '../utils/component-installer';
import { readHistory } from '../utils/component-history';
import { scaffoldTheme } from '../utils/theme-scaffold';
import { getComponent } from '../utils/registry';

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });
async function fixture(style: 'css' | 'tailwind' = 'css') {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-diff-')); roots.push(parent);
  const { themeRoot } = scaffoldTheme({ parentDirectory: parent, themeName: 'diff-theme', style, colorScheme: 'Auto', packageManager: 'npm' });
  const config = buildGhostcnConfig({ style, baseColor: 'zinc', accentColor: 'ghost', radius: '0.5rem' });
  initializeThemeProject({ themeRoot, config });
  await installComponent({ themeRoot, config, componentName: 'post-card' });
  const manifest = JSON.parse(JSON.stringify(await getComponent('post-card')));
  return { themeRoot, config, manifest, partial: path.join(themeRoot, 'partials/components/post-card.hbs') };
}

for (const style of ['css', 'tailwind'] as const) test(`${style} compares defaults and keeps local edits/baselines intact`, async () => {
  const f = await fixture(style);
  assert.ok(compareComponent(f.themeRoot, f.config, f.manifest).files.every(file => file.status === 'unchanged'));
  const baseline = fs.readFileSync(path.join(f.themeRoot, '.ghostcn/installed.json'), 'utf8');
  fs.appendFileSync(f.partial, '\n{{!-- My custom card --}}');
  const local = fs.readFileSync(f.partial, 'utf8');
  assert.equal(compareComponent(f.themeRoot, f.config, f.manifest).files.find(file => file.path.endsWith('.hbs'))!.status, 'locally-modified');
  await installComponent({ themeRoot: f.themeRoot, config: f.config, componentName: 'post-card' });
  assert.equal(fs.readFileSync(f.partial, 'utf8'), local);
  assert.equal(fs.readFileSync(path.join(f.themeRoot, '.ghostcn/installed.json'), 'utf8'), baseline);
});

test('detects upstream changes, conflicts, deletions and removed upstream files', async () => {
  const f = await fixture();
  f.manifest.files[0].content += '\n{{!-- New registry card --}}';
  assert.equal(compareComponent(f.themeRoot, f.config, f.manifest).files[0].status, 'unchanged'); // CSS sorts first
  assert.equal(compareComponent(f.themeRoot, f.config, f.manifest).files.find(file => file.path.endsWith('.hbs'))!.status, 'upstream-changed');
  fs.appendFileSync(f.partial, '\n{{!-- Local variant --}}');
  assert.equal(compareComponent(f.themeRoot, f.config, f.manifest).files.find(file => file.path.endsWith('.hbs'))!.status, 'conflict');
  fs.unlinkSync(f.partial);
  assert.equal(compareComponent(f.themeRoot, f.config, f.manifest).files.find(file => file.path.endsWith('.hbs'))!.status, 'missing');
  f.manifest.files = f.manifest.files.filter((file: any) => file.type !== 'partial');
  assert.equal(compareComponent(f.themeRoot, f.config, f.manifest).files.find(file => file.path.endsWith('.hbs'))!.status, 'removed-upstream');
});

test('legacy installs get an honest unknown-baseline status instead of invented update history', async () => {
  const f = await fixture();
  fs.unlinkSync(path.join(f.themeRoot, '.ghostcn/installed.json'));
  fs.appendFileSync(f.partial, '\nCustom content');
  const result = compareComponent(f.themeRoot, f.config, f.manifest);
  assert.equal(result.installedRevision, undefined);
  assert.equal(result.files.find(file => file.path.endsWith('.hbs'))!.status, 'untracked');
});

test('diff command is read-only and exposes both versions for a manual merge', async () => {
  const f = await fixture();
  fs.appendFileSync(f.partial, '\n{{!-- Custom card --}}');
  const local = fs.readFileSync(f.partial, 'utf8');
  const baseline = fs.readFileSync(path.join(f.themeRoot, '.ghostcn/installed.json'), 'utf8');
  const result = spawnSync(process.execPath, [path.join(__dirname, '../index.js'), 'diff', 'post-card', '--json'], { cwd: f.themeRoot, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.ok(output.components[0].files.some((file: any) => file.status === 'locally-modified' && file.local.includes('Custom card')));
  assert.equal(fs.readFileSync(f.partial, 'utf8'), local);
  assert.equal(fs.readFileSync(path.join(f.themeRoot, '.ghostcn/installed.json'), 'utf8'), baseline);
});

test('unsafe registry/history paths fail before any installation writes', async () => {
  const f = await fixture();
  f.manifest.files.push({ name: 'bad.hbs', type: 'partial', placement: 'theme', target: '../outside.hbs', content: 'unsafe' });
  assert.throws(() => compareComponent(f.themeRoot, f.config, f.manifest), /inside|relative/);
  const original = fs.readFileSync(f.partial, 'utf8');
  fs.writeFileSync(path.join(f.themeRoot, '.ghostcn/installed.json'), '{"schema":99,"components":{}}');
  await assert.rejects(installComponent({ themeRoot: f.themeRoot, config: f.config, componentName: 'post-card', overwrite: true }), /Invalid/);
  assert.equal(fs.readFileSync(f.partial, 'utf8'), original);
});

test('symlinked component/history directories cannot read or write outside the theme', async () => {
  const f = await fixture();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-diff-outside-')); roots.push(outside);
  fs.mkdirSync(path.join(f.themeRoot, 'linked-parent'));
  fs.symlinkSync(outside, path.join(f.themeRoot, 'linked-parent/files'), 'junction');
  const config = { ...f.config, aliases: { ...f.config.aliases, partials: 'linked-parent/files' } };
  assert.throws(() => compareComponent(f.themeRoot, config, f.manifest), /Symlink/);
  await assert.rejects(installComponent({ themeRoot: f.themeRoot, config, componentName: 'post-card' }), /Symlink/);
  assert.deepEqual(fs.readdirSync(outside), []);
});

test('symlinked managed asset paths fail before installation mutates component files', async () => {
  const f = await fixture();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-diff-layout-')); roots.push(outside);
  const original = fs.readFileSync(f.partial, 'utf8');
  const layout = path.join(f.themeRoot, 'default.hbs');
  const externalLayout = path.join(outside, 'default.hbs');
  fs.renameSync(layout, externalLayout);
  // File symlinks require Windows privileges; the parent junction works on both platforms.
  fs.symlinkSync(outside, path.join(f.themeRoot, 'layout-link'), 'junction');
  const config = { ...f.config, cssFile: 'layout-link/default.hbs' };
  await assert.rejects(installComponent({ themeRoot: f.themeRoot, config, componentName: 'post-card', overwrite: true }), /Symlink/);
  assert.equal(fs.readFileSync(f.partial, 'utf8'), original);
});

test('latest comparison rejects HTTP errors instead of claiming the bundled manifest is latest', async () => {
  const previous = process.env.GHOST_UI_REGISTRY_URL;
  const server = http.createServer((_req, res) => { res.writeHead(503); res.end('unavailable'); });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  process.env.GHOST_UI_REGISTRY_URL = `http://127.0.0.1:${(server.address() as any).port}`;
  try { await assert.rejects(comparisonManifest('post-card', true), /HTTP 503/); }
  finally { if (previous === undefined) delete process.env.GHOST_UI_REGISTRY_URL; else process.env.GHOST_UI_REGISTRY_URL = previous; await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('line diff covers insertions, deletions, missing files and bounded large files', () => {
  assert.equal(unifiedDiff('a\nb\n', 'a\nc\n', 'card.hbs'), '--- card.hbs (local)\n+++ card.hbs (registry)\n@@ -1,2 +1,2 @@\n a\n-b\n+c');
  assert.equal(unifiedDiff('a', 'a\n', 'newline.txt'), '--- newline.txt (local)\n+++ newline.txt (registry)\n@@ -1,1 +1,1 @@\n-a\n\\ No newline at end of file\n+a');
  assert.ok(unifiedDiff(undefined, 'new\n', 'new.css').includes('+new'));
  assert.ok(unifiedDiff('old\n', undefined, 'old.css').includes('-old'));
  assert.ok(unifiedDiff('a\n'.repeat(1100), 'b\n'.repeat(1100), 'large.css').includes('+b'));
});
