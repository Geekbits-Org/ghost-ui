import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Handlebars from 'handlebars';
import { getComponent, ComponentManifest } from '../utils/registry';
import { componentPlan } from '../utils/component-plan';
import { componentFiles } from '../utils/component-files';
import { installComponent } from '../utils/component-installer';
import { buildGhostcnConfig, initializeThemeProject } from '../utils/theme-project';
import { readHistory } from '../utils/component-history';
import { compareComponent } from '../utils/component-diff';

const config = buildGhostcnConfig({ style: 'css', baseColor: 'zinc', accentColor: 'ghost', radius: '0.5rem' });
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });
async function renderer() {
  const hbs = Handlebars.create();
  hbs.registerHelper('match', function (this: unknown, value, expected, options) { return value === expected ? options.fn(this) : options.inverse(this); });
  for (const name of ['button', 'card', 'badge', 'input', 'alert']) {
    const manifest = (await getComponent(name))!;
    hbs.registerPartial(`components/${name}`, manifest.files.find(file => file.type === 'partial')!.content);
  }
  return hbs;
}
test('all primitive variants and sizes render and unknown modifiers fall back safely', async () => {
  const hbs = await renderer();
  for (const name of ['button', 'card', 'badge', 'input', 'alert']) {
    const manifest = (await getComponent(name))!;
    for (const variant of manifest.parameters!.variant.options!) for (const size of manifest.parameters!.size.options!) {
      const html = hbs.compile(`{{> "components/${name}" variant="${variant}" size="${size}"}}`)({});
      assert.ok(html.includes(`data-variant="${variant}"`) && html.includes(`data-size="${size}"`));
    }
    const html = hbs.compile(`{{> "components/${name}" variant=unsafe size=unsafe class=unsafe}}`)({ unsafe: 'x" onclick="bad' });
    assert.ok(html.includes('data-variant="default"') && html.includes('data-size="default"'));
    assert.ok(!html.includes(' onclick="') && html.includes('&quot;'));
  }
});
test('buttons support safe native types and disabled links cannot navigate or open Portal', async () => {
  const hbs = await renderer();
  const render = (parameters: string) => hbs.compile(`{{> "components/button" ${parameters}}}`)({});
  assert.ok(render('').includes('type="button"'));
  assert.ok(render('type="submit"').includes('type="submit"'));
  assert.ok(render('type="unexpected"').includes('type="button"'));
  assert.ok(render('disabled=true').includes(' disabled'));
  const disabled = render('href="/topic/" disabled=true dataPortal="signup"');
  assert.ok(disabled.includes('aria-disabled="true"') && disabled.includes('tabindex="-1"'));
  assert.ok(!disabled.includes('href=') && !disabled.includes('data-portal='));
  assert.ok(render('href="/topic/" dataPortal="signup"').includes('data-portal="signup"'));
});
test('cards compose nested trusted templates without losing caller context or sibling styles', async () => {
  const hbs = await renderer();
  const template = '{{#> "components/card" heading="Welcome" class="first"}}{{> "components/button" text=label class=buttonStyle}}{{#> "components/card" heading="Nested" class=""}}<p>{{message}}</p>{{/components/card}}{{/components/card}}{{> "components/card" heading="Other" body=message class="second"}}';
  const html = hbs.compile(template)({ label: 'Read story', buttonStyle: 'purple-button', message: '<escaped>' });
  assert.ok(html.includes('ghcn-ui-button purple-button') && html.includes('Read story'));
  assert.ok(html.includes('Nested') && html.includes('&lt;escaped&gt;'));
  assert.equal((html.match(/ghcn-ui-card first/g) || []).length, 1);
  assert.equal((html.match(/ghcn-ui-card second/g) || []).length, 1);
  assert.ok(!html.includes('<escaped>'));
});
test('inputs have repeat-safe labels, native validation and explicitly associated hints', async () => {
  const hbs = await renderer();
  const html = hbs.compile('{{> "components/input" label="Email" type="email" required=true invalid=true hint="Use an email" hintId="email-hint"}}{{> "components/input" label="Name"}}')({});
  assert.equal((html.match(/<label /g) || []).length, 2);
  assert.ok(html.includes('type="email"') && html.includes(' required') && html.includes('aria-invalid="true"'));
  assert.ok(html.includes('aria-describedby="email-hint"') && html.includes('id="email-hint"'));
  assert.equal((html.match(/\sid="/g) || []).length, 1);
  const alert = hbs.compile('{{> "components/alert"}}{{> "components/alert" urgent=true}}')({});
  assert.ok(alert.includes('role="status"') && alert.includes('role="alert"'));
});

function root() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-composition-'));
  roots.push(directory);
  fs.writeFileSync(path.join(directory, 'default.hbs'), '<html><head></head><body>{{{body}}}</body></html>');
  initializeThemeProject({ themeRoot: directory, config });
  return directory;
}
test('composed installation preserves customized dependencies even with overwrite enabled', async () => {
  const themeRoot = root();
  await installComponent({ themeRoot, config, componentName: 'card' });
  const cardPath = path.join(themeRoot, 'partials/components/card.hbs');
  fs.appendFileSync(cardPath, '\n{{! local customization }}');
  const customized = fs.readFileSync(cardPath, 'utf8');
  const before = readHistory(themeRoot);
  const result = await installComponent({ themeRoot, config, componentName: 'tag-grid', overwrite: true });
  assert.equal(fs.readFileSync(cardPath, 'utf8'), customized);
  assert.ok(result.dependencies!.find(dep => dep.name === 'card')!.skipped.length);
  assert.ok(result.dependencies!.find(dep => dep.name === 'button')!.installed.length);
  assert.deepEqual(readHistory(themeRoot).components.card, before.components.card);
});
test('nested component references respect custom aliases, including partial-block closing tags', async () => {
  const themeRoot = root();
  const custom = { ...config, aliases: { ...config.aliases, partials: 'partials/ui' } };
  await installComponent({ themeRoot, config: custom, componentName: 'tag-grid' });
  const source = fs.readFileSync(path.join(themeRoot, 'partials/ui/tag-grid.hbs'), 'utf8');
  assert.ok(source.includes('{{#> "ui/card"') && source.includes('{{/ui/card}}') && source.includes('{{> "ui/button"'));
  assert.ok(!source.includes('components/card'));
  const tagGrid = (await getComponent('tag-grid'))!;
  assert.ok(compareComponent(themeRoot, custom, tagGrid).files.every(file => file.status === 'unchanged'));
  assert.throws(() => componentFiles(themeRoot, { ...custom, aliases: { ...custom.aliases, partials: 'outside' } }, tagGrid), /partials\//);
});
test('dependency plans reject cycles, missing components and collisions before any writes', async () => {
  const themeRoot = root();
  const button = (await getComponent('button'))!;
  const manifest = (name: string, dependencies: string[]): ComponentManifest => ({ ...button, name, dependencies });
  await assert.rejects(componentPlan(themeRoot, config, 'a', async name => manifest(name, name === 'a' ? ['b'] : ['a'])), /cycle/);
  await assert.rejects(componentPlan(themeRoot, config, 'a', async name => name === 'a' ? manifest('a', ['missing']) : null), /not found/);
  await assert.rejects(componentPlan(themeRoot, config, 'a', async name => manifest(name, name === 'a' ? ['b'] : [])), /same file/);
  assert.ok(!fs.existsSync(path.join(themeRoot, 'partials')));
});

test('dependency graph preflight rejects directory targets before component files are written', async () => {
  const themeRoot = root();
  fs.mkdirSync(path.join(themeRoot, 'partials/components/button.hbs'), { recursive: true });
  await assert.rejects(installComponent({ themeRoot, config, componentName: 'tag-grid', overwrite: true }), /must be a file/);
  assert.ok(!fs.existsSync(path.join(themeRoot, 'partials/components/card.hbs')));
  assert.ok(!fs.existsSync(path.join(themeRoot, 'assets/css/components')));
});
