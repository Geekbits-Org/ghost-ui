import { afterEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Handlebars from 'handlebars';
import { getComponent, getRegistryIndex } from '../utils/registry';
import { scaffoldTheme } from '../utils/theme-scaffold';
import { buildGhostcnConfig, initializeThemeProject } from '../utils/theme-project';
import { installComponent } from '../utils/component-installer';

const author = { name: 'Jamie', url: '/author/jamie/', profile_image: '/author.jpg', bio: 'Author bio', location: 'Nairobi', website: 'https://example.com', count: { posts: 2 } };
const post = { title: 'A real post', url: '/story/', feature_image: '/story.jpg', custom_excerpt: 'Intro', excerpt: 'Post excerpt', primary_author: author, primary_tag: { name: 'Design', url: '/tag/design/' }, tags: [{ name: 'Design', url: '/tag/design/', visibility: 'public' }], access: true };
const tiers = [{ id: 'free', name: 'Reader', type: 'free', benefits: ['Weekly posts'], cardClass: 'untrusted-tier-class' }, { id: 'paid', name: 'Supporter', type: 'paid', currency: 'USD', monthly_price: 1000, yearly_price: 10000 }];
const data = { site: { title: 'Publication', url: '/', members_enabled: true, allow_self_signup: true, paid_members_enabled: true } };
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

async function renderer(name: string) {
  const manifest = (await getComponent(name))!;
  const hbs = Handlebars.create();
  hbs.registerPartial('component', manifest.files.find(file => file.type === 'partial')!.content);
  hbs.registerHelper('foreach', (items, options) => {
    const visible = (items || []).filter((item: any) => options.hash.visibility !== 'public' || item.visibility !== 'internal');
    return visible.map((item: unknown, index: number) => options.fn(item, { data: { ...options.data, index, first: index === 0, last: index === visible.length - 1 } })).join('');
  });
  hbs.registerHelper('prev_post', options => options.fn({ ...post, title: 'Previous story' }, { data: options.data }));
  hbs.registerHelper('next_post', options => options.fn({ ...post, title: 'Next story' }, { data: options.data }));
  hbs.registerHelper('get', (resource, options) => options.fn(resource === 'tiers' ? { tiers } : { posts: [post, { ...post, title: 'Another post', cardClass: 'untrusted-post-class' }] }, { data: options.data }));
  hbs.registerHelper('match', function (this: unknown, a, b, options) { return a === b ? options.fn(this) : options.inverse(this); });
  hbs.registerHelper('has', function (this: unknown, options) { return String(options.data?.index) === options.hash.index ? options.fn(this) : options.inverse(this); });
  hbs.registerHelper('post', (options) => options.fn(post, { data: options.data }));
  hbs.registerHelper('primary_author', function (this: typeof post, options) { return options.fn(this.primary_author, { data: options.data }); });
  hbs.registerHelper('navigation', () => new hbs.SafeString('<ul><li>Home</li></ul>'));
  hbs.registerHelper('search', () => new hbs.SafeString('<button aria-label="Search">Search</button>'));
  hbs.registerHelper('img_url', value => value);
  hbs.registerHelper('url', function (this: { url: string }) { return this.url; });
  hbs.registerHelper('excerpt', function (this: { excerpt: string }) { return this.excerpt; });
  hbs.registerHelper('price', amount => `$${amount / 100}`);
  hbs.registerHelper('reading_time', () => '1 min read');
  hbs.registerHelper('date', () => '2026');
  hbs.registerHelper('page_url', page => `/page/${page}/`);
  hbs.registerHelper('plural', () => '2 posts');
  hbs.registerHelper('social_url', () => '#');
  const context = name === 'author-card' ? author : name === 'pagination' ? { page: 2, pages: 3, prev: 1, next: 3 } : post;
  return { manifest, hbs, context };
}

describe('call-site component styling', () => {
  test('all registry components expose a universal root class and render their declared slots', async () => {
    for (const item of await getRegistryIndex()) {
      const { manifest, hbs, context } = await renderer(item.name);
      assert.ok(manifest.styleSlots?.class, `${item.name} root class`);
      const parameters = Object.keys(manifest.styleSlots!).map(key => `${key}="custom-${key}"`).join(' ');
      const html = hbs.compile(`{{> component ${parameters}}}`)(context, { data });
      for (const [key, selectors] of Object.entries(manifest.styleSlots!)) {
        if (item.name === 'table-of-contents' && key === 'linkClass') {
          assert.ok(html.includes('data-link-class="custom-linkClass"'), 'dynamic link class is passed to the TOC script');
          continue;
        }
        // Some slots are conditional alternatives (e.g. a newsletter's Portal button).
        assert.ok(selectors.some(selector => new RegExp(`class="${selector.slice(1)} custom-${key}(?:[ "]|$)`).test(html)), `${item.name}.${key}`);
      }
      const plain = hbs.compile('{{> component}}')(context, { data });
      assert.ok(!plain.includes('custom-') && !plain.includes('undefined'));
      assert.equal(plain, hbs.compile('{{> component class=""}}')(context, { data }));
    }
  });

  test('pricing call-site styles survive get/foreach, apply to free and paid buttons, and keep sibling instances isolated', async () => {
    const { hbs } = await renderer('pricing-table');
    const context = Object.freeze({ title: 'Caller title', shared: true });
    const html = hbs.compile('{{#post}}{{> component class="first" cardClass="purple-card" buttonClass="purple-button"}}{{> component class="second" cardClass="plain-card" buttonClass="plain-button"}}{{> component}}{{/post}}')(context, { data });
    const sections = html.match(/<section\b[\s\S]*?<\/section>/g)!;
    assert.equal(sections.length, 3);
    assert.equal((sections[0].match(/gh-pricing-card purple-card/g) || []).length, 2);
    assert.equal((sections[0].match(/ghcn-button purple-button/g) || []).length, 3);
    assert.ok(!sections[0].includes('plain-card') && !sections[1].includes('purple-card'));
    assert.ok(!sections[2].includes('purple-card') && !sections[2].includes('plain-card'));
    assert.ok(!html.includes('untrusted-tier-class'));
    assert.ok(html.includes('signup/paid/monthly') && html.includes('signup/paid/yearly') && html.includes('signup/free'));
    assert.deepEqual(context, { title: 'Caller title', shared: true });
  });

  test('featured-post styles survive nested post scopes and repeated instances have no duplicate IDs', async () => {
    const { hbs } = await renderer('featured-posts');
    const html = hbs.compile('{{> component class="first" cardClass="first-card"}}{{> component class="second" cardClass="second-card"}}')({}, { data });
    assert.equal((html.match(/ghcn-featured__card first-card/g) || []).length, 2);
    assert.equal((html.match(/ghcn-featured__card second-card/g) || []).length, 2);
    assert.ok(!html.includes('untrusted-post-class'));
    assert.ok(!html.includes('id="ghcn-featured-title"'));
    assert.ok(html.includes('ghcn-featured__card--lead'));
  });

  test('class strings are escaped and cannot inject HTML attributes', async () => {
    for (const name of ['pricing-table', 'post-card', 'featured-posts']) {
      const { hbs, context } = await renderer(name);
      const html = hbs.compile('{{> component class=unsafe cardClass=unsafe}}')({ ...context, unsafe: 'custom" onclick="alert(1)<script>' }, { data });
      assert.ok(html.includes('&quot;') && html.includes('&lt;script&gt;'));
      assert.ok(!html.includes(' onclick="') && !html.includes('<script>'));
    }
  });

  test('alternative newsletter Portal and author fallback elements receive their slots', async () => {
    const newsletter = await renderer('newsletter-form');
    const html = newsletter.hbs.compile('{{> component buttonClass="purple-button"}}')({}, { data: { site: { ...data.site, portal_signup_checkbox_required: true } } });
    assert.ok(html.includes('ghcn-button purple-button') && !html.includes('data-members-form'));
    const authorRenderer = await renderer('author-card');
    const fallback = authorRenderer.hbs.compile('{{> component avatarClass="avatar-custom"}}')({ ...author, profile_image: undefined }, { data });
    assert.ok(fallback.includes('gh-author-avatar-fallback avatar-custom'));
  });

  for (const style of ['css', 'tailwind'] as const) {
    test(`${style} reinstallation keeps call-site styles and custom theme CSS untouched`, async () => {
      const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-style-slots-'));
      roots.push(parent);
      const { themeRoot } = scaffoldTheme({ parentDirectory: parent, themeName: 'styled-theme', style, colorScheme: 'Auto', packageManager: 'npm' });
      const config = buildGhostcnConfig({ style, baseColor: 'zinc', accentColor: 'ghost', radius: '0.5rem' });
      initializeThemeProject({ themeRoot, config });
      const template = '{{!< default}}\n{{> "components/pricing-table" class="membership" cardClass="membership-card" buttonClass="bg-purple-600"}}';
      fs.writeFileSync(path.join(themeRoot, 'index.hbs'), template);
      const cssPath = path.join(themeRoot, 'assets/css/source.css');
      fs.appendFileSync(cssPath, '\n.membership-card { background: purple; }\n');
      const customCss = fs.readFileSync(cssPath, 'utf8');
      await installComponent({ themeRoot, config, componentName: 'pricing-table' });
      await installComponent({ themeRoot, config, componentName: 'pricing-table', overwrite: true });
      assert.equal(fs.readFileSync(path.join(themeRoot, 'index.hbs'), 'utf8'), template);
      assert.equal(fs.readFileSync(cssPath, 'utf8'), customCss);
      assert.ok(fs.readFileSync(path.join(themeRoot, 'partials/components/pricing-table.hbs'), 'utf8').includes('ghostcnStyles.cardClass'));
    });
  }
});
