import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { scaffoldTheme } from '../utils/theme-scaffold';
import { buildGhostcnConfig, initializeThemeProject } from '../utils/theme-project';
import { installComponent } from '../utils/component-installer';

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

test('real Tailwind v4 compilation scans Handlebars and emits ordinary overrides, semantic colors and Ghost dark modes', async () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-tailwind-'));
  roots.push(parent);
  const { themeRoot } = scaffoldTheme({ parentDirectory: parent, themeName: 'tailwind-test', style: 'tailwind', colorScheme: 'Auto', packageManager: 'npm' });
  const config = buildGhostcnConfig({ style: 'tailwind', baseColor: 'zinc', accentColor: 'ghost', radius: '0.5rem' });
  initializeThemeProject({ themeRoot, config });
  await installComponent({ themeRoot, config, componentName: 'site-header' });
  fs.appendFileSync(path.join(themeRoot, 'index.hbs'), '<a class="ghcn-button bg-purple-600 hover:bg-purple-700 text-white px-8 rounded-xl dark:bg-purple-400">Test</a><span class="bg-primary border-border">Semantic</span>');
  // Resolve Tailwind from the CLI's test dependencies, not from a theme install or global binary.
  const cli = path.join(path.dirname(require.resolve('@tailwindcss/cli/package.json')), 'dist/index.mjs');
  const tailwindRoot = path.dirname(require.resolve('tailwindcss/package.json'));
  fs.mkdirSync(path.join(themeRoot, 'node_modules'), { recursive: true });
  fs.symlinkSync(tailwindRoot, path.join(themeRoot, 'node_modules/tailwindcss'), 'junction');
  const built = spawnSync(process.execPath, [cli, '-i', './assets/css/source.css', '-o', './assets/built/screen.css'], { cwd: themeRoot, encoding: 'utf8' });
  assert.equal(built.status, 0, built.stderr);
  const css = fs.readFileSync(path.join(themeRoot, 'assets/built/screen.css'), 'utf8');
  for (const value of ['.bg-purple-600', '.hover\\:bg-purple-700', '.text-white', '.px-8', '.rounded-xl', '.bg-primary', 'var(--primary)', '.dark-mode', '.auto-color']) assert.ok(css.includes(value), value);
  assert.ok(css.indexOf('@layer components') < css.indexOf('@layer utilities'));
  assert.match(css, /\.bg-purple-600\s*\{\s*background-color: var\(--color-purple-600\);\s*\}/);
  assert.match(css, /iframe\[title=["']?comments-frame["']?\]\s*\{\s*color-scheme:\s*normal;\s*\}/);
  assert.ok(fs.readFileSync(path.join(themeRoot, 'assets/css/components/site-header.css'), 'utf8').startsWith('@layer theme, base, components, utilities;'));
});
