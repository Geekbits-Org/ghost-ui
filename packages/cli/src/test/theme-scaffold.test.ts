import { afterEach, describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { installComponent } from '../utils/component-installer';
import { buildGhostcnConfig, initializeThemeProject } from '../utils/theme-project';
import { REQUIRED_STARTER_COMPONENTS, sanitizeThemeName, scaffoldTheme } from '../utils/theme-scaffold';

describe('ghostcn theme scaffolding', () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
  });

  function temporaryParent() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-create-test-'));
    tempRoots.push(root);
    return root;
  }

  test('creates a complete Tailwind theme and installs the required component foundation', async () => {
    const parent = temporaryParent();
    const result = scaffoldTheme({
      parentDirectory: parent,
      themeName: 'editorial-starter',
      style: 'tailwind',
      colorScheme: 'Auto',
      packageManager: 'npm',
      includeNewsletter: true,
      includeAuthorCard: true,
      includePricing: false
    });
    const config = buildGhostcnConfig({ style: 'tailwind', baseColor: 'zinc', accentColor: 'ghost', radius: '0.5rem' });
    initializeThemeProject({ themeRoot: result.themeRoot, config });
    for (const name of [...REQUIRED_STARTER_COMPONENTS, 'newsletter-form', 'author-card']) {
      await installComponent({ themeRoot: result.themeRoot, componentName: name, config, overwrite: true });
    }

    const packageJson = JSON.parse(fs.readFileSync(path.join(result.themeRoot, 'package.json'), 'utf8'));
    assert.strictEqual(packageJson.devDependencies.tailwindcss, '^4.1.0');
    assert.strictEqual(packageJson.devDependencies.gscan, undefined);
    assert.strictEqual(packageJson.scripts.test, 'node ./scripts/check.mjs');
    assert.strictEqual(packageJson.scripts.validate, 'npx --yes gscan@6.4.2 .');
    assert.ok(packageJson.scripts.dev.includes('tailwindcss'));
    assert.ok(fs.readFileSync(path.join(result.themeRoot, 'assets/css/source.css'), 'utf8').startsWith('@import "tailwindcss";'));
    assert.ok(fs.existsSync(path.join(result.themeRoot, 'partials/pagination.hbs')));
    assert.ok(fs.existsSync(path.join(result.themeRoot, 'partials/components/site-header.hbs')));

    const layout = fs.readFileSync(path.join(result.themeRoot, 'default.hbs'), 'utf8');
    assert.ok(layout.includes('{{> "components/site-header"}}'));
    assert.ok(layout.includes('{{> "components/site-footer"}}'));
    assert.ok(layout.includes('{{!-- ghostcn:styles:start --}}'));
    assert.ok(layout.includes('{{asset "css/components/post-header.css"}}'));
    assert.ok(layout.includes('@custom.color_scheme'));
  });

  test('creates a dependency-light vanilla CSS workflow', () => {
    const parent = temporaryParent();
    const result = scaffoldTheme({
      parentDirectory: parent,
      themeName: 'vanilla-starter',
      style: 'css',
      colorScheme: 'Light',
      packageManager: 'pnpm'
    });
    const packageJson = JSON.parse(fs.readFileSync(path.join(result.themeRoot, 'package.json'), 'utf8'));
    assert.strictEqual(packageJson.devDependencies.tailwindcss, undefined);
    assert.strictEqual(packageJson.scripts.test, 'node ./scripts/check.mjs');
    assert.strictEqual(packageJson.scripts.validate, 'pnpm dlx gscan@6.4.2 .');
    assert.strictEqual(packageJson.scripts.build, 'node ./scripts/build.mjs');
    assert.ok(fs.existsSync(path.join(result.themeRoot, 'scripts/dev.mjs')));
    assert.ok(!fs.readFileSync(path.join(result.themeRoot, 'assets/css/source.css'), 'utf8').includes('@import "tailwindcss"'));
  });

  test('rejects unsafe names and refuses to overwrite a non-empty directory', () => {
    assert.throws(() => sanitizeThemeName('../outside'), /Theme names/);
    assert.throws(() => sanitizeThemeName('Bad Name'), /Theme names/);
    const parent = temporaryParent();
    const target = path.join(parent, 'existing-theme');
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, 'keep.txt'), 'keep', 'utf8');
    assert.throws(() => scaffoldTheme({
      parentDirectory: parent,
      themeName: 'existing-theme',
      style: 'css',
      colorScheme: 'Auto',
      packageManager: 'npm'
    }), /not empty/);
    assert.strictEqual(fs.readFileSync(path.join(target, 'keep.txt'), 'utf8'), 'keep');
  });
});
