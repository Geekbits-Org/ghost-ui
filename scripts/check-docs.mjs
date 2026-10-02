import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { previewStates, hasMembership } from './component-preview.mjs';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(repo,'docs/dist');
const index = JSON.parse(fs.readFileSync(path.join(repo,'registry/index.json'),'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(repo,'docs/.openai/hosting.json'),'utf8'));
assert.equal(manifest.static.directory,'dist');
const files = [];
function walk(directory) { for (const entry of fs.readdirSync(directory,{withFileTypes:true})) { const file=path.join(directory,entry.name); if(entry.isDirectory())walk(file);else files.push(file); } }
walk(root);
let pages = 0, previews = 0;
for(const file of files.filter(file=>file.endsWith('.html'))) {
  const html=fs.readFileSync(file,'utf8');
  assert.ok(html.includes('name="viewport"'), `${file} viewport`);
  assert.ok(html.includes('<title>') && html.includes('lang="en"'), `${file} metadata`);
  const preview=file.includes(`${path.sep}previews${path.sep}`);
  if(preview){
    previews++;
    assert.ok(!html.includes('{{'),`${file} has unresolved template syntax`);
    assert.ok(html.includes('sandbox')===false, 'preview is itself a document');
    assert.ok(html.includes('/assets/preview.js'), `${file} safe demo interaction`);
  } else {
    pages++;
    assert.equal((html.match(/<h1\b/g)||[]).length,1,`${file} main heading`);
    assert.ok(html.includes('Skip to content'), `${file} skip navigation`);
  }
  for(const [,kind,url] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
    if(!url.startsWith('/'))continue;
    // Demo navigation belongs to a Ghost publication and is intercepted in the frame.
    if(preview && kind==='href' && !url.startsWith('/assets/'))continue;
    const target=url.split(/[?#]/)[0];
    const local=path.resolve(root,`.${target.endsWith('/')?target+'index.html':target}`);
    assert.ok(local.startsWith(root+path.sep), `unsafe local reference ${url}`);
    assert.ok(fs.existsSync(local),`${file}: missing ${url}`);
  }
}
for(const entry of index){
  const html=fs.readFileSync(path.join(root,`components/${entry.name}/index.html`),'utf8');
  const component=JSON.parse(fs.readFileSync(path.join(repo,`registry/components/${entry.name}.json`),'utf8'));
  for(const slot of Object.keys(component.styleSlots))assert.ok(html.includes(`<code>${slot}</code>`),`${entry.name}.${slot} documentation`);
  for(const style of ['css','tailwind'])for(const scheme of ['light','dark'])for(const variant of ['default','custom'])for(const state of hasMembership(entry.name)?previewStates:['visitor']) {
    assert.ok(fs.existsSync(path.join(root,`previews/${entry.name}-${style}-${scheme}-${variant}-${state}.html`)),`${entry.name} preview combination`);
  }
  const custom=fs.readFileSync(path.join(root,`previews/${entry.name}-tailwind-light-custom-visitor.html`),'utf8');
  assert.ok(custom.includes('demo-root'),`${entry.name} root parameter`);
}
const css=fs.readFileSync(path.join(root,'assets/preview-tailwind.css'),'utf8');
for(const utility of ['.bg-purple-600','.rounded-2xl','.dark\\:text-purple-400','.max-w-4xl'])assert.ok(css.includes(utility),`compiled utility ${utility}`);
for(const asset of ['site.js','preview.js']) {
  const source=fs.readFileSync(path.join(root,'assets',asset),'utf8');
  assert.ok(!/\bfetch\s*\(/.test(source),`${asset}: demos must not send visitor data`);
}
console.log(`Documentation checks passed: ${pages} pages, ${index.length} registry components, ${previews} preview combinations, all internal assets/links, and compiled Tailwind overrides.`);
