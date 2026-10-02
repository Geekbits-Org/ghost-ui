import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Handlebars from 'handlebars';
import { getComponent } from '../utils/registry';
import { installComponent } from '../utils/component-installer';
import { scaffoldTheme } from '../utils/theme-scaffold';
import { buildGhostcnConfig, initializeThemeProject } from '../utils/theme-project';

async function renderer(name: string) {
  const hbs = Handlebars.create();
  hbs.registerPartial('component', (await getComponent(name))!.files.find(file => file.type === 'partial')!.content);
  hbs.registerHelper('url', function (this: any) { return this.url; });
  hbs.registerHelper('img_url', src => src);
  hbs.registerHelper('excerpt', function (this: any) { return this.excerpt || ''; });
  hbs.registerHelper('foreach', (items, options) => {
    const visible = (items || []).filter((item: any) => options.hash.visibility !== 'public' || item.visibility !== 'internal');
    return visible.map((item: any, index: number) => options.fn(item, { data: { ...options.data, first: index === 0, last: index === visible.length - 1 } })).join('');
  });
  return hbs;
}
test('tag lists hide internal tags, escape names and render nothing when public tags are absent', async () => {
  const hbs = await renderer('tag-list');
  const render = hbs.compile('{{> component class="my-tags" linkClass="purple-link"}}');
  assert.equal(render({ tags: [] }).trim(), '');
  assert.equal(render({ tags: [{ name: '#private', visibility: 'internal' }] }).trim(), '');
  const html = render({ tags: [{ name: 'Design <script>', url: '/tag/design/', visibility: 'public' }, { name: '#private', visibility: 'internal' }] });
  assert.ok(html.includes('ghcn-tag-list my-tags') && html.includes('ghcn-tag-list__link purple-link'));
  assert.ok(html.includes('Design &lt;script&gt;') && !html.includes('#private'));
  assert.equal((html.match(/<nav/g) || []).length, 1);
});
test('post navigation omits unavailable neighbors and preserves caller styles in helper contexts', async () => {
  const hbs = await renderer('post-navigation');
  hbs.registerHelper('prev_post', options => options.inverse({}, { data: options.data }));
  hbs.registerHelper('next_post', options => options.inverse({}, { data: options.data }));
  const render = hbs.compile('{{> component class="post-links" cardClass="card-purple"}}');
  assert.ok(/<nav[^>]*><\/nav>/.test(render({})));
  hbs.registerHelper('next_post', options => options.fn({ title: 'Next story', url: '/next/' }, { data: options.data }));
  const html = render({});
  assert.ok(!html.includes('rel="prev"') && html.includes('rel="next"') && html.includes('card-purple'));
});
test('related posts omit empty results and preserve scoped styles through queries and loops', async () => {
  const hbs = await renderer('related-posts');
  const queries: string[] = [];
  hbs.registerHelper('get', (_resource, options) => { queries.push(options.hash.filter); return options.fn({ posts: [] }, { data: options.data }); });
  const render = hbs.compile('{{> component class="reading" heading="More stories" cardClass="purple-card"}}');
  assert.equal(render({ primary_tag: { slug: 'design' } }).trim(), '');
  assert.ok(queries[0].includes('tag:{{primary_tag.slug}}'));
  hbs.registerHelper('get', (_resource, options) => options.fn({ posts: [{ title: 'Neighbor', url: '/neighbor/', excerpt: 'Intro' }] }, { data: options.data }));
  const html = render({});
  assert.ok(html.includes('More stories') && html.includes('ghcn-related__card purple-card') && html.includes('/neighbor/'));
});
test('adding TOC manages scripts once and never changes unrelated host scripts', async () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-reading-'));
  try {
    const { themeRoot } = scaffoldTheme({ parentDirectory: parent, themeName: 'reading', style: 'css', colorScheme: 'Auto', packageManager: 'npm' });
    const config = buildGhostcnConfig({ style: 'css', baseColor: 'zinc', accentColor: 'ghost', radius: '0.5rem' });
    initializeThemeProject({ themeRoot, config });
    const file = path.join(themeRoot, 'default.hbs');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('</body>', '<script src="{{asset "js/host.js"}}"></script>\n</body>'));
    await installComponent({ themeRoot, config, componentName: 'table-of-contents' });
    const first = fs.readFileSync(file, 'utf8');
    await installComponent({ themeRoot, config, componentName: 'table-of-contents' });
    const second = fs.readFileSync(file, 'utf8');
    assert.equal(first, second);
    assert.equal((second.match(/js\/components\/table-of-contents.js/g) || []).length, 1);
    assert.ok(second.includes('js/host.js'));
    assert.ok(second.includes('<script defer src="{{asset "js/components/table-of-contents.js"}}"></script>'));
  } finally { fs.rmSync(parent, { recursive: true, force: true }); }
});
