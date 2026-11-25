const { applyStyleSlots } = require('./component-styling');
const { token, section, surface, focusWithin } = require('./component-defaults');

const choice = (key, values, fallback = 'default') => values
  .filter(value => value !== fallback)
  .reduceRight((otherwise, value) => `{{#match ${key} "${value}"}}${value}{{else}}${otherwise}{{/match}}`, fallback);

const sizes = ['sm', 'default', 'lg'];

function extraComponent({ name, type, description, markup, css, slots, parameters, scripts = [], notes }) {
  return applyStyleSlots({
    name,
    type,
    description,
    dependencies: [],
    ghost_version: '>=5.0.0',
    parameters,
    files: [
      { name: `${name}.hbs`, type: 'partial', target: `partials/components/${name}.hbs`, content: markup },
      { name: `${name}.css`, type: 'style', target: `assets/css/components/${name}.css`, content: css },
      ...scripts
    ],
    gscan: { rules_satisfied: ['GS010-PJ-VALID'], notes }
  }, slots);
}

// 1. theme-toggle
const themeToggleScript = `/* ghostcn theme toggle: persists light/dark/system preference, repeat-safe, no dependencies. */
(() => {
  const KEY = 'ghcn-theme';
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function readPreference() {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch {}
    if (root.classList.contains('dark-mode') || root.classList.contains('dark')) return 'dark';
    if (root.classList.contains('auto-color')) return 'system';
    return 'light';
  }

  function applyTheme(mode, persist) {
    const resolved = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode;
    root.classList.toggle('auto-color', mode === 'system');
    root.classList.toggle('dark-mode', resolved === 'dark');
    root.classList.toggle('dark', resolved === 'dark');
    root.setAttribute('data-theme', resolved);
    if (persist) {
      try { localStorage.setItem(KEY, mode); } catch {}
    }
    document.querySelectorAll('[data-ghcn-theme-toggle]').forEach(container => {
      container.dataset.mode = mode;
      container.dataset.resolved = resolved;
      container.querySelectorAll('[data-theme-value]').forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.dataset.themeValue === mode));
      });
      const cycle = container.querySelector('[data-theme-cycle]');
      if (cycle) {
        const next = resolved === 'dark' ? 'light' : 'dark';
        cycle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
        const label = cycle.querySelector('[data-theme-label]');
        if (label) label.textContent = resolved === 'dark' ? 'Dark' : 'Light';
      }
    });
  }

  function init() {
    const mode = readPreference();
    applyTheme(mode, false);
    document.querySelectorAll('[data-ghcn-theme-toggle]').forEach(container => {
      if (container.dataset.ghcnThemeReady) return;
      container.dataset.ghcnThemeReady = 'true';
      container.querySelectorAll('[data-theme-value]').forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.dataset.themeValue, true));
      });
      const cycle = container.querySelector('[data-theme-cycle]');
      if (cycle) {
        cycle.addEventListener('click', () => {
          const isDark = root.classList.contains('dark-mode') || root.classList.contains('dark');
          applyTheme(isDark ? 'light' : 'dark', true);
        });
      }
    });
    media.addEventListener?.('change', () => {
      if (readPreference() === 'system') applyTheme('system', false);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();`;

const sunSvg = '<svg class="ghcn-theme-toggle__sun" aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="3.5"/><path d="M10 2.5v1.5M10 16v1.5M4.7 4.7l1.1 1.1M14.2 14.2l1.1 1.1M2.5 10H4M16 10h1.5M4.7 15.3l1.1-1.1M14.2 5.8l1.1-1.1"/></svg>';
const monitorSvg = '<svg class="ghcn-theme-toggle__system" aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="3.5" width="15" height="10" rx="1.5"/><path d="M7 16.5h6M10 13.5v3"/></svg>';
const moonSvg = '<svg class="ghcn-theme-toggle__moon" aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 12.2A6.5 6.5 0 0 1 7.8 3.5a6.5 6.5 0 1 0 8.7 8.7Z"/></svg>';

const themeToggle = extraComponent({
  name: 'theme-toggle',
  type: 'components:layout',
  description: 'Light, dark, and system theme switcher syncing .dark-mode and .auto-color with localStorage persistence.',
  markup: `<div class="ghcn-theme-toggle" data-ghcn-theme-toggle data-variant="${choice('variant', ['default', 'compact', 'outline'])}" data-size="${choice('size', sizes)}" role="group" aria-label="{{#if ariaLabel}}{{ariaLabel}}{{else}}Color theme{{/if}}">
  {{#match variant "compact"}}
    <button type="button" class="ghcn-theme-toggle__btn ghcn-theme-toggle__btn--cycle" data-theme-cycle aria-label="Toggle color theme">${sunSvg}${moonSvg}</button>
  {{else}}{{#match variant "outline"}}
    <button type="button" class="ghcn-theme-toggle__btn ghcn-theme-toggle__btn--cycle" data-theme-cycle aria-label="Toggle color theme">${sunSvg}${moonSvg}<span data-theme-label>Theme</span></button>
  {{else}}
    <button type="button" class="ghcn-theme-toggle__btn" data-theme-value="light" aria-label="Light theme" aria-pressed="false">${sunSvg}</button>
    <button type="button" class="ghcn-theme-toggle__btn" data-theme-value="system" aria-label="System theme" aria-pressed="false">${monitorSvg}</button>
    <button type="button" class="ghcn-theme-toggle__btn" data-theme-value="dark" aria-label="Dark theme" aria-pressed="false">${moonSvg}</button>
  {{/match}}{{/match}}
</div>`,
  css: `.ghcn-theme-toggle { box-sizing: border-box; display: inline-flex; align-items: center; gap: 2px; padding: 3px; border: 1px solid var(--border); border-radius: 9999px; background: var(--secondary); color: var(--foreground); font-family: inherit; font-size: ${token('text-small')}; line-height: 1; }
.ghcn-theme-toggle *, .ghcn-theme-toggle *::before, .ghcn-theme-toggle *::after { box-sizing: border-box; }
.ghcn-theme-toggle:where([data-variant="compact"]), .ghcn-theme-toggle:where([data-variant="outline"]) { padding: 0; background: transparent; border-color: transparent; }
.ghcn-theme-toggle__btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-width: 32px; height: 32px; padding: 0 8px; border: 1px solid transparent; border-radius: 9999px; background: transparent; color: var(--muted-foreground); font: inherit; font-weight: 600; cursor: pointer; transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease; }
.ghcn-theme-toggle:where([data-size="sm"]) .ghcn-theme-toggle__btn { min-width: 28px; height: 28px; padding: 0 6px; font-size: 12px; }
.ghcn-theme-toggle:where([data-size="lg"]) .ghcn-theme-toggle__btn { min-width: 38px; height: 38px; padding: 0 12px; font-size: 15px; }
.ghcn-theme-toggle__btn:hover { color: var(--foreground); }
.ghcn-theme-toggle__btn[aria-pressed="true"] { background: var(--background); color: var(--foreground); border-color: var(--border); box-shadow: 0 1px 2px #0001; }
.ghcn-theme-toggle:where([data-variant="compact"]) .ghcn-theme-toggle__btn--cycle,
.ghcn-theme-toggle:where([data-variant="outline"]) .ghcn-theme-toggle__btn--cycle { border-color: var(--border); background: var(--card); color: var(--foreground); border-radius: ${token('control-radius')}; padding: 0 10px; }
.ghcn-theme-toggle:where([data-variant="compact"]) .ghcn-theme-toggle__btn--cycle { padding: 0; }
.ghcn-theme-toggle:where([data-variant="compact"]) .ghcn-theme-toggle__btn--cycle:hover,
.ghcn-theme-toggle:where([data-variant="outline"]) .ghcn-theme-toggle__btn--cycle:hover { background: var(--muted); }
.ghcn-theme-toggle__btn--cycle .ghcn-theme-toggle__moon { display: none; }
.ghcn-theme-toggle[data-resolved="dark"] .ghcn-theme-toggle__btn--cycle .ghcn-theme-toggle__sun { display: none; }
.ghcn-theme-toggle[data-resolved="dark"] .ghcn-theme-toggle__btn--cycle .ghcn-theme-toggle__moon { display: block; }
${focusWithin('.ghcn-theme-toggle')}
@media (prefers-reduced-motion: reduce) { .ghcn-theme-toggle__btn { transition: none; } }
`,
  slots: { class: ['ghcn-theme-toggle'], buttonClass: ['ghcn-theme-toggle__btn'] },
  parameters: {
    variant: { description: 'Visual treatment; segmented 3-way pill, compact icon, or outline button.', options: ['default', 'compact', 'outline'], default: 'default' },
    size: { description: 'Control scale.', options: sizes, default: 'default' },
    ariaLabel: { description: 'Accessible label for the theme toggle group.', default: 'Color theme' }
  },
  scripts: [{ name: 'theme-toggle.js', type: 'js', target: 'assets/js/components/theme-toggle.js', content: themeToggleScript }],
  notes: 'Syncs html.dark-mode and html.auto-color with localStorage; zero external dependencies.'
});

// 2. announcement-bar
const announcementScript = `/* ghostcn announcement bar: dismisses with sessionStorage persistence, repeat-safe. */
(() => {
  function init() {
    document.querySelectorAll('[data-ghcn-announcement]').forEach(bar => {
      if (bar.dataset.ghcnAnnouncementReady) return;
      bar.dataset.ghcnAnnouncementReady = 'true';
      const key = 'ghcn-announcement:' + (bar.dataset.storageKey || 'default');
      try {
        if (sessionStorage.getItem(key) === 'dismissed') { bar.hidden = true; return; }
      } catch {}
      const btn = bar.querySelector('[data-announcement-dismiss]');
      if (!btn) return;
      btn.addEventListener('click', () => {
        bar.hidden = true;
        try { sessionStorage.setItem(key, 'dismissed'); } catch {}
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();`;

const announcementBar = extraComponent({
  name: 'announcement-bar',
  type: 'components:layout',
  description: 'Dismissible top publication announcement bar with optional link and session persistence.',
  markup: `<div class="ghcn-announcement" data-ghcn-announcement data-variant="${choice('variant', ['default', 'secondary', 'outline'])}" data-storage-key="{{#if storageKey}}{{storageKey}}{{else}}default{{/if}}" role="region" aria-label="Announcement">
  <div class="ghcn-announcement__inner ghcn-container">
    <p class="ghcn-announcement__content">
      <span>{{#if text}}{{text}}{{else}}New issue out now — explore the latest stories.{{/if}}</span>
      {{#if href}}<a class="ghcn-announcement__link" href="{{href}}"{{#if dataPortal}} data-portal="{{dataPortal}}"{{/if}}>{{#if linkText}}{{linkText}}{{else}}Learn more{{/if}} <span aria-hidden="true">&rarr;</span></a>{{/if}}
    </p>
    {{#unless hideDismiss}}
    <button type="button" class="ghcn-announcement__dismiss" data-announcement-dismiss aria-label="Dismiss announcement">
      <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
    </button>
    {{/unless}}
  </div>
</div>`,
  css: `.ghcn-announcement { box-sizing: border-box; width: 100%; background: var(--primary); color: var(--primary-foreground); border-bottom: 1px solid transparent; font-family: inherit; font-size: ${token('text-small')}; line-height: 1.4; }
.ghcn-announcement[hidden] { display: none; }
.ghcn-announcement *, .ghcn-announcement *::before, .ghcn-announcement *::after { box-sizing: border-box; }
.ghcn-announcement:where([data-variant="secondary"]) { background: var(--secondary); color: var(--secondary-foreground); border-bottom-color: var(--border); }
.ghcn-announcement:where([data-variant="outline"]) { background: var(--card); color: var(--card-foreground); border-bottom-color: var(--border); }
.ghcn-announcement__inner { display: flex; align-items: center; justify-content: center; gap: 12px; padding-block: 10px; position: relative; }
.ghcn-announcement__content { margin: 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px 12px; text-align: center; }
.ghcn-announcement__link { color: inherit; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; white-space: nowrap; }
.ghcn-announcement__link:hover { opacity: 0.85; }
.ghcn-announcement__dismiss { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex: 0 0 auto; border: 0; border-radius: ${token('control-radius')}; background: transparent; color: inherit; cursor: pointer; opacity: 0.8; transition: opacity 150ms ease, background-color 150ms ease; }
.ghcn-announcement__dismiss:hover { opacity: 1; background: color-mix(in srgb, currentColor 12%, transparent); }
${focusWithin('.ghcn-announcement')}
@media (prefers-reduced-motion: reduce) { .ghcn-announcement__dismiss { transition: none; } }
`,
  slots: { class: ['ghcn-announcement'], contentClass: ['ghcn-announcement__content'], linkClass: ['ghcn-announcement__link'], buttonClass: ['ghcn-announcement__dismiss'] },
  parameters: {
    variant: { description: 'Visual treatment.', options: ['default', 'secondary', 'outline'], default: 'default' },
    text: { description: 'Escaped announcement copy.', default: 'New issue out now — explore the latest stories.' },
    linkText: { description: 'Optional call-to-action link label.', default: 'Learn more' },
    href: { description: 'Optional trusted call-to-action URL.' },
    dataPortal: { description: 'Optional native Ghost Portal trigger for the link.' },
    storageKey: { description: 'Session key so dismissing one banner does not hide future announcements.', default: 'default' },
    hideDismiss: { description: 'Boolean. Hide the dismiss button.' }
  },
  scripts: [{ name: 'announcement-bar.js', type: 'js', target: 'assets/js/components/announcement-bar.js', content: announcementScript }],
  notes: 'Uses native HTML and sessionStorage dismissal; no Ghost API calls.'
});

// 3. reading-progress
const readingProgressScript = `/* ghostcn reading progress: scroll-linked article progress bar, CSP-safe via native <progress>. */
(() => {
  function init() {
    const widgets = [...document.querySelectorAll('[data-ghcn-reading-progress]')].filter(el => !el.dataset.ghcnProgressReady);
    if (!widgets.length) return;
    const entries = widgets.map(el => {
      el.dataset.ghcnProgressReady = 'true';
      let target = null;
      try { target = document.querySelector(el.dataset.contentSelector || '.ghcn-article-content'); } catch {}
      const bar = el.querySelector('progress');
      return bar ? { el, bar, target } : null;
    }).filter(Boolean);
    if (!entries.length) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight || 1;
      for (const { bar, target } of entries) {
        let ratio = 0;
        if (target) {
          const rect = target.getBoundingClientRect();
          if (rect.height <= vh) continue;
          ratio = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - vh)));
        } else {
          const doc = document.scrollingElement || document.documentElement;
          if (doc.scrollHeight <= doc.clientHeight + 4) continue;
          ratio = Math.min(1, Math.max(0, doc.scrollTop / Math.max(1, doc.scrollHeight - doc.clientHeight)));
        }
        const percent = Math.round(ratio * 100);
        bar.value = percent;
        bar.setAttribute('aria-valuenow', String(percent));
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();`;

const readingProgress = extraComponent({
  name: 'reading-progress',
  type: 'components:content',
  description: 'Thin scroll-linked reading progress bar tracking article scroll depth.',
  markup: `<div class="ghcn-reading-progress" data-ghcn-reading-progress data-variant="${choice('variant', ['default', 'subtle', 'gradient'])}" data-size="${choice('size', sizes)}" data-content-selector="{{#if contentSelector}}{{contentSelector}}{{else}}.ghcn-article-content{{/if}}">
  <progress class="ghcn-reading-progress__bar" max="100" value="{{#if initialValue}}{{initialValue}}{{else}}0{{/if}}" aria-label="{{#if ariaLabel}}{{ariaLabel}}{{else}}Reading progress{{/if}}"></progress>
</div>`,
  css: `.ghcn-reading-progress { box-sizing: border-box; position: sticky; top: 0; z-index: 40; width: 100%; height: 3px; background: color-mix(in srgb, var(--border) 60%, transparent); overflow: hidden; }
.ghcn-reading-progress:where([data-size="sm"]) { height: 2px; }
.ghcn-reading-progress:where([data-size="lg"]) { height: 5px; }
.ghcn-reading-progress__bar { display: block; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; appearance: none; background: transparent; color: var(--primary); accent-color: var(--primary); }
.ghcn-reading-progress__bar::-webkit-progress-bar { background: transparent; }
.ghcn-reading-progress__bar::-webkit-progress-value { background: var(--primary); transition: width 80ms linear; }
.ghcn-reading-progress__bar::-moz-progress-bar { background: var(--primary); }
.ghcn-reading-progress:where([data-variant="subtle"]) .ghcn-reading-progress__bar { color: var(--muted-foreground); accent-color: var(--muted-foreground); }
.ghcn-reading-progress:where([data-variant="subtle"]) .ghcn-reading-progress__bar::-webkit-progress-value { background: var(--muted-foreground); }
.ghcn-reading-progress:where([data-variant="subtle"]) .ghcn-reading-progress__bar::-moz-progress-bar { background: var(--muted-foreground); }
.ghcn-reading-progress:where([data-variant="gradient"]) .ghcn-reading-progress__bar::-webkit-progress-value { background: linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 55%, var(--foreground))); }
.ghcn-reading-progress:where([data-variant="gradient"]) .ghcn-reading-progress__bar::-moz-progress-bar { background: linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 55%, var(--foreground))); }
@media (prefers-reduced-motion: reduce) { .ghcn-reading-progress__bar::-webkit-progress-value { transition: none; } }
`,
  slots: { class: ['ghcn-reading-progress'], barClass: ['ghcn-reading-progress__bar'] },
  parameters: {
    variant: { description: 'Progress bar fill style.', options: ['default', 'subtle', 'gradient'], default: 'default' },
    size: { description: 'Bar thickness (2px, 3px, or 5px).', options: sizes, default: 'default' },
    contentSelector: { description: 'CSS selector for the article element to track.', default: '.ghcn-article-content' },
    ariaLabel: { description: 'Accessible label for the progress bar.', default: 'Reading progress' },
    initialValue: { description: 'Optional initial percentage (0-100) for static previews.', default: '0' }
  },
  scripts: [{ name: 'reading-progress.js', type: 'js', target: 'assets/js/components/reading-progress.js', content: readingProgressScript }],
  notes: 'Uses native <progress> element updated on scroll via requestAnimationFrame; zero inline styles.'
});

// 4. share-buttons
const shareButtonsScript = `/* ghostcn share buttons: copy-link feedback and native Web Share progressive enhancement. */
(() => {
  function init() {
    document.querySelectorAll('[data-ghcn-share]').forEach(root => {
      if (root.dataset.ghcnShareReady) return;
      root.dataset.ghcnShareReady = 'true';
      const status = root.querySelector('[data-share-status]');
      const copyBtn = root.querySelector('[data-share-copy]');
      const nativeBtn = root.querySelector('[data-share-native]');
      const shareUrl = root.dataset.shareUrl || window.location.href;
      const shareTitle = root.dataset.shareTitle || document.title;

      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          const label = copyBtn.querySelector('[data-copy-label]');
          try {
            if (navigator.clipboard?.writeText) {
              await navigator.clipboard.writeText(shareUrl);
            } else {
              const input = document.createElement('input');
              input.value = shareUrl;
              document.body.append(input);
              input.select();
              document.execCommand('copy');
              input.remove();
            }
            if (label) label.textContent = 'Copied';
            if (status) status.textContent = 'Link copied to clipboard.';
            setTimeout(() => {
              if (label) label.textContent = 'Copy link';
              if (status) status.textContent = '';
            }, 2000);
          } catch {
            if (status) status.textContent = 'Could not copy link automatically.';
          }
        });
      }

      if (nativeBtn && typeof navigator.share === 'function') {
        nativeBtn.hidden = false;
        nativeBtn.addEventListener('click', () => {
          navigator.share({ title: shareTitle, url: shareUrl }).catch(() => {});
        });
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();`;

const shareButtons = extraComponent({
  name: 'share-buttons',
  type: 'components:content',
  description: 'Accessible article share links (Copy link, Bluesky, X, LinkedIn, Email, and native Web Share).',
  markup: `<div class="ghcn-share" data-ghcn-share data-variant="${choice('variant', ['default', 'icon', 'ghost'])}" data-size="${choice('size', sizes)}" data-share-url="{{#if shareUrl}}{{shareUrl}}{{else}}{{url absolute="true"}}{{/if}}" data-share-title="{{#if shareTitle}}{{shareTitle}}{{else}}{{title}}{{/if}}">
  {{#if heading}}<span class="ghcn-share__title">{{heading}}</span>{{/if}}
  <div class="ghcn-share__list" role="group" aria-label="{{#if heading}}{{heading}}{{else}}Share this post{{/if}}">
    <button type="button" class="ghcn-share__btn" data-share-copy aria-label="Copy link">
      <svg aria-hidden="true" viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1"/><path d="M11.5 8.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1"/></svg>
      <span class="ghcn-share__label" data-copy-label>Copy link</span>
    </button>
    <a class="ghcn-share__btn" href="https://bsky.app/intent/compose?text={{encode title}}%20{{encode (url absolute="true")}}" target="_blank" rel="noopener noreferrer" aria-label="Share on Bluesky">
      <svg aria-hidden="true" viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10.5C8.5 7.4 5.5 4.2 3.6 3.3c-.9-.4-1.6.1-1.6 1.1 0 1 .4 4.2.9 5.3.7 1.4 2.2 1.8 3.6 1.6-2.4.4-4.1 1.7-2.2 4.1 2.2 2.7 4.7-.4 5.7-2.4 1 2 3.5 5.1 5.7 2.4 1.9-2.4.2-3.7-2.2-4.1 1.4.2 2.9-.2 3.6-1.6.5-1.1.9-4.3.9-5.3 0-1-.7-1.5-1.6-1.1-1.9.9-4.9 4.1-6.4 7.2Z"/></svg>
      <span class="ghcn-share__label">Bluesky</span>
    </a>
    <a class="ghcn-share__btn" href="https://x.com/intent/tweet?text={{encode title}}&url={{encode (url absolute="true")}}" target="_blank" rel="noopener noreferrer" aria-label="Share on X">
      <svg aria-hidden="true" viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 3.5 16.5 16.5M16.5 3.5 3.5 16.5"/></svg>
      <span class="ghcn-share__label">X</span>
    </a>
    <a class="ghcn-share__btn" href="https://www.linkedin.com/sharing/share-offsite/?url={{encode (url absolute="true")}}" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
      <svg aria-hidden="true" viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 9v4.5M7 6.5v.01M10 13.5V9m0 1.5a2 2 0 0 1 3.5 1.3v1.7"/></svg>
      <span class="ghcn-share__label">LinkedIn</span>
    </a>
    <a class="ghcn-share__btn" href="mailto:?subject={{encode title}}&body={{encode (url absolute="true")}}" aria-label="Share by email">
      <svg aria-hidden="true" viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="15" height="11" rx="1.5"/><path d="m3.5 5.5 6.5 5 6.5-5"/></svg>
      <span class="ghcn-share__label">Email</span>
    </a>
    <button type="button" class="ghcn-share__btn" data-share-native hidden aria-label="More share options">
      <svg aria-hidden="true" viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3v9M6.5 6.5 10 3l3.5 3.5M4 12.5v3a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-3"/></svg>
      <span class="ghcn-share__label">Share</span>
    </button>
  </div>
  <span class="ghcn-share__status" data-share-status role="status" aria-live="polite"></span>
</div>`,
  css: `.ghcn-share { ${section} display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; }
.ghcn-share *, .ghcn-share *::before, .ghcn-share *::after { box-sizing: border-box; }
.ghcn-share__title { font-size: ${token('text-small')}; font-weight: 600; color: var(--muted-foreground); }
.ghcn-share__list { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.ghcn-share__btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 36px; padding: 6px 12px; border: 1px solid var(--border); border-radius: ${token('control-radius')}; background: var(--card); color: var(--foreground); font: inherit; font-size: ${token('text-meta')}; font-weight: 600; text-decoration: none; cursor: pointer; transition: background-color 150ms ease, border-color 150ms ease; }
.ghcn-share__btn[hidden] { display: none; }
.ghcn-share__btn:hover { background: var(--muted); border-color: color-mix(in srgb, var(--foreground) 22%, var(--border)); }
.ghcn-share:where([data-size="sm"]) .ghcn-share__btn { min-height: 30px; padding: 4px 9px; font-size: 12px; }
.ghcn-share:where([data-size="lg"]) .ghcn-share__btn { min-height: 42px; padding: 8px 15px; font-size: 14px; }
.ghcn-share:where([data-variant="icon"]) .ghcn-share__label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ghcn-share:where([data-variant="icon"]) .ghcn-share__btn { width: 36px; padding: 0; }
.ghcn-share:where([data-variant="icon"][data-size="sm"]) .ghcn-share__btn { width: 30px; }
.ghcn-share:where([data-variant="icon"][data-size="lg"]) .ghcn-share__btn { width: 42px; }
.ghcn-share:where([data-variant="ghost"]) .ghcn-share__btn { border-color: transparent; background: transparent; color: var(--muted-foreground); }
.ghcn-share:where([data-variant="ghost"]) .ghcn-share__btn:hover { background: var(--muted); color: var(--foreground); }
.ghcn-share__status { font-size: ${token('text-meta')}; color: var(--muted-foreground); }
.ghcn-share__status:empty { display: none; }
${focusWithin('.ghcn-share')}
@media (prefers-reduced-motion: reduce) { .ghcn-share__btn { transition: none; } }
`,
  slots: { class: ['ghcn-share'], titleClass: ['ghcn-share__title'], listClass: ['ghcn-share__list'], buttonClass: ['ghcn-share__btn'] },
  parameters: {
    variant: { description: 'Button presentation (default pills, icon-only squares, or ghost buttons).', options: ['default', 'icon', 'ghost'], default: 'default' },
    size: { description: 'Button scale.', options: sizes, default: 'default' },
    heading: { description: 'Optional label displayed before the share buttons.' },
    shareUrl: { description: 'Optional URL override; defaults to current post absolute URL.' },
    shareTitle: { description: 'Optional title override; defaults to current post title.' }
  },
  scripts: [{ name: 'share-buttons.js', type: 'js', target: 'assets/js/components/share-buttons.js', content: shareButtonsScript }],
  notes: 'Uses native Ghost url and encode helpers with progressive Clipboard and Web Share API support.'
});

// 5. breadcrumbs
const breadcrumbs = extraComponent({
  name: 'breadcrumbs',
  type: 'components:content',
  description: 'Accessible breadcrumb navigation with Schema.org BreadcrumbList microdata for posts, tags, and authors.',
  markup: `<nav class="ghcn-breadcrumbs" data-variant="${choice('variant', ['default', 'chevron', 'pill'])}" aria-label="Breadcrumb">
  <ol class="ghcn-breadcrumbs__list" itemscope itemtype="https://schema.org/BreadcrumbList">
    <li class="ghcn-breadcrumbs__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a class="ghcn-breadcrumbs__link" href="{{@site.url}}" itemprop="item"><span itemprop="name">{{#if homeLabel}}{{homeLabel}}{{else}}Home{{/if}}</span></a>
      <meta itemprop="position" content="1" />
    </li>
    {{#if primary_tag}}
    <li class="ghcn-breadcrumbs__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a class="ghcn-breadcrumbs__link" href="{{primary_tag.url}}" itemprop="item"><span itemprop="name">{{primary_tag.name}}</span></a>
      <meta itemprop="position" content="2" />
    </li>
    {{/if}}
    <li class="ghcn-breadcrumbs__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <span class="ghcn-breadcrumbs__current" aria-current="page" itemprop="name">{{#if current}}{{current}}{{else}}{{#if title}}{{title}}{{else}}{{#if name}}{{name}}{{else}}{{@site.title}}{{/if}}{{/if}}{{/if}}</span>
      <meta itemprop="position" content="{{#if primary_tag}}3{{else}}2{{/if}}" />
    </li>
  </ol>
</nav>`,
  css: `.ghcn-breadcrumbs { ${section} margin-block: 16px; }
.ghcn-breadcrumbs *, .ghcn-breadcrumbs *::before, .ghcn-breadcrumbs *::after { box-sizing: border-box; }
.ghcn-breadcrumbs__list { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0; padding: 0; list-style: none; font-size: ${token('text-meta')}; color: var(--muted-foreground); }
.ghcn-breadcrumbs:where([data-variant="pill"]) .ghcn-breadcrumbs__list { display: inline-flex; padding: 5px 12px; border: 1px solid var(--border); border-radius: 9999px; background: var(--card); }
.ghcn-breadcrumbs__item { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
.ghcn-breadcrumbs__item + .ghcn-breadcrumbs__item::before { content: "/"; color: color-mix(in srgb, var(--muted-foreground) 55%, transparent); }
.ghcn-breadcrumbs:where([data-variant="chevron"]) .ghcn-breadcrumbs__item + .ghcn-breadcrumbs__item::before { content: "›"; font-size: 1.15em; line-height: 1; }
.ghcn-breadcrumbs__link { color: inherit; text-decoration: none; }
.ghcn-breadcrumbs__link:hover { color: var(--foreground); text-decoration: underline; text-underline-offset: 3px; }
.ghcn-breadcrumbs__current { color: var(--foreground); font-weight: 600; }
${focusWithin('.ghcn-breadcrumbs')}
`,
  slots: { class: ['ghcn-breadcrumbs'], listClass: ['ghcn-breadcrumbs__list'], linkClass: ['ghcn-breadcrumbs__link'], currentClass: ['ghcn-breadcrumbs__current'] },
  parameters: {
    variant: { description: 'Separator and surface style.', options: ['default', 'chevron', 'pill'], default: 'default' },
    homeLabel: { description: 'Label for the home breadcrumb.', default: 'Home' },
    current: { description: 'Optional override for the current page title.' }
  },
  notes: 'Uses native Ghost @site.url, primary_tag, title, and name helpers with Schema.org microdata.'
});

// 6. visibility-badge
const lockSvg = '<svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>';
const starSvg = '<svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2.2 1.8 3.6 4 .6-2.9 2.8.7 4L8 11.3l-3.6 1.9.7-4-2.9-2.8 4-.6L8 2.2Z"/></svg>';
const globeSvg = '<svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="5.5"/><path d="M2.5 8h11M8 2.5a8.5 8.5 0 0 1 0 11 8.5 8.5 0 0 1 0-11Z"/></svg>';

const visibilityBadge = extraComponent({
  name: 'visibility-badge',
  type: 'components:members',
  description: 'Ghost-native access indicator pill for members-only, paid-only, tier-restricted, or public posts.',
  markup: `{{#match visibility "members"}}
<span class="ghcn-visibility-badge" data-visibility="members" data-variant="${choice('variant', ['default', 'outline', 'subtle'])}" data-size="${choice('size', sizes)}">${lockSvg}<span>{{#if membersLabel}}{{membersLabel}}{{else}}Members only{{/if}}</span></span>
{{else}}{{#match visibility "paid"}}
<span class="ghcn-visibility-badge" data-visibility="paid" data-variant="${choice('variant', ['default', 'outline', 'subtle'])}" data-size="${choice('size', sizes)}">${starSvg}<span>{{#if paidLabel}}{{paidLabel}}{{else}}Paid only{{/if}}</span></span>
{{else}}{{#match visibility "tiers"}}
<span class="ghcn-visibility-badge" data-visibility="tiers" data-variant="${choice('variant', ['default', 'outline', 'subtle'])}" data-size="${choice('size', sizes)}">${starSvg}<span>{{#if tiersLabel}}{{tiersLabel}}{{else}}Specific tiers{{/if}}</span></span>
{{else}}{{#if showPublic}}
<span class="ghcn-visibility-badge" data-visibility="public" data-variant="${choice('variant', ['default', 'outline', 'subtle'])}" data-size="${choice('size', sizes)}">${globeSvg}<span>{{#if publicLabel}}{{publicLabel}}{{else}}Public{{/if}}</span></span>
{{/if}}{{/match}}{{/match}}{{/match}}`,
  css: `.ghcn-visibility-badge { box-sizing: border-box; display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border: 1px solid var(--border); border-radius: 9999px; background: var(--secondary); color: var(--secondary-foreground); font-family: inherit; font-size: 12px; font-weight: 600; line-height: 1.25; white-space: nowrap; }
.ghcn-visibility-badge:where([data-visibility="paid"]),
.ghcn-visibility-badge:where([data-visibility="tiers"]) { background: var(--primary); color: var(--primary-foreground); border-color: transparent; }
.ghcn-visibility-badge:where([data-size="sm"]) { font-size: 11px; padding: 2px 7px; gap: 4px; }
.ghcn-visibility-badge:where([data-size="lg"]) { font-size: 14px; padding: 4px 11px; gap: 6px; }
.ghcn-visibility-badge:where([data-variant="outline"]) { background: transparent; color: var(--foreground); border-color: var(--border); }
.ghcn-visibility-badge:where([data-variant="outline"][data-visibility="paid"]),
.ghcn-visibility-badge:where([data-variant="outline"][data-visibility="tiers"]) { border-color: var(--primary); color: var(--primary); }
.ghcn-visibility-badge:where([data-variant="subtle"]) { background: transparent; border-color: transparent; padding-inline: 2px; color: var(--muted-foreground); }
.ghcn-visibility-badge:where([data-variant="subtle"][data-visibility="paid"]),
.ghcn-visibility-badge:where([data-variant="subtle"][data-visibility="tiers"]) { color: var(--foreground); }
`,
  slots: { class: ['ghcn-visibility-badge'] },
  parameters: {
    variant: { description: 'Visual treatment.', options: ['default', 'outline', 'subtle'], default: 'default' },
    size: { description: 'Badge scale.', options: sizes, default: 'default' },
    showPublic: { description: 'Boolean. Render a Public badge for public posts (hidden by default).' },
    membersLabel: { description: 'Custom label for members-only posts.', default: 'Members only' },
    paidLabel: { description: 'Custom label for paid-only posts.', default: 'Paid only' },
    tiersLabel: { description: 'Custom label for specific-tier posts.', default: 'Specific tiers' },
    publicLabel: { description: 'Custom label for public posts when showPublic=true.', default: 'Public' }
  },
  notes: 'Uses native Ghost post {{visibility}} property (public, members, paid, tiers).'
});

module.exports = [themeToggle, announcementBar, readingProgress, shareButtons, breadcrumbs, visibilityBadge];
