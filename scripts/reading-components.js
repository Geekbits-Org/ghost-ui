const { applyStyleSlots } = require('./component-styling');
const { token, section, sectionTitle, surface, cardTitle, grid, focus } = require('./component-defaults');
const component = (name, description, partial, css, slots, extra = []) => applyStyleSlots({
  name, type: 'components:content', description, dependencies: [], ghost_version: '>=5.0.0',
  files: [{ name: `${name}.hbs`, type: 'partial', target: `partials/components/${name}.hbs`, content: partial },
    { name: `${name}.css`, type: 'style', target: `assets/css/components/${name}.css`, content: css }, ...extra],
  gscan: { rules_satisfied: ['GS010-PJ-VALID'], notes: 'Uses native Ghost post data and optional progressive enhancement.' }
}, slots);

const relatedBody = `{{#if posts}}
<section class="ghcn-related" aria-label="Related posts">
  <h2 class="ghcn-related__title">{{#if ghostcnStyles.heading}}{{ghostcnStyles.heading}}{{else}}Keep reading{{/if}}</h2>
  <div class="ghcn-related__grid">
    {{#foreach posts}}
    <article class="ghcn-related__card">
      {{#if feature_image}}<a class="ghcn-related__image-link" href="{{url}}" tabindex="-1" aria-hidden="true"><img class="ghcn-related__image" src="{{img_url feature_image size="m"}}" alt="" loading="lazy" /></a>{{/if}}
      <div class="ghcn-related__content"><h3 class="ghcn-related__card-title"><a href="{{url}}">{{title}}</a></h3><p class="ghcn-related__description">{{excerpt words="20"}}</p></div>
    </article>
    {{/foreach}}
  </div>
</section>
{{/if}}`;
const related = component('related-posts', 'Related reading from the same primary tag, excluding the current post; recent posts when untagged.', `{{!-- Use inside {{#post}}. heading overrides the section title. Empty results render nothing. --}}
{{#if primary_tag}}
{{#get "posts" filter="id:-{{id}}+tag:{{primary_tag.slug}}" limit="3" include="tags,authors"}}${relatedBody}{{/get}}
{{else}}
{{#get "posts" filter="id:-{{id}}" limit="3" include="tags,authors"}}${relatedBody}{{/get}}
{{/if}}`, `
.ghcn-related { ${section} }
.ghcn-related__title { ${sectionTitle} margin: 0 0 ${token('section-gap')}; }
.ghcn-related__grid { ${grid()} }
.ghcn-related__card { ${surface} overflow: hidden; }
.ghcn-related__image-link { display: block; aspect-ratio: 16/9; overflow: hidden; }
.ghcn-related__image { display: block; width: 100%; height: 100%; object-fit: cover; }
.ghcn-related__content { padding: ${token('panel-padding')}; }
.ghcn-related__card-title { ${cardTitle} margin: 0 0 8px; }
.ghcn-related__card-title a { color: inherit; text-decoration: none; }
.ghcn-related__card-title a:hover { text-decoration: underline; }
.ghcn-related__description { color: var(--muted-foreground); font-size: ${token('text-small')}; margin: 0; }
.ghcn-related a:focus-visible { ${focus} }
`, { class: ['ghcn-related'], titleClass: ['ghcn-related__title'], gridClass: ['ghcn-related__grid'], cardClass: ['ghcn-related__card'], cardTitleClass: ['ghcn-related__card-title'], imageClass: ['ghcn-related__image'], contentClass: ['ghcn-related__content'], descriptionClass: ['ghcn-related__description'] });

const navigation = component('post-navigation', 'Accessible chronological previous/next post links, with no dead links at either end.', `{{!-- Use inside {{#post}}. Native helpers hide missing neighbors. --}}
<nav class="ghcn-post-navigation" aria-label="Post navigation">{{~#prev_post~}}<a class="ghcn-post-navigation__link" href="{{url}}" rel="prev"><span class="ghcn-post-navigation__label">Previous post</span><span class="ghcn-post-navigation__title">{{title}}</span></a>{{~/prev_post~}}{{~#next_post~}}<a class="ghcn-post-navigation__link ghcn-post-navigation__link--next" href="{{url}}" rel="next"><span class="ghcn-post-navigation__label">Next post</span><span class="ghcn-post-navigation__title">{{title}}</span></a>{{~/next_post~}}</nav>`, `
.ghcn-post-navigation { ${section} display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: ${token('grid-gap')}; }
.ghcn-post-navigation:empty { display: none; }
.ghcn-post-navigation__link { ${surface} display: flex; flex-direction: column; gap: 4px; padding: ${token('panel-padding')}; text-decoration: none; }
.ghcn-post-navigation__link--next { grid-column: 2; text-align: right; }
.ghcn-post-navigation__label { font-size: ${token('text-meta')}; color: var(--muted-foreground); }
.ghcn-post-navigation__title { font-weight: 600; overflow-wrap: anywhere; }
.ghcn-post-navigation__link:hover .ghcn-post-navigation__title { text-decoration: underline; }
.ghcn-post-navigation__link:focus-visible { ${focus} }
@media(max-width:620px) { .ghcn-post-navigation { grid-template-columns: 1fr; } .ghcn-post-navigation__link--next { grid-column: 1; } }
`, { class: ['ghcn-post-navigation'], cardClass: ['ghcn-post-navigation__link'], titleClass: ['ghcn-post-navigation__title'], labelClass: ['ghcn-post-navigation__label'] });

const tags = component('tag-list', 'Linked public tags for the current post, omitting internal tags and empty tag lists.', `{{!-- Use inside {{#post}}; Ghost foreach filters internal tags. --}}
{{#foreach tags visibility="public"}}{{#if @first}}<nav class="ghcn-tag-list" aria-label="Post tags"><ul class="ghcn-tag-list__items">{{/if}}<li><a class="ghcn-tag-list__link" href="{{url}}">{{name}}</a></li>{{#if @last}}</ul></nav>{{/if}}{{/foreach}}`, `
.ghcn-tag-list { ${section} }
.ghcn-tag-list__items { display: flex; flex-wrap: wrap; gap: .5rem; list-style: none; padding: 0; margin: 0; }
.ghcn-tag-list__link { display: block; padding: 5px 10px; background: var(--secondary); color: var(--secondary-foreground); border: 1px solid var(--border); border-radius: 999px; font-size: ${token('text-meta')}; font-weight: 600; text-decoration: none; }
.ghcn-tag-list__link:hover { background: var(--secondary); text-decoration: underline; }
.ghcn-tag-list__link:focus-visible { ${focus} }
`, { class: ['ghcn-tag-list'], listClass: ['ghcn-tag-list__items'], linkClass: ['ghcn-tag-list__link'] });

const tocScript = `/* ghostcn table of contents: no dependencies, no HTML injection, repeat-safe. */
(() => {
  function setCurrent(group, index) {
    if (index === group.current) return;
    group.views.forEach(links => {
      links[group.current]?.removeAttribute('aria-current');
      links[index]?.setAttribute('aria-current', 'location');
    });
    group.current = index;
  }

  function currentFromScroll(group) {
    const { headings } = group;
    const offset = Math.max(0, parseFloat(getComputedStyle(headings[0]).scrollMarginBlockStart) || 0);
    const limit = Math.min(offset + 4, window.innerHeight / 2);
    let index = 0;
    for (let i = 0; i < headings.length; i++) {
      if (headings[i].getBoundingClientRect().top > limit) break;
      index = i;
    }
    // The final heading may never reach the activation line on a short section.
    const page = document.scrollingElement;
    if (page && page.scrollHeight > page.clientHeight + 2 &&
      page.scrollTop + page.clientHeight >= page.scrollHeight - 2 &&
      headings.at(-1).getBoundingClientRect().top < window.innerHeight) {
      index = headings.length - 1;
    }
    setCurrent(group, index);
  }

  const init = () => {
    const groups = new Map();
    const used = new Set([...document.querySelectorAll('[id]')].map(el => el.id));
    document.querySelectorAll('[data-ghcn-toc]').forEach(nav => {
      if (nav.dataset.ghcnTocReady) return;
      let content;
      try { content = document.querySelector(nav.dataset.tocContent); } catch { return; }
      if (!content) return;
      const list = nav.querySelector('[data-toc-list]');
      if (!list) return;
      let group = groups.get(content);
      if (!group) {
        // Editor card UI titles are not article sections.
        const headings = [...content.querySelectorAll('h2, h3')]
          .filter(h => h.textContent.trim() && !h.closest('.kg-card, [hidden], [data-ghcn-toc]'));
        if (headings.length < 2) return;
        headings.forEach((heading, index) => {
          if (!heading.id) {
            const base = 'ghcn-' + (heading.textContent.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section-' + (index + 1));
            let id = base, suffix = 2;
            while (used.has(id)) id = base + '-' + suffix++;
            heading.id = id; used.add(id);
          }
          heading.setAttribute('data-ghcn-toc-heading', '');
        });
        group = { headings, views: [], current: -1, jumpY: null };
        groups.set(content, group);
      }
      const links = group.headings.map((heading, index) => {
        const item = document.createElement('li');
        item.className = 'ghcn-toc__item' + (heading.tagName === 'H3' ? ' ghcn-toc__item--nested' : '');
        const link = document.createElement('a');
        link.className = 'ghcn-toc__link';
        if (nav.dataset.linkClass) nav.dataset.linkClass.split(/\\s+/).filter(Boolean).forEach(value => link.classList.add(value));
        link.href = '#' + encodeURIComponent(heading.id);
        link.textContent = heading.textContent.trim();
        link.addEventListener('click', event => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          heading.scrollIntoView({ behavior: 'instant', block: 'start' });
          if (!heading.hasAttribute('tabindex')) {
            heading.setAttribute('tabindex', '-1');
            heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
          }
          heading.focus({ preventScroll: true });
          try { history.replaceState(null, '', '#' + encodeURIComponent(heading.id)); } catch {}
          group.jumpY = window.scrollY;
          setCurrent(group, index);
        });
        item.append(link); list.append(item);
        return link;
      });
      group.views.push(links);
      nav.dataset.ghcnTocReady = 'true'; nav.hidden = false;
    });
    if (!groups.size) return;

    function syncHash() {
      let id = '';
      try { id = decodeURIComponent(location.hash.slice(1)); } catch {}
      groups.forEach(group => {
        const index = group.headings.findIndex(heading => heading.id === id);
        group.jumpY = index < 0 ? null : window.scrollY;
        if (index < 0) currentFromScroll(group);
        else setCurrent(group, index);
      });
    }

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        groups.forEach(group => {
          if (group.jumpY !== null && Math.abs(group.jumpY - window.scrollY) < 2) return;
          group.jumpY = null;
          currentFromScroll(group);
        });
      });
    };
    syncHash();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule, { once: true });
    window.addEventListener('hashchange', syncHash);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();`;
const toc = component('table-of-contents', 'Progressively enhanced h2/h3 navigation with collision-safe anchors and keyboard focus.', `{{!-- add manages the deferred script in default.hbs. Set contentSelector for existing themes. --}}
<nav class="ghcn-toc" data-ghcn-toc data-toc-content="{{#if contentSelector}}{{contentSelector}}{{else}}.ghcn-article-content{{/if}}" data-link-class="{{linkClass}}" aria-label="{{#if heading}}{{heading}}{{else}}On this page{{/if}}" hidden>
  <h2 class="ghcn-toc__title"><svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 5h11M5 10h8M5 15h5M2 5h.01M2 10h.01M2 15h.01"/></svg>{{#if heading}}{{heading}}{{else}}On this page{{/if}}</h2>
  <ol class="ghcn-toc__list" data-toc-list></ol>
</nav>`, `
.ghcn-toc { ${section} }
.ghcn-toc[hidden] { display: none; }
.ghcn-toc__title { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; color: var(--muted-foreground); font: inherit; font-size: ${token('text-small')}; font-weight: 600; }
.ghcn-toc__title svg { flex: none; }
.ghcn-toc__list { list-style: none; padding: 0; margin: 0; border-inline-start: 1px solid var(--border); }
.ghcn-toc__item { margin: 0; padding: 0; }
.ghcn-toc__link { position: relative; display: block; padding: 7px 12px; color: var(--muted-foreground); font-size: ${token('text-small')}; line-height: 1.45; text-decoration: none; overflow-wrap: anywhere; }
:where(.ghcn-toc__item--nested) > .ghcn-toc__link { padding-inline-start: 26px; }
.ghcn-toc__link:hover, .ghcn-toc__link:where([aria-current="location"]) { color: var(--foreground); }
.ghcn-toc__link:where([aria-current="location"]) { font-weight: 600; }
.ghcn-toc__link:where([aria-current="location"])::before { content: ""; position: absolute; inset-block: 4px; inset-inline-start: -1px; width: 2px; border-radius: 2px; background: currentColor; }
.ghcn-toc__link:focus-visible { ${focus} }
:where([data-ghcn-toc-heading]) { scroll-margin-block-start: var(--ghcn-toc-offset, 80px); }
@media (min-width: 1024px) {
  .ghcn-toc:where(.ghcn-toc--sticky) { position: sticky; inset-block-start: var(--ghcn-toc-top, 80px); align-self: start; margin-block-start: 0; }
  :where(.ghcn-toc--sticky) .ghcn-toc__list { max-block-size: max(120px, 100dvh - var(--ghcn-toc-top, 80px) - 56px); overflow-y: auto; }
  :where(.ghcn-toc--sticky) .ghcn-toc__link:focus-visible { outline-offset: -2px; }
}
`, { class: ['ghcn-toc'], titleClass: ['ghcn-toc__title'], listClass: ['ghcn-toc__list'] }, [{ name: 'table-of-contents.js', type: 'js', target: 'assets/js/components/table-of-contents.js', content: tocScript }]);
// This dynamic slot is applied by the script, not by the template's static class injector.
toc.styleSlots.linkClass = ['.ghcn-toc__link'];

module.exports = [related, navigation, toc, tags];
