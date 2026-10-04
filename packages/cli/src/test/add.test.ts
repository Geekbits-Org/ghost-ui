import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import prompts from 'prompts';
import { createOverwriteDecision } from '../commands/add';
import { buildGhostcnConfig, initializeThemeProject } from '../utils/theme-project';

const cli = path.resolve(__dirname, '../index.js');
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });
function theme() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-add-regression-'));
  roots.push(root);
  fs.writeFileSync(path.join(root, 'default.hbs'), '<html><head></head><body>{{{body}}}</body></html>');
  initializeThemeProject({ themeRoot: root, config: buildGhostcnConfig({ style: 'tailwind', baseColor: 'zinc', accentColor: 'ghost', radius: '0.5rem' }) });
  return root;
}
function run(root: string, args: string[]) {
  const env = { ...process.env };
  delete env.GHOST_UI_REGISTRY_URL;
  const result = spawnSync(process.execPath, [cli, 'add', ...args], { cwd: root, env, encoding: 'utf8', timeout: 10000 });
  assert.ifError(result.error);
  return { ...result, text: result.stdout + result.stderr };
}

test('CLI installs all nine positional components, rather than ignoring extra arguments', () => {
  const root = theme();
  const names = ['button', 'card', 'badge', 'input', 'alert', 'post-grid', 'author-list', 'tag-grid', 'archive-header'];
  const result = run(root, [...names, '--skip-existing']);
  assert.equal(result.status, 0, result.text);
  assert.match(result.text, /9 installed, 0 kept existing, 0 failed/);
  for (const name of names) {
    assert.ok(fs.existsSync(path.join(root, `partials/components/${name}.hbs`)), name);
    assert.ok(fs.existsSync(path.join(root, `assets/css/components/${name}.css`)), name);
  }
});

test('safe batch reruns preserve existing edits and continue installing missing components', () => {
  const root = theme();
  assert.equal(run(root, ['button']).status, 0);
  const target = path.join(root, 'partials/components/button.hbs');
  fs.appendFileSync(target, '\n{{! user customization }}');
  const before = fs.readFileSync(target, 'utf8');
  const result = run(root, ['button', 'card', 'badge', '--skip-existing']);
  assert.equal(result.status, 0, result.text);
  assert.equal(fs.readFileSync(target, 'utf8'), before);
  assert.match(result.text, /2 installed, 1 kept existing, 0 failed/);
  assert.match(result.text, /ghostcn diff button/);
  assert.match(result.text, /ghostcn add button --yes/);
});

test('noninteractive reinstall has no hanging prompt, reports preservation, and repairs missing files', () => {
  const root = theme();
  run(root, ['button']);
  const target = path.join(root, 'partials/components/button.hbs');
  fs.appendFileSync(target, '\n{{! keep }}');
  const before = fs.readFileSync(target, 'utf8');
  const kept = run(root, ['button']);
  assert.equal(kept.status, 0, kept.text);
  assert.match(kept.text, /0 installed, 1 kept existing, 0 failed/);
  assert.doesNotMatch(kept.text, /successfully installed|Replace existing files/);
  fs.unlinkSync(path.join(root, 'assets/css/components/button.css'));
  const repaired = run(root, ['button']);
  assert.equal(repaired.status, 0, repaired.text);
  assert.match(repaired.text, /1 installed, 0 kept existing, 0 failed/);
  assert.equal(fs.readFileSync(target, 'utf8'), before);
  assert.ok(fs.existsSync(path.join(root, 'assets/css/components/button.css')));
});

test('explicit replacement updates the requested component but preserves dependency edits', () => {
  const root = theme();
  run(root, ['tag-grid']);
  const dependency = path.join(root, 'partials/components/card.hbs');
  const requested = path.join(root, 'partials/components/tag-grid.hbs');
  fs.appendFileSync(dependency, '\n{{! dependency customization }}');
  fs.appendFileSync(requested, '\n{{! replace this }}');
  const before = fs.readFileSync(dependency, 'utf8');
  const result = run(root, ['tag-grid', '--yes']);
  assert.equal(result.status, 0, result.text);
  assert.equal(fs.readFileSync(dependency, 'utf8'), before);
  assert.ok(!fs.readFileSync(requested, 'utf8').includes('replace this'));
});

test('duplicate positional names are processed once', () => {
  const result = run(theme(), ['button', 'BUTTON', 'button']);
  assert.equal(result.status, 0, result.text);
  assert.match(result.text, /Installing 1 component/);
});

test('invalid later names and conflicting flags fail without installing earlier components', () => {
  for (const args of [['button', '../card'], ['button', '--yes', '--skip-existing']]) {
    const root = theme();
    const result = run(root, args);
    assert.equal(result.status, 1, result.text);
    assert.ok(!fs.existsSync(path.join(root, 'partials/components/button.hbs')));
  }
});

test('no-name noninteractive invocation exits with usable directions', () => {
  const result = run(theme(), []);
  assert.equal(result.status, 1);
  assert.match(result.text, /requires a terminal.*ghostcn add button card --skip-existing/);
});

test('overwrite prompt stops spinner, asks once per component, then resumes', async () => {
  for (const answer of [false, true]) {
    const events: string[] = [];
    prompts.inject([answer]);
    const decide = createOverwriteDecision('button', { stop: () => events.push('stop'), start: () => events.push('start') }, true);
    assert.equal(await decide('partials/components/button.hbs'), answer);
    assert.equal(await decide('assets/css/components/button.css'), answer);
    assert.deepEqual(events, ['stop', 'start']);
  }
});

test('Ctrl+C cancellation does not restart spinner or wait indefinitely', async () => {
  const events: string[] = [];
  prompts.inject([new Error('cancel')]);
  const decide = createOverwriteDecision('card', { stop: () => events.push('stop'), start: () => events.push('start') }, true);
  await assert.rejects(decide('partials/components/card.hbs'), /Cancelled.*not rolled back/);
  assert.deepEqual(events, ['stop']);
});
