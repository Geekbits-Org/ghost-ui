// Demo rendering only. Production components still use Ghost's native helpers.
// Both documentation and release QA can use this without duplicating rendering mechanics.
import { createRequire } from 'node:module';
const require = createRequire(new URL('../packages/cli/package.json', import.meta.url));
const { renderPreviewTemplate, previewDemoContext, demoParameters, previewStates: states } = require('./dist/utils/preview-renderer');
export const previewStates = states;
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
  const defaults = Object.entries(demoParameters[name] || {}).filter(([key]) => key !== 'archiveImage').map(([key, value]) => ` ${key}=${JSON.stringify(value)}`).join('');
  const call = name === 'pagination' ? `{{> "pagination" pagination${parameters}}}` : `{{> "components/${name}"${defaults}${parameters}}}`;
  if (name === 'post-card') return `{{#foreach posts}}\n${call}\n{{/foreach}}`;
  if (name === 'author-card') return `{{#primary_author}}\n${call}\n{{/primary_author}}`;
  if (['post-header', 'member-cta', 'related-posts', 'post-navigation', 'tag-list'].includes(name)) return `{{#post}}\n${call}\n{{/post}}`;
  return call;
}
export function renderComponentPreview(manifest, { style = 'css', scheme = 'light', variant = 'default', state = 'visitor', manifests = [manifest] } = {}) {
  const partials = Object.fromEntries(manifests.map(item => [`components/${item.name}`, item.files.find(file => file.type === 'partial').content]));
  if (manifest.name === 'pagination') partials.pagination = partials['components/pagination'];
  const context = { ...previewDemoContext, ...(demoParameters[manifest.name] || {}) };
  if (manifest.name === 'post-card') context.posts = [previewDemoContext.posts[0]];
  let html = renderPreviewTemplate(partials, componentCall(manifest, variant === 'custom', style), { state, context });
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
