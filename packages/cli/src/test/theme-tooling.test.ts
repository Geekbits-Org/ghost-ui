import { afterEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { scaffoldTheme, REQUIRED_STARTER_COMPONENTS } from '../utils/theme-scaffold';
import { buildGhostcnConfig, initializeThemeProject } from '../utils/theme-project';
import { installComponent } from '../utils/component-installer';
import { themeToolPath } from '../utils/theme-tooling';

describe('theme diagnostics and packaging', () => {
  const roots: string[] = [];
  afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });
  async function theme(style: 'css' | 'tailwind') {
    const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-tooling-'));
    roots.push(parent);
    const { themeRoot } = scaffoldTheme({ parentDirectory: parent, themeName: 'test-theme', style, colorScheme: 'Auto', packageManager: 'npm' });
    const config = buildGhostcnConfig({ style, baseColor: 'zinc', accentColor: 'violet', radius: '0.5rem' });
    initializeThemeProject({ themeRoot, config });
    for (const name of REQUIRED_STARTER_COMPONENTS) await installComponent({ themeRoot, config, componentName: name });
    return themeRoot;
  }
  function run(root: string, action = 'doctor') {
    return spawnSync(process.execPath, [themeToolPath(), action, root], { encoding: 'utf8' });
  }
  for (const style of ['css', 'tailwind'] as const) {
    test(`checks and packages a complete ${style} theme, omitting development/private files`, async () => {
      const root = await theme(style);
      fs.mkdirSync(path.join(root, 'node_modules/private'), { recursive: true });
      fs.writeFileSync(path.join(root, 'node_modules/private/secret.txt'), 'DO NOT SHIP');
      fs.writeFileSync(path.join(root, '.env'), 'DO NOT SHIP');
      const checked = run(root);
      assert.equal(checked.status, 0, checked.stderr);
      const packed = run(root, 'pack');
      assert.equal(packed.status, 0, packed.stderr);
      const zip = fs.readFileSync(path.join(root, 'dist/test-theme-1.0.0.zip'));
      // Parse local ZIP headers independently from the writer, including file bytes.
      const entries = new Map<string, Buffer>();
      let offset = 0;
      while (zip.readUInt32LE(offset) === 0x04034b50) {
        const size = zip.readUInt32LE(offset + 18), length = zip.readUInt16LE(offset + 26), extra = zip.readUInt16LE(offset + 28);
        const name = zip.subarray(offset + 30, offset + 30 + length).toString();
        const start = offset + 30 + length + extra;
        entries.set(name, zip.subarray(start, start + size));
        offset = start + size;
      }
      assert.equal(zip.readUInt32LE(offset), 0x02014b50);
      assert.ok(entries.has('partials/content-cta.hbs'));
      assert.ok(entries.has('assets/built/screen.css'));
      assert.ok(entries.has('assets/css/components/site-header.css'));
      assert.equal(entries.get('package.json')!.toString(), fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
      assert.ok([...entries.keys()].every(name => !/node_modules|\.env|scripts\/|package-lock|source\.css|ghostcn-tailwind/.test(name)));
      assert.ok(!zip.toString().includes('DO NOT SHIP'));
      assert.equal(run(root, 'pack').status, 0, 'regenerating the same owned ZIP works');
    });
  }
  test('reports broken partials, missing compiled assets and missing Ghost hooks with failure exit status', async () => {
    const root = await theme('css');
    fs.unlinkSync(path.join(root, 'assets/built/screen.css'));
    fs.writeFileSync(path.join(root, 'default.hbs'), '<head>{{asset "built/screen.css"}}</head>{{> "missing"}}');
    const checked = run(root);
    assert.equal(checked.status, 1);
    for (const text of ['missing asset built/screen.css', 'missing partial missing', 'ghost_head', 'ghost_foot']) assert.ok(checked.stderr.includes(text), checked.stderr);
    assert.equal(run(root, 'pack').status, 1);
    assert.ok(!fs.existsSync(path.join(root, 'dist/test-theme-1.0.0.zip')));
  });
  test('rejects config paths escaping the theme and symlinked runtime directories', async () => {
    const root = await theme('css');
    const configPath = path.join(root, 'components.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.cssFile = '../outside.css';
    fs.writeFileSync(configPath, JSON.stringify(config));
    assert.ok(run(root).stderr.includes('Path escapes theme'));
    config.cssFile = 'assets/css/ghostcn.css';
    fs.writeFileSync(configPath, JSON.stringify(config));
    const external = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-linked-'));
    roots.push(external);
    fs.symlinkSync(external, path.join(root, 'assets/linked'), 'junction');
    assert.ok(run(root, 'pack').stderr.includes('Symlink is not supported'));
  });
  test('detects removed component stylesheet links even when a misleading comment remains', async () => {
    const root = await theme('css');
    const layoutPath = path.join(root, 'default.hbs');
    const layout = fs.readFileSync(layoutPath, 'utf8').replace(/<link[^\n]*css\/components\/site-header\.css[^\n]*\n/, '{{!-- css/components/site-header.css was removed --}}\n');
    fs.writeFileSync(layoutPath, layout);
    const checked = run(root);
    assert.equal(checked.status, 1);
    assert.ok(checked.stderr.includes('does not link component stylesheet css/components/site-header.css'), checked.stderr);
  });
  test('vanilla custom CSS loads after defaults and Tailwind defaults are layered', async () => {
    for (const style of ['css', 'tailwind'] as const) {
      const root = await theme(style);
      const layout = fs.readFileSync(path.join(root, 'default.hbs'), 'utf8');
      assert.ok(layout.indexOf('css/components/site-header.css') < layout.indexOf('built/screen.css'));
      const css = fs.readFileSync(path.join(root, 'assets/css/components/site-header.css'), 'utf8');
      assert.equal(css.startsWith('@layer theme, base, components, utilities;'), style === 'tailwind');
    }
  });
});
