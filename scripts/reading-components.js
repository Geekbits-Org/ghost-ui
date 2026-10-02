const { applyStyleSlots } = require('./component-styling');
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
.ghcn-related { margin-block: 2rem; color: var(--foreground); }
.ghcn-related__title { margin: 0 0 1rem; font-size: 1.5rem; line-height: 1.2; }
.ghcn-related__grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 1rem; }
.ghcn-related__card { min-width: 0; overflow: hidden; background: var(--card); color: var(--card-foreground); border: 1px solid var(--border); border-radius: var(--radius); }
.ghcn-related__image-link { display: block; aspect-ratio: 16/9; overflow: hidden; }
.ghcn-related__image { display: block; width: 100%; height: 100%; object-fit: cover; }
.ghcn-related__content { padding: 1.25rem; }
.ghcn-related__card-title { font-size: 1.125rem; line-height: 1.3; margin: 0 0 .75rem; }
.ghcn-related__card-title a { color: inherit; text-decoration: none; }
.ghcn-related__card-title a:hover { text-decoration: underline; }
.ghcn-related__description { color: var(--muted-foreground); font-size: .875rem; margin: 0; }
.ghcn-related a:focus-visible { outline: 2px solid var(--ring); outline-offset: 3px; }
@media(max-width:760px) { .ghcn-related__grid { grid-template-columns: 1fr; } }
`, { class: ['ghcn-related'], titleClass: ['ghcn-related__title'], gridClass: ['ghcn-related__grid'], cardClass: ['ghcn-related__card'], cardTitleClass: ['ghcn-related__card-title'], imageClass: ['ghcn-related__image'], contentClass: ['ghcn-related__content'], descriptionClass: ['ghcn-related__description'] });

const navigation = component('post-navigation', 'Accessible chronological previous/next post links, with no dead links at either end.', `{{!-- Use inside {{#post}}. Native helpers hide missing neighbors. --}}
<nav class="ghcn-post-navigation" aria-label="Post navigation">{{~#prev_post~}}<a class="ghcn-post-navigation__link" href="{{url}}" rel="prev"><span class="ghcn-post-navigation__label">Previous post</span><span class="ghcn-post-navigation__title">{{title}}</span></a>{{~/prev_post~}}{{~#next_post~}}<a class="ghcn-post-navigation__link ghcn-post-navigation__link--next" href="{{url}}" rel="next"><span class="ghcn-post-navigation__label">Next post</span><span class="ghcn-post-navigation__title">{{title}}</span></a>{{~/next_post~}}</nav>`, `
.ghcn-post-navigation { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 1rem; margin-block: 2rem; }
.ghcn-post-navigation:empty { display: none; }
.ghcn-post-navigation__link { min-width: 0; display: flex; flex-direction: column; gap: .5rem; padding: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--card); color: var(--card-foreground); text-decoration: none; }
.ghcn-post-navigation__link--next { grid-column: 2; text-align: right; }
.ghcn-post-navigation__label { font-size: .75rem; color: var(--muted-foreground); }
.ghcn-post-navigation__title { font-weight: 600; overflow-wrap: anywhere; }
.ghcn-post-navigation__link:hover .ghcn-post-navigation__title { text-decoration: underline; }
.ghcn-post-navigation__link:focus-visible { outline: 2px solid var(--ring); outline-offset: 3px; }
@media(max-width:620px) { .ghcn-post-navigation { grid-template-columns: 1fr; } .ghcn-post-navigation__link--next { grid-column: 1; } }
`, { class: ['ghcn-post-navigation'], cardClass: ['ghcn-post-navigation__link'], titleClass: ['ghcn-post-navigation__title'], labelClass: ['ghcn-post-navigation__label'] });

const tags = component('tag-list', 'Linked public tags for the current post, omitting internal tags and empty tag lists.', `{{!-- Use inside {{#post}}; Ghost foreach filters internal tags. --}}
{{#foreach tags visibility="public"}}{{#if @first}}<nav class="ghcn-tag-list" aria-label="Post tags"><ul class="ghcn-tag-list__items">{{/if}}<li><a class="ghcn-tag-list__link" href="{{url}}">{{name}}</a></li>{{#if @last}}</ul></nav>{{/if}}{{/foreach}}`, `
.ghcn-tag-list { margin-block: 1.5rem; }
.ghcn-tag-list__items { display: flex; flex-wrap: wrap; gap: .5rem; list-style: none; padding: 0; margin: 0; }
.ghcn-tag-list__link { display: block; padding: .375rem .875rem; background: var(--muted); color: var(--foreground); border: 1px solid var(--border); border-radius: 999px; font-size: .875rem; text-decoration: none; }
.ghcn-tag-list__link:hover { background: var(--secondary); text-decoration: underline; }
.ghcn-tag-list__link:focus-visible { outline: 2px solid var(--ring); outline-offset: 3px; }
`, { class: ['ghcn-tag-list'], listClass: ['ghcn-tag-list__items'], linkClass: ['ghcn-tag-list__link'] });

const tocScript = `/* ghostcn table of contents: no dependencies, no HTML injection, repeat-safe. */
(() => {
  const init = () => {
    document.querySelectorAll('[data-ghcn-toc]').forEach(nav => {
      if (nav.dataset.ghcnTocReady) return;
      let content;
      try { content = document.querySelector(nav.dataset.tocContent); } catch { return; }
      if (!content) return;
      // Editor card UI titles are not article sections (e.g. signup or product headings).
      const headings = [...content.querySelectorAll('h2, h3')].filter(h => h.textContent.trim() && !h.closest('.kg-card'));
      if (headings.length < 2) return;
      const list = nav.querySelector('[data-toc-list]');
      if (!list) return;
      const used = new Set([...document.querySelectorAll('[id]')].map(el => el.id));
      headings.forEach((heading, index) => {
        if (!heading.id) {
          const base = 'ghcn-' + (heading.textContent.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section-' + (index + 1));
          let id = base, suffix = 2;
          while (used.has(id)) id = base + '-' + suffix++;
          heading.id = id; used.add(id);
        }
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
          heading.scrollIntoView({ behavior: 'auto', block: 'start' });
          if (!heading.hasAttribute('tabindex')) {
            heading.setAttribute('tabindex', '-1');
            heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
          }
          heading.focus({ preventScroll: true });
          try { history.replaceState(null, '', '#' + encodeURIComponent(heading.id)); } catch {}
        });
        item.append(link); list.append(item);
      });
      nav.dataset.ghcnTocReady = 'true'; nav.hidden = false;
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();`;
const toc = component('table-of-contents', 'Progressively enhanced h2/h3 navigation with collision-safe anchors and keyboard focus.', `{{!-- add manages the deferred script in default.hbs. Set contentSelector for existing themes. --}}
<nav class="ghcn-toc" data-ghcn-toc data-toc-content="{{#if contentSelector}}{{contentSelector}}{{else}}.ghcn-article-content{{/if}}" data-link-class="{{linkClass}}" aria-label="On this page" hidden>
  <h2 class="ghcn-toc__title">{{#if heading}}{{heading}}{{else}}On this page{{/if}}</h2>
  <ol class="ghcn-toc__list" data-toc-list></ol>
</nav>`, `
.ghcn-toc { padding: 1.25rem; margin-block: 1.5rem; background: var(--card); color: var(--card-foreground); border: 1px solid var(--border); border-radius: var(--radius); }
.ghcn-toc[hidden] { display: none; }
.ghcn-toc__title { margin: 0 0 .75rem; font-size: 1rem; font-weight: 600; }
.ghcn-toc__list { padding-left: 1.25rem; margin: 0; }
.ghcn-toc__item { padding-block: .25rem; }
.ghcn-toc__item--nested { margin-left: 1rem; }
.ghcn-toc__link { color: inherit; text-decoration: none; overflow-wrap: anywhere; }
.ghcn-toc__link:hover { text-decoration: underline; }
.ghcn-toc__link:focus-visible { outline: 2px solid var(--ring); outline-offset: 3px; }
`, { class: ['ghcn-toc'], titleClass: ['ghcn-toc__title'], listClass: ['ghcn-toc__list'] }, [{ name: 'table-of-contents.js', type: 'js', target: 'assets/js/components/table-of-contents.js', content: tocScript }]);
// This dynamic slot is applied by the script, not by the template's static class injector.
toc.styleSlots.linkClass = ['.ghcn-toc__link'];

module.exports = [related, navigation, toc, tags];
