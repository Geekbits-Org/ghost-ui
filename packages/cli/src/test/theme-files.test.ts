import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveWithinTheme, syncGhostcnStyles, toGhostAssetPath } from '../utils/theme-files';

describe('Ghost theme file management', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-theme-files-'));
    fs.mkdirSync(path.join(tmpDir, 'assets/css/components'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'assets/css/ghostcn.css'), ':root {}', 'utf8');
    fs.writeFileSync(
      path.join(tmpDir, 'default.hbs'),
      '<html>\n<head>\n    <link rel="stylesheet" href="{{asset "css/screen.css"}}" />\n    {{ghost_head}}\n</head>\n</html>\n',
      'utf8'
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('adds and maintains an idempotent stylesheet block', () => {
    fs.writeFileSync(path.join(tmpDir, 'assets/css/components/card.css'), '.card {}', 'utf8');

    const first = syncGhostcnStyles({
      themeRoot: tmpDir,
      cssFile: 'assets/css/ghostcn.css',
      stylesDir: 'assets/css/components'
    });
    const second = syncGhostcnStyles({
      themeRoot: tmpDir,
      cssFile: 'assets/css/ghostcn.css',
      stylesDir: 'assets/css/components'
    });
    const template = fs.readFileSync(path.join(tmpDir, 'default.hbs'), 'utf8');

    assert.strictEqual(first.status, 'updated');
    assert.strictEqual(second.status, 'unchanged');
    assert.strictEqual((template.match(/ghostcn:styles:start/g) || []).length, 1);
    assert.strictEqual((template.match(/css\/ghostcn\.css/g) || []).length, 1);
    assert.strictEqual((template.match(/css\/components\/card\.css/g) || []).length, 1);
    assert.ok(template.indexOf('css/screen.css') < template.indexOf('css/ghostcn.css'));
    assert.ok(template.indexOf('css/ghostcn.css') < template.indexOf('{{ghost_head}}'));
  });

  test('replaces a manual ghostcn link instead of duplicating it', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'default.hbs'),
      '<head>\n<link rel="stylesheet" href="{{asset "css/screen.css"}}">\n<link rel="stylesheet" href="{{asset "css/ghostcn.css"}}">\n{{ghost_head}}\n</head>\n',
      'utf8'
    );

    syncGhostcnStyles({
      themeRoot: tmpDir,
      cssFile: 'assets/css/ghostcn.css',
      stylesDir: 'assets/css/components'
    });
    const template = fs.readFileSync(path.join(tmpDir, 'default.hbs'), 'utf8');

    assert.strictEqual((template.match(/css\/ghostcn\.css/g) || []).length, 1);
    assert.ok(template.includes('ghostcn:styles:start'));
  });

  test('removes duplicate manual links even when a managed block already exists', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'default.hbs'),
      '<head>\n<link rel="stylesheet" href="{{asset "css/ghostcn.css"}}">\n{{!-- ghostcn:styles:start --}}\n<link rel="stylesheet" href="{{asset "css/ghostcn.css"}}" />\n{{!-- ghostcn:styles:end --}}\n{{ghost_head}}\n</head>\n',
      'utf8'
    );

    syncGhostcnStyles({
      themeRoot: tmpDir,
      cssFile: 'assets/css/ghostcn.css',
      stylesDir: 'assets/css/components'
    });
    const template = fs.readFileSync(path.join(tmpDir, 'default.hbs'), 'utf8');

    assert.strictEqual((template.match(/css\/ghostcn\.css/g) || []).length, 1);
  });

  test('rejects paths outside the theme and non-asset stylesheet paths', () => {
    assert.throws(() => resolveWithinTheme(tmpDir, '../outside.css'), /stay inside/);
    assert.throws(() => resolveWithinTheme(tmpDir, path.resolve(tmpDir, 'absolute.css')), /relative/);
    assert.throws(() => toGhostAssetPath('styles/ghostcn.css'), /inside assets/);
  });
});
