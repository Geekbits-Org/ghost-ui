// Demo rendering only. Production components still use Ghost's native helpers.
// Both documentation and release QA can use this without duplicating rendering mechanics.
import { createRequire } from 'node:module';
const require = createRequire(new URL('../packages/cli/package.json', import.meta.url));
const Handlebars = require('handlebars');
const demoImage = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><rect width="1200" height="675" fill="#172f45"/><path d="M0 470h1200v205H0z" fill="#e46735"/><text x="80" y="180" font-family="sans-serif" font-size="72" fill="white">Ghostcn Journal</text><text x="80" y="270" font-family="sans-serif" font-size="36" fill="#b7cad9">Demo feature image</text></svg>');
const author = { name: 'Alex Reader', url: '/author/alex/', bio: 'Writing about independent publishing, thoughtful design, and building a home for your readers.', location: 'Everywhere', count: { posts: 12 } };
const post = { title: 'A home for independent ideas', url: '/a-home-for-independent-ideas/', excerpt: 'Good stories deserve a place of their own. Build a publication around your ideas, your community, and your voice.', custom_excerpt: 'Good stories deserve a place of their own.', feature_image: demoImage, feature_image_alt: 'Demo feature image for Ghostcn Journal', primary_author: author, primary_tag: { name: 'Publishing', url: '/tag/publishing/' }, access: true };
const posts = [post, { ...post, title: 'Make room for your readers' }, { ...post, title: 'The details that make it yours' }];
post.tags = [{ name: 'Publishing', url: '/tag/publishing/', visibility: 'public' }, { name: 'Design', url: '/tag/design/', visibility: 'public' }];
const tiers = [{ id: 'demo-free', type: 'free', name: 'Reader', description: 'Follow the publication.', benefits: ['New posts in your inbox'] }, { id: 'demo-paid', type: 'paid', name: 'Supporter', description: 'Support independent writing.', currency: 'USD', monthly_price: 500, yearly_price: 5000, benefits: ['Everything in Reader', 'Members-only stories'] }];

export const previewStates = ['visitor', 'free', 'paid', 'disabled', 'invite', 'restricted'];
export const hasMembership = name => ['site-header', 'newsletter-form', 'pricing-table', 'member-cta'].includes(name);
export const customizedParameters = {
  class: 'mx-auto my-4 max-w-4xl demo-root',
  cardClass: 'rounded-2xl bg-card p-8 shadow-lg demo-card',
  buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white rounded-xl demo-button',
  titleClass: 'text-purple-600 dark:text-purple-400 demo-title',
  inputClass: 'rounded-xl border-purple-500 demo-input',
  avatarClass: 'rounded-xl demo-avatar',
  cardTitleClass: 'text-purple-600 demo-card-title',
  labelClass: 'uppercase tracking-wide demo-label',
  listClass: 'space-y-2 demo-list',
  linkClass: 'text-purple-600 underline demo-link'
};
export function componentCall(manifest, customized = false, style = 'tailwind') {
  const name = manifest.name;
  const parameters = customized ? Object.keys(manifest.styleSlots).filter(key => customizedParameters[key]).map(key => {
    const classes = style === 'tailwind' ? customizedParameters[key] : customizedParameters[key].split(' ').filter(value => value.startsWith('demo-')).join(' ');
    return `\n    ${key}="${classes}"`;
  }).join('') : '';
  const call = name === 'pagination' ? `{{> "pagination" pagination${parameters}}}` : `{{> "components/${name}"${parameters}}}`;
  if (name === 'post-card') return `{{#foreach posts}}\n${call}\n{{/foreach}}`;
  if (name === 'author-card') return `{{#primary_author}}\n${call}\n{{/primary_author}}`;
  if (['post-header', 'member-cta', 'related-posts', 'post-navigation', 'tag-list'].includes(name)) return `{{#post}}\n${call}\n{{/post}}`;
  return call;
}
export function renderComponentPreview(manifest, { style = 'css', scheme = 'light', variant = 'default', state = 'visitor' } = {}) {
  const hbs = Handlebars.create();
  const partial = manifest.files.find(file => file.type === 'partial').content;
  hbs.registerPartial(`components/${manifest.name}`, partial);
  if (manifest.name === 'pagination') hbs.registerPartial('pagination', partial);
  hbs.registerHelper('foreach', (items, options) => (items || []).map((item, index) => options.fn(item, { data: { ...options.data, index, first: index === 0, last: index === items.length - 1 } })).join(''));
  hbs.registerHelper('prev_post', options => options.fn({ ...post, title: 'The previous story', url: '/previous-story/' }, { data: options.data }));
  hbs.registerHelper('next_post', options => options.fn({ ...post, title: 'The next story', url: '/next-story/' }, { data: options.data }));
  hbs.registerHelper('get', (resource, options) => options.fn(resource === 'tiers' ? { tiers } : { posts }, { data: options.data }));
  hbs.registerHelper('match', function (value, expected, options) { return value === expected ? options.fn(this) : options.inverse(this); });
  hbs.registerHelper('has', function (options) { return String(options.data?.index) === options.hash.index ? options.fn(this) : options.inverse(this); });
  hbs.registerHelper('post', options => options.fn(post, { data: options.data }));
  hbs.registerHelper('primary_author', function (options) { return options.fn(this.primary_author, { data: options.data }); });
  hbs.registerHelper('img_url', value => value);
  hbs.registerHelper('url', function () { return this.url; });
  hbs.registerHelper('excerpt', function () { return this.excerpt; });
  hbs.registerHelper('reading_time', () => '4 min read');
  hbs.registerHelper('date', options => options.hash.format === 'YYYY' ? '2026' : options.hash.format === 'YYYY-MM-DD' ? '2026-10-01' : '1 Oct 2026');
  hbs.registerHelper('plural', (count, options) => (count === 0 ? options.hash.empty : count === 1 ? options.hash.singular : options.hash.plural).replace('%', count));
  hbs.registerHelper('social_url', () => 'https://example.com');
  hbs.registerHelper('page_url', page => `/page/${page}/`);
  hbs.registerHelper('navigation', () => new hbs.SafeString('<ul class="nav"><li class="nav-current"><a href="/">Home</a></li><li><a href="/about/">About</a></li><li><a href="/archive/">Archive</a></li></ul>'));
  hbs.registerHelper('search', () => new hbs.SafeString('<button type="button" class="ghcn-icon-button ghcn-button--ghost" aria-label="Search"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15 15 6 6" stroke="currentColor" stroke-width="2"/></svg></button>'));
  hbs.registerHelper('price', (amount, options) => new Intl.NumberFormat('en', { style: 'currency', currency: options.hash.currency }).format(amount / 100));
  const site = { title: 'Ghostcn Journal', url: '/', description: 'Independent ideas, shared with your readers.', locale: 'en', members_enabled: state !== 'disabled', paid_members_enabled: state !== 'disabled', members_invite_only: state === 'invite', allow_self_signup: !['disabled','invite','restricted'].includes(state) };
  const data = { site, member: ['free','paid'].includes(state) ? { paid: state === 'paid' } : undefined };
  const context = manifest.name === 'post-card' ? { posts: [post] } : ['pricing-table','newsletter-form','site-header','site-footer','featured-posts'].includes(manifest.name) ? {} : { ...post, pagination: { page: 2, pages: 4, prev: 1, next: 3 } };
  let html = hbs.compile(componentCall(manifest, variant === 'custom', style))(context, { data });
  if (manifest.name === 'table-of-contents') html += '<article class="ghcn-article-content"><h2>Start with your story</h2><p>Demo article content. The table of contents uses your actual article headings.</p><h3>Make room for readers</h3><p>Subheadings preserve the reading hierarchy.</p><h2>Keep it yours</h2><p>Change each component from its call site.</p></article><script defer src="/assets/table-of-contents.js"></script>';
  const empty = !html.trim();
  return `<!doctype html><html lang="en" class="${scheme === 'dark' ? 'dark-mode' : ''}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${manifest.name} · Ghostcn preview</title><link rel="stylesheet" href="/assets/preview-${style}.css"><link rel="stylesheet" href="/assets/preview-shell.css"></head><body><div class="preview-shell">${empty ? '<p class="preview-empty">This component is hidden for the selected membership settings.</p>' : html}<p id="preview-feedback" role="status"></p></div><script src="/assets/preview.js"></script></body></html>`;
}
export const vanillaCustomizationCss = `
.demo-root { max-width: 56rem; margin: 1rem auto; }
.demo-root .demo-card { padding: 2rem; border-radius: 1rem; background: var(--card); box-shadow: 0 10px 24px #0001; }
.demo-root .demo-button { background: #9333ea; color: white; border-radius: .75rem; }
.demo-root .demo-button:hover { background: #7e22ce; }
.demo-root .demo-title { color: #9333ea; }
.dark-mode .demo-root .demo-title { color: #c084fc; }
.demo-root .demo-input { border-color: #a855f7; border-radius: .75rem; }
.demo-root .demo-avatar { border-radius: .75rem; }
.demo-root .demo-card-title, .demo-root .demo-link { color: #9333ea; }
.demo-root .demo-link { text-decoration: underline; }
.demo-root .demo-label { text-transform: uppercase; letter-spacing: .05em; }
.demo-root .demo-list > * + * { margin-top: .5rem; }
`;
