import Handlebars from 'handlebars';

// Synthetic data only. This is shared by static docs and the local playground,
// never used by production themes, never connected to Ghost/Stripe/email APIs.
// Text-free artwork survives the lead, thumbnail and article crops.
const editorialImage = (background: string, ink: string, motif: string) => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="${background}"/><g fill="${ink}">${motif}</g></svg>`
);
export const demoImage = editorialImage('#ded4c3', '#38362f', '<path d="M315 475V220L560 120l205 100v255L560 575z"/><path d="M560 170v348l160-71V250z" fill="#b68f74"/><path d="M359 249l157-66v324l-157-55z" fill="#f4ece1"/><path d="M817 232v245l76-34V272z" fill="#9a8c74"/>');
const secondImage = editorialImage('#cbd1c5', '#374738', '<circle cx="600" cy="337" r="210"/><path d="M380 336h440v35H380z" fill="#f0ede1"/><circle cx="600" cy="337" r="116" fill="#aab4a1"/><path d="M573 121h54v431h-54z" fill="#677c65" opacity=".8"/>');
const thirdImage = editorialImage('#dbc7bb', '#6a483e', '<path d="M334 454l140-235 127 208 126-208 140 235z"/><path d="M312 485h576v40H312z" fill="#9c6956"/><circle cx="603" cy="166" r="44" fill="#f5e4cd"/>');
export const demoAuthor = { name: 'Alex Reader', url: '/author/alex/', bio: 'Writing about independent publishing, thoughtful design, and building a home for your readers.', location: 'Everywhere', count: { posts: 12 } };
const tags = [{ name: 'Publishing', description: 'Stories about independent publishing.', url: '/tag/publishing/', visibility: 'public' }, { name: 'Design', description: 'The details that make it yours.', url: '/tag/design/', visibility: 'public' }];
export const demoPost = { title: 'A home for independent ideas', url: '/a-home-for-independent-ideas/', excerpt: 'Good stories deserve a place of their own. Build a publication around your ideas, your community, and your voice.', custom_excerpt: 'Good stories deserve a place of their own.', feature_image: demoImage, feature_image_alt: 'An abstract illustration of folded paper', primary_author: demoAuthor, primary_tag: tags[0], tags, access: true };
export const demoPosts = [
  demoPost,
  { ...demoPost, title: 'Make room for your readers', url: '/make-room-for-your-readers/', feature_image: secondImage, feature_image_alt: 'An abstract illustration of intersecting circles', excerpt: 'A thoughtful reading experience starts with space for the story and a clear path to what comes next.' },
  { ...demoPost, title: 'The details that make it yours', url: '/the-details-that-make-it-yours/', feature_image: thirdImage, feature_image_alt: 'An abstract illustration of two hills and the sun', excerpt: 'The small choices that make your publication feel unmistakably yours.' },
];
const tiers = [{ id: 'demo-free', type: 'free', name: 'Reader', description: 'Follow the publication.', benefits: ['New posts in your inbox'] }, { id: 'demo-paid', type: 'paid', name: 'Supporter', description: 'Support independent writing.', currency: 'USD', monthly_price: 500, yearly_price: 5000, benefits: ['Everything in Reader', 'Members-only stories'] }];
export const previewStates = ['visitor', 'free', 'paid', 'disabled', 'invite', 'restricted'];
export const previewDemoContext = { ...demoPost, posts: demoPosts, pagination: { page: 2, pages: 4, prev: 1, next: 3 } };
export const demoParameters: Record<string, Record<string, string>> = {
  button: { text: 'Read the story' },
  card: { heading: 'Make yourself at home', description: 'A small card, ready for your content.', body: 'Build something for your readers.', footer: 'Your publication. Your style.' },
  badge: { text: 'Featured' },
  input: { label: 'Email address', type: 'email', name: 'email', placeholder: 'you@example.com', hint: 'We will keep your email private.', hintId: 'demo-email-hint' },
  alert: { heading: 'You are all set', description: 'Your theme is ready to customize.' },
  'post-grid': { heading: 'Latest stories' }, 'author-list': { heading: 'Meet the authors' }, 'tag-grid': { heading: 'Explore topics' },
  'archive-header': { heading: 'Publishing', description: 'Ideas for a publication of your own.', eyebrow: 'Topic', archiveImage: demoImage, imageAlt: 'Demo archive image' }
};

export function renderPreviewTemplate(partials: Record<string, string>, template: string, options: { state?: string; context?: Record<string, unknown> } = {}) {
  const state = options.state || 'visitor';
  const hbs = Handlebars.create();
  hbs.registerPartial(partials);
  hbs.registerHelper('foreach', (items: any[], opts) => {
    const visible = (items || []).filter(item => opts.hash.visibility !== 'public' || item.visibility !== 'internal');
    if (!visible.length) return opts.inverse ? opts.inverse({}) : '';
    return visible.map((item, index) => opts.fn(item, { data: { ...opts.data, index, first: index === 0, last: index === visible.length - 1 } })).join('');
  });
  hbs.registerHelper('prev_post', opts => opts.fn({ ...demoPost, title: 'The previous story', url: '/previous-story/' }, { data: opts.data }));
  hbs.registerHelper('next_post', opts => opts.fn({ ...demoPost, title: 'The next story', url: '/next-story/' }, { data: opts.data }));
  hbs.registerHelper('get', (resource, opts) => opts.fn(resource === 'tiers' ? { tiers } : resource === 'authors' ? { authors: [demoAuthor] } : resource === 'tags' ? { tags } : { posts: demoPosts }, { data: opts.data }));
  hbs.registerHelper('match', function (this: unknown, value, expected, opts) { return value === expected ? opts.fn(this) : opts.inverse(this); });
  hbs.registerHelper('has', function (this: unknown, opts) { return String(opts.data?.index) === opts.hash.index ? opts.fn(this) : opts.inverse(this); });
  hbs.registerHelper('post', opts => opts.fn(demoPost, { data: opts.data }));
  hbs.registerHelper('primary_author', function (this: typeof demoPost, opts) { return opts.fn(this.primary_author, { data: opts.data }); });
  hbs.registerHelper('img_url', value => value);
  hbs.registerHelper('url', function (this: { url: string }) { return this.url; });
  hbs.registerHelper('excerpt', function (this: { excerpt: string }) { return this.excerpt; });
  hbs.registerHelper('asset', value => `/theme-assets/${value}`);
  hbs.registerHelper('reading_time', () => '4 min read');
  hbs.registerHelper('date', opts => opts.hash.format === 'YYYY' ? '2026' : opts.hash.format === 'YYYY-MM-DD' ? '2026-10-01' : '1 Oct 2026');
  hbs.registerHelper('plural', (count, opts) => String(count === 0 ? opts.hash.empty : count === 1 ? opts.hash.singular : opts.hash.plural).replace('%', String(count)));
  hbs.registerHelper('social_url', () => 'https://example.com');
  hbs.registerHelper('page_url', page => `/page/${page}/`);
  hbs.registerHelper('navigation', () => new hbs.SafeString('<ul class="nav"><li class="nav-current"><a href="/">Home</a></li><li><a href="/about/">About</a></li><li><a href="/archive/">Archive</a></li></ul>'));
  hbs.registerHelper('search', () => new hbs.SafeString('<button type="button" class="ghcn-icon-button ghcn-button--ghost" aria-label="Search"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15 15 6 6" stroke="currentColor" stroke-width="2"/></svg></button>'));
  hbs.registerHelper('price', (amount, opts) => new Intl.NumberFormat('en', { style: 'currency', currency: opts.hash.currency }).format(amount / 100));
  const site = { title: 'Ghostcn Journal', url: '/', description: 'Independent ideas, shared with your readers.', locale: 'en', members_enabled: state !== 'disabled', paid_members_enabled: state !== 'disabled', members_invite_only: state === 'invite', allow_self_signup: !['disabled', 'invite', 'restricted'].includes(state) };
  const data = { site, member: ['free', 'paid'].includes(state) ? { paid: state === 'paid' } : undefined };
  return hbs.compile(template)(options.context || previewDemoContext, { data });
}

export function previewInvocation(partialName: string, parameters: Record<string, unknown>) {
  // Values are bound as data, never interpolated into executable Handlebars source.
  if (!/^[a-zA-Z0-9/_-]+$/.test(partialName)) throw new Error('Unsafe partial name.');
  const keys = Object.keys(parameters);
  if (keys.some(key => !/^[a-zA-Z][a-zA-Z0-9]*$/.test(key))) throw new Error('Unsafe preview parameter.');
  return `{{> "${partialName}" ${keys.map(key => `${key}=${key}`).join(' ')}}}`;
}
