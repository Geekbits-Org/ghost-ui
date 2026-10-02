import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { escape, gettingStarted, titleFor, code, note, existingTheme, stylingGuide, ghostIntegration, releaseNotes } from '../docs/content.mjs';
import { renderComponentPreview, componentCall, previewStates, hasMembership, vanillaCustomizationCss } from './component-preview.mjs';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(repo, 'packages/cli/package.json'));
const { generateThemeCss } = require('./dist/utils/theme');
const { componentCss, tailwindTheme } = require('./dist/utils/styles');
const registry = JSON.parse(fs.readFileSync(path.join(repo, 'registry/index.json'), 'utf8'));
const manifests = registry.map(item => JSON.parse(fs.readFileSync(path.join(repo, 'registry/components', `${item.name}.json`), 'utf8')));
const version = JSON.parse(fs.readFileSync(path.join(repo, 'packages/cli/package.json'), 'utf8')).version;
const docsRoot = path.join(repo, 'docs');
const out = path.join(docsRoot, 'dist');
// This directory is generated output, never source. Resolve and validate before cleanup.
if (fs.existsSync(out)) {
  if (fs.lstatSync(out).isSymbolicLink() || fs.realpathSync(out) !== path.join(fs.realpathSync(docsRoot), 'dist')) throw new Error('Unexpected documentation output target');
  fs.rmSync(out, { recursive: true, force: true });
}
const write = (relative, content) => { const file = path.join(out, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(docsRoot, 'assets'), path.join(out, 'assets'), { recursive: true });
for (const manifest of manifests) for (const file of manifest.files.filter(file => file.type === 'js')) write(`assets/${file.name}`, file.content);
write('assets/preview-shell.css', ':root{--ghost-accent-color:#e46735}body{margin:0;background:var(--background);color:var(--foreground);font:16px/1.5 ui-sans-serif,system-ui,sans-serif}.preview-shell{padding:24px;overflow-wrap:anywhere}.preview-empty{padding:32px;border:1px dashed var(--border);border-radius:8px;text-align:center;color:var(--muted-foreground)}#preview-feedback{font-size:14px;margin:12px 0 0;color:var(--muted-foreground)}#preview-feedback:empty{display:none}');
for (const style of ['css','tailwind']) {
  const theme = generateThemeCss({ style, baseColor:'zinc', accentColor:'ghost', radius:'0.5rem' });
  const styles = manifests.flatMap(manifest => manifest.files.filter(file => file.type === 'style').map(file => componentCss(file.content, style))).join('\n');
  if (style === 'css') write('assets/preview-css.css', `${theme}\n${styles}\n${vanillaCustomizationCss}`);
  else write('assets/tailwind-components.css', `${tailwindTheme()}\n${theme}\n${styles}`);
  for (const manifest of manifests) for (const scheme of ['light','dark']) for (const variant of ['default','custom']) for (const state of hasMembership(manifest.name) ? previewStates : ['visitor']) {
    write(`previews/${manifest.name}-${style}-${scheme}-${variant}-${state}.html`, renderComponentPreview(manifest, { style, scheme, variant, state }));
  }
}
const cli = path.join(path.dirname(require.resolve('@tailwindcss/cli/package.json')), 'dist/index.mjs');
const compilation = spawnSync(process.execPath, [cli, '-i', './docs/tailwind.css', '-o', './docs/dist/assets/preview-tailwind.css', '--minify'], { cwd: repo, encoding:'utf8' });
if (compilation.status !== 0) throw new Error(compilation.stderr || compilation.error?.message || 'Tailwind preview compilation failed');
const navGroups = [
  ['Start here', [['/','Getting started'], ['/guides/existing-theme/','Existing themes'], ['/guides/styling/','Styling'], ['/guides/ghost/','Ghost integration'], ['/releases/','Releases']]],
  ['Components', [['/components/','Overview'], ...manifests.map(item => [`/components/${item.name}/`,titleFor(item.name)])]]
];
export function layout(title, body, current) {
  const nav = navGroups.map(([heading, links]) => `<section class="nav-group"><h2>${heading}</h2>${links.map(([href,label]) => `<a href="${href}" ${current === href ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</section>`).join('');
  const favicon = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#dc4d24"/><path d="M18 8h-6v16h10v-8h-6" fill="none" stroke="white" stroke-width="3"/></svg>');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · Ghostcn</title><meta name="description" content="Ghostcn documentation: Ghost theme setup, component previews, and per-instance Tailwind and vanilla CSS styling."><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${favicon}"><link rel="stylesheet" href="/assets/site.css"><script defer src="/assets/site.js"></script></head><body><a class="skip" href="#content">Skip to content</a><header class="topbar"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">g</span>ghostcn<span class="version">v${version}</span></a><nav class="top-links" aria-label="External links"><a href="https://github.com/Geekbits-Org/ghost-ui">GitHub</a><a class="npm-link" href="https://www.npmjs.com/package/ghostcn">npm</a></nav></header><details class="mobile-nav"><summary>Documentation navigation</summary><nav aria-label="Mobile documentation">${nav}</nav></details><div class="layout"><aside class="sidebar"><nav class="sidebar-inner" aria-label="Documentation">${nav}<p class="sidebar-foot">Copy the code.<br>Keep your theme yours.</p></nav></aside><main id="content">${body}<footer class="page-footer">Ghostcn ${version} · <a href="https://github.com/Geekbits-Org/ghost-ui/issues">Report a documentation issue</a></footer></main></div></body></html>`;
}
write('index.html', layout('Getting started', gettingStarted(), '/'));
for (const [route,title,content] of [
  ['guides/existing-theme','Existing themes',existingTheme()],
  ['guides/styling','Styling',stylingGuide()],
  ['guides/ghost','Ghost integration',ghostIntegration()],
  ['releases','Releases',releaseNotes()]
]) write(`${route}/index.html`, layout(title, content, `/${route}/`));
write('components/index.html', layout('Components', `<p class="eyebrow">Component registry</p><h1>Small pieces. Your publication.</h1><p class="lead">${manifests.length} Ghost-native components. Preview their defaults, try per-instance styling, and copy the usage into your theme.</p><div class="component-list">${manifests.map(manifest => `<a class="component-tile" href="/components/${manifest.name}/"><h2>${titleFor(manifest.name)}</h2><p>${escape(manifest.description)}</p></a>`).join('')}</div>`, '/components/'));
const slotDescription = {
  class: 'Root element of this component.', buttonClass: 'All theme-owned buttons that render; not Ghost-owned UI.',
  cardClass: 'Nested cards, not the component’s root.', titleClass: 'Main component heading or author name.',
  gridClass: 'Grid holding nested cards.', descriptionClass: 'Description or excerpt, when available.',
  contentClass: 'Internal content area.', inputClass: 'Newsletter email input.', formClass: 'Newsletter form.',
  avatarClass: 'Author avatar image or fallback.', imageClass: 'Post image, when available.',
  metaClass: 'Metadata row.', footerClass: 'Card footer.', innerClass: 'Inner layout container.',
  navClass: 'Navigation container(s).', socialClass: 'Social links container.', statusClass: 'Pagination page-count text.',
  cardTitleClass: 'Heading inside a reading card.', labelClass: 'Previous/next direction label.', listClass: 'Tag or table-of-contents list.', linkClass: 'Individual tag or generated heading links.'
};
const readingNotes = {
  'related-posts': '<p>Use inside <code>{{#post}}</code>. Related posts share the primary tag; untagged posts fall back to recent posts. The current post is excluded, and no section renders if there are no results. Set <code>heading="More stories"</code> to change the section heading.</p>',
  'post-navigation': '<p>Use inside <code>{{#post}}</code>. Previous/next links follow Ghost’s chronological post navigation. Missing neighbors render no link, and an entirely empty navigation is hidden.</p>',
  'tag-list': '<p>Use inside a post or post loop. Only public tags render; internal tags stay hidden. Posts without public tags render no navigation.</p>',
  'table-of-contents': `<p>Place beside your article content inside <code>{{#post}}</code>. The installer links its deferred JavaScript in <code>default.hbs</code>. For another layout, add the script manually:</p>${code('<script defer src="{{asset "js/components/table-of-contents.js"}}"></script>', 'handlebars')}<p>By default it scans <code>.ghcn-article-content</code>. For an existing theme, pass <code>contentSelector=".your-article-content"</code>. Change the title with <code>heading="In this article"</code>. It lists article H2/H3 headings, excludes editor-card UI headings, creates unique anchors, and stays hidden with fewer than two headings. <code>linkClass</code> styles the links generated by JavaScript.</p>`
};
for (const manifest of manifests) {
  const title = titleFor(manifest.name);
  const membership = hasMembership(manifest.name);
  const controls = `<label>Styles<select name="style"><option value="css">Vanilla CSS</option><option value="tailwind">Tailwind CSS</option></select></label><label>Theme<select name="scheme"><option value="light">Light</option><option value="dark">Dark</option></select></label><label>Appearance<select name="variant"><option value="default">Default</option><option value="custom">Customized</option></select></label>${membership ? `<label>Member state<select name="member"><option value="visitor">Visitor</option><option value="free">Free member</option><option value="paid">Paid member</option><option value="disabled">Membership disabled</option><option value="invite">Invite only</option><option value="restricted">Self-signup restricted</option></select></label>` : ''}`;
  const demoNote = manifest.name === 'pricing-table' ? 'Demo tiers and prices. Your installed table uses the active public tiers configured in Ghost.' : 'Demo content, rendered from the actual component partial. Membership, search, and navigation run on your real Ghost publication.';
  const files = manifest.files.map(file => `<li><code>${escape(file.target)}</code></li>`).join('');
  const slots = Object.entries(manifest.styleSlots).map(([name,targets]) => `<tr><td><code>${name}</code></td><td>${slotDescription[name] || 'Internal element.'}<br><small>${escape(targets.join(', '))}</small></td></tr>`).join('');
  const content = `<p class="eyebrow">Components / ${manifest.name}</p><h1>${title}</h1><p class="lead">${escape(manifest.description)}</p><section class="preview-box" data-component-preview="${manifest.name}" aria-label="${title} interactive preview"><div class="preview-controls">${controls}</div><iframe class="preview-frame" title="${title} preview" src="/previews/${manifest.name}-css-light-default-visitor.html" sandbox="allow-scripts"></iframe><div class="preview-notice">${demoNote}<p class="preview-status" role="status"></p></div></section>
  <h2>Install</h2>${code(`npx ghostcn@latest add ${manifest.name}`)}<h2>Use in a template</h2>${code(componentCall(manifest), 'handlebars')}${manifest.name === 'pagination' ? note('The native <code>{{pagination}}</code> helper uses this partial automatically. Call it directly as shown above to pass styling parameters.') : ''}
  ${readingNotes[manifest.name] || ''}<h2>Customize each instance</h2><p>Parameters are optional and keep the semantic identity classes and default styles. Original components support them from 1.3.0; reading components are new in 1.4.0.</p><h3>Tailwind</h3>${code(componentCall(manifest,true,'tailwind'),'handlebars')}<h3>Vanilla CSS</h3>${code(componentCall(manifest,true,'css'),'handlebars')}${code(vanillaCustomizationCss.trim(),'css')}
  <h2>Styling parameters</h2><div class="table-wrap"><table><thead><tr><th>Parameter</th><th>Target</th></tr></thead><tbody>${slots}</tbody></table></div><p>Parameters only affect elements that render for your current content and membership settings. <a href="/guides/styling/">Read the styling guide</a> for reuse, specificity, and upgrade boundaries.</p><h2>Installed files</h2><ul>${files}</ul><p><a href="https://github.com/Geekbits-Org/ghost-ui/blob/main/registry/components/${manifest.name}.json">View the registry source</a></p>`;
  write(`components/${manifest.name}/index.html`,layout(title,content,`/components/${manifest.name}/`));
}
write('404.html', layout('Page not found', '<p class="eyebrow">404</p><h1>Page not found.</h1><p>Return to <a href="/">getting started</a> or browse the <a href="/components/">component gallery</a>.</p>', ''));
console.log(`Built Ghostcn ${version} documentation at ${out}`);
