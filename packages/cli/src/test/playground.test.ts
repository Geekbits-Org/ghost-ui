import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import http from 'http';
import { spawn, spawnSync } from 'child_process';
import { startPlayground } from '../utils/playground-server';
import { buildGhostcnConfig, initializeThemeProject } from '../utils/theme-project';
import { installComponent } from '../utils/component-installer';
import { scaffoldTheme } from '../utils/theme-scaffold';
import { getRegistryIndex } from '../utils/registry';

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });
async function fixture(customAliases = false) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-playground-')); roots.push(parent);
  const { themeRoot } = scaffoldTheme({ parentDirectory: parent, themeName: 'playground-test', style: 'css', colorScheme: 'Auto', packageManager: 'npm' });
  const config = buildGhostcnConfig({ style: 'css', baseColor: 'zinc', accentColor: 'ghost', radius: '0.5rem' }, customAliases ? { partials: 'partials/ui', styles: 'assets/css/ui' } : {});
  initializeThemeProject({ themeRoot, config });
  for (const item of await getRegistryIndex()) await installComponent({ themeRoot, config, componentName: item.name });
  return { themeRoot, config };
}
function snapshot(root: string) {
  const hash = crypto.createHash('sha256');
  function walk(directory: string) { for (const name of fs.readdirSync(directory).sort()) { const file = path.join(directory, name); const stat = fs.lstatSync(file); if (stat.isDirectory()) walk(file); else { hash.update(file); hash.update(fs.readFileSync(file)); } } }
  walk(root); return hash.digest('hex');
}
test('playground renders every installed component without changing theme files or submitting data', async () => {
  const { themeRoot } = await fixture();
  const before = snapshot(themeRoot);
  const runtime = await startPlayground({ themeRoot, port: 0 });
  try {
    const catalog = await (await fetch(`${runtime.url}/catalog`)).json() as any;
    assert.equal(catalog.components.length, 23);
    for (const item of catalog.components) {
      const response = await fetch(`${runtime.url}/preview/${item.name}?class=instance-custom&scheme=dark&variant=outline&size=sm`);
      assert.equal(response.status, 200, item.name);
      const html = await response.text();
      assert.ok(html.includes('instance-custom'), item.name);
      assert.ok(!html.includes('Cannot render preview'), item.name);
      assert.ok(response.headers.get('content-security-policy')!.includes("form-action 'none'"));
    }
    assert.equal((await fetch(`${runtime.url}/catalog`, { method: 'POST' })).status, 405);
    assert.equal((await fetch(`${runtime.url}/theme-assets/../components.json`)).status, 404);
    assert.equal((await fetch(`${runtime.url}/theme-assets/%2e%2e%2fcomponents.json`)).status, 403);
    assert.equal((await fetch(`${runtime.url}/theme-assets/secret.json`)).status, 403);
    assert.equal((await fetch(`${runtime.url}/preview/not-installed`)).status, 404);
    const hostStatus = await new Promise<number>(resolve => { http.get(`${runtime.url}/catalog`, { headers: { Host: 'attacker.example' } }, response => { response.resume(); resolve(response.statusCode!); }); });
    assert.equal(hostStatus, 403);
    assert.equal(snapshot(themeRoot), before);
  } finally { await runtime.close(); }
});
test('playground respects custom aliases, renders local edits and reports missing dependencies', async () => {
  const { themeRoot } = await fixture(true);
  const runtime = await startPlayground({ themeRoot, port: 0 });
  try {
    const before = await (await fetch(`${runtime.url}/revision`)).text();
    const file = path.join(themeRoot, 'partials/ui/button.hbs');
    fs.appendFileSync(file, '\n<p>LOCAL BUTTON EDIT</p>');
    assert.notEqual(await (await fetch(`${runtime.url}/revision`)).text(), before);
    assert.ok((await (await fetch(`${runtime.url}/preview/tag-grid?buttonClass=custom-action`)).text()).includes('LOCAL BUTTON EDIT'));
    const response = await fetch(`${runtime.url}/preview/author-card?class=custom-author`);
    assert.ok((await response.text()).includes('gh-author-card custom-author'));
    fs.unlinkSync(file);
    const missing = await fetch(`${runtime.url}/preview/tag-grid`);
    assert.equal(missing.status, 400);
    assert.ok((await missing.text()).includes('ui/button'));
    fs.writeFileSync(file, '{{! restored test button }}');
    fs.unlinkSync(path.join(themeRoot, 'partials/ui/card.hbs'));
    const missingCard = await fetch(`${runtime.url}/preview/tag-grid`);
    assert.equal(missingCard.status, 400);
    assert.ok((await missingCard.text()).includes('Missing component dependency partial'));
  } finally { await runtime.close(); }
});
test('CLI rejects invalid playground ports and server refuses symlinked assets', async () => {
  const { themeRoot } = await fixture();
  const cli = spawnSync(process.execPath, [path.resolve(__dirname, '../index.js'), 'playground', '--port', '-1'], { cwd: themeRoot, encoding: 'utf8' });
  assert.equal(cli.status, 1); assert.match(cli.stderr, /Port must/);
  await assert.rejects(startPlayground({ themeRoot, port: 65536 }), /Port must/);
  const outside = path.dirname(themeRoot);
  fs.mkdirSync(path.join(outside, 'external')); fs.writeFileSync(path.join(outside, 'external/private.css'), 'secret');
  fs.symlinkSync(path.join(outside, 'external'), path.join(themeRoot, 'assets/linked'), 'junction');
  const runtime = await startPlayground({ themeRoot, port: 0 });
  try {
    assert.equal((await fetch(`${runtime.url}/theme-assets/linked/private.css`)).status, 400);
    assert.equal((await fetch(`${runtime.url}/revision`)).status, 400);
  } finally { await runtime.close(); }
  // Remove only the test-owned link before recursive fixture cleanup.
  if (process.platform === 'win32') fs.rmdirSync(path.join(themeRoot, 'assets/linked'));
  else fs.unlinkSync(path.join(themeRoot, 'assets/linked'));
});

test('playground CLI starts from a theme directory, prints a working local URL, and leaves files untouched', async () => {
  const { themeRoot } = await fixture();
  const before = snapshot(themeRoot);
  const child = spawn(process.execPath, [path.resolve(__dirname, '../index.js'), 'playground', '--port', '0'], { cwd: themeRoot, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const ended = new Promise<void>(resolve => child.once('close', () => resolve()));
  try {
    const url = await new Promise<string>((resolve, reject) => {
      let output = '';
      const timer = setTimeout(() => reject(new Error('Playground CLI did not become ready.')), 10000);
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.stderr.on('data', data => { clearTimeout(timer); reject(new Error(data.toString())); });
      child.stdout.on('data', data => {
        output += data.toString();
        const match = output.match(/Ghostcn playground: (http:\/\/127\.0\.0\.1:\d+)/);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
    });
    assert.equal((await fetch(url)).status, 200);
    assert.ok((await (await fetch(`${url}/preview/button`)).text()).includes('ghcn-ui-button'));
    assert.equal(snapshot(themeRoot), before);
  } finally { if (child.exitCode === null) child.kill('SIGTERM'); await ended; }
});
