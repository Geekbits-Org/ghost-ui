import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { init } from '../commands/init';

process.env.NODE_ENV = 'test';

describe('ghostcn init Command', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-init-test-'));
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('successfully initializes theme with components.json and ghostcn.css via -y', async () => {
    // Setup dummy Ghost theme package.json
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify(
        {
          name: 'test-ghost-theme',
          version: '1.0.0',
          engines: {
            ghost: '>=5.0.0'
          }
        },
        null,
        2
      ),
      'utf8'
    );
    fs.writeFileSync(path.join(tmpDir, 'default.hbs'), '<head>\n    {{ghost_head}}\n</head>\n', 'utf8');

    await init({ yes: true });

    // 1. Verify components.json
    const configPath = path.join(tmpDir, 'components.json');
    assert.ok(fs.existsSync(configPath), 'components.json should exist');

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.strictEqual(config.style, 'tailwind');
    assert.strictEqual(config.theme.baseColor, 'zinc');
    assert.strictEqual(config.theme.accentColor, 'ghost');
    assert.strictEqual(config.theme.radius, '0.5rem');
    assert.strictEqual(config.cssFile, 'assets/css/ghostcn.css');
    assert.strictEqual(config.aliases.partials, 'partials/components');
    assert.strictEqual(config.aliases.styles, 'assets/css/components');

    // 2. Verify theme CSS file was written
    const cssPath = path.join(tmpDir, 'assets/css/ghostcn.css');
    assert.ok(fs.existsSync(cssPath), 'assets/css/ghostcn.css should exist');

    const cssContent = fs.readFileSync(cssPath, 'utf8');
    assert.ok(cssContent.includes(':root'));
    assert.ok(cssContent.includes('.dark, .dark-mode, [data-theme="dark"]'));
    assert.ok(cssContent.includes('@media (prefers-color-scheme: dark)'));
    assert.ok(cssContent.includes('--primary: var(--ghost-accent-color, #18181b);'));
    assert.ok(cssContent.includes('--radius: 0.5rem;'));
    assert.ok(cssContent.includes('.bg-card { background-color: var(--card); }'));

    // 3. Verify the generated tokens are linked automatically and idempotently.
    const defaultTemplate = fs.readFileSync(path.join(tmpDir, 'default.hbs'), 'utf8');
    assert.ok(defaultTemplate.includes('{{!-- ghostcn:styles:start --}}'));
    assert.ok(defaultTemplate.includes('{{asset "css/ghostcn.css"}}'));
    assert.ok(defaultTemplate.indexOf('css/ghostcn.css') < defaultTemplate.indexOf('{{ghost_head}}'));
  });
});
