const { applyStyleSlots } = require('./component-styling');
function block(name, description, dependencies, markup, css, slots, forwarded = {}, parameters = {}) {
  const result = applyStyleSlots({ name, type: 'components:content', description, dependencies, ghost_version: '>=5.0.0', parameters,
    files: [
      { name: `${name}.hbs`, type: 'partial', target: `partials/components/${name}.hbs`, content: markup },
      { name: `${name}.css`, type: 'style', target: `assets/css/components/${name}.css`, content: css }
    ] }, slots);
  Object.assign(result.styleSlots, forwarded);
  return result;
}
const gridCss = selector => `${selector} { font-size: 16px; color: var(--foreground); margin-block: 2em; }
${selector}__title { font-size: 1.5em; line-height: 1.25; margin: 0 0 1em; }
${selector}__grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 1.5em; }
${selector}__grid > * { min-width: 0; }
${selector}__empty { color: var(--muted-foreground); }
@media(max-width:900px) { ${selector}__grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
@media(max-width:620px) { ${selector}__grid { grid-template-columns: 1fr; } }`;
const gridSlots = root => ({ class: [root], titleClass: [`${root}__title`], gridClass: [`${root}__grid`] });
const headingParam = { heading: { description: 'Optional section heading.' }, emptyText: { description: 'Optional message when no content is available; otherwise render nothing.' } };

const postGrid = block('post-grid', 'A responsive grid using post-card; pass posts from a loop, archive or get query.', ['post-card'], `{{#if posts}}
<section class="ghcn-post-grid" aria-label="Posts">
  {{#if heading}}<h2 class="ghcn-post-grid__title">{{heading}}</h2>{{/if}}
  <div class="ghcn-post-grid__grid">{{#foreach posts}}
    {{> "components/post-card" class=ghostcnStyles.cardClass titleClass=ghostcnStyles.cardTitleClass imageClass=ghostcnStyles.imageClass descriptionClass=ghostcnStyles.descriptionClass}}
  {{/foreach}}</div>
</section>
{{else}}{{#if emptyText}}<section class="ghcn-post-grid"><p class="ghcn-post-grid__empty">{{emptyText}}</p></section>{{/if}}{{/if}}`, gridCss('.ghcn-post-grid'), gridSlots('ghcn-post-grid'), {
  cardClass: ['.gh-post-card'], cardTitleClass: ['.gh-post-card-title'], imageClass: ['.gh-post-card-img'], descriptionClass: ['.gh-post-card-excerpt']
}, headingParam);

const authorList = block('author-list', 'Publication authors rendered with reusable author cards.', ['author-card'], `{{#get "authors" limit="100" include="count.posts"}}
{{#if authors}}<section class="ghcn-author-list" aria-label="Authors">
  {{#if ghostcnStyles.heading}}<h2 class="ghcn-author-list__title">{{ghostcnStyles.heading}}</h2>{{/if}}
  <div class="ghcn-author-list__grid">{{#foreach authors}}
    {{> "components/author-card" class=ghostcnStyles.cardClass titleClass=ghostcnStyles.cardTitleClass avatarClass=ghostcnStyles.avatarClass descriptionClass=ghostcnStyles.descriptionClass}}
  {{/foreach}}</div>
</section>{{else}}{{#if ghostcnStyles.emptyText}}<section class="ghcn-author-list"><p class="ghcn-author-list__empty">{{ghostcnStyles.emptyText}}</p></section>{{/if}}{{/if}}
{{/get}}`, gridCss('.ghcn-author-list'), gridSlots('ghcn-author-list'), {
  cardClass: ['.gh-author-card'], cardTitleClass: ['.gh-author-name'], avatarClass: ['.gh-author-avatar', '.gh-author-avatar-fallback'], descriptionClass: ['.gh-author-bio']
}, headingParam);

const tagGrid = block('tag-grid', 'Public tag archive links composed from card and button primitives.', ['card', 'button'], `{{#get "tags" filter="visibility:public" limit="100" include="count.posts"}}
{{#if tags}}<section class="ghcn-tag-grid" aria-label="Topics">
  {{#if ghostcnStyles.heading}}<h2 class="ghcn-tag-grid__title">{{ghostcnStyles.heading}}</h2>{{/if}}
  <div class="ghcn-tag-grid__grid">{{#foreach tags visibility="public"}}
    {{#> "components/card" heading=name description=description class=ghostcnStyles.cardClass titleClass=ghostcnStyles.cardTitleClass descriptionClass=ghostcnStyles.descriptionClass variant=ghostcnStyles.cardVariant}}
      {{> "components/button" href=url text="Explore topic" variant="outline" size="sm" class=ghostcnStyles.buttonClass}}
    {{/components/card}}
  {{/foreach}}</div>
</section>{{else}}{{#if ghostcnStyles.emptyText}}<section class="ghcn-tag-grid"><p class="ghcn-tag-grid__empty">{{ghostcnStyles.emptyText}}</p></section>{{/if}}{{/if}}
{{/get}}`, gridCss('.ghcn-tag-grid'), gridSlots('ghcn-tag-grid'), {
  cardClass: ['.ghcn-ui-card'], cardTitleClass: ['.ghcn-ui-card__title'], descriptionClass: ['.ghcn-ui-card__description'], buttonClass: ['.ghcn-ui-button']
}, { ...headingParam, cardVariant: { description: 'Variant forwarded to each card.', options: ['default', 'secondary', 'outline'], default: 'default' } });

const archive = block('archive-header', 'A reusable tag or author archive heading with an optional badge and image.', ['badge'], `<header class="ghcn-archive-header">
  {{#if eyebrow}}{{> "components/badge" text=eyebrow variant="secondary" class=ghostcnStyles.badgeClass}}{{/if}}
  <h1 class="ghcn-archive-header__title">{{#if heading}}{{heading}}{{else}}{{#if name}}{{name}}{{else}}{{@site.title}}{{/if}}{{/if}}</h1>
  {{#if description}}<p class="ghcn-archive-header__description">{{description}}</p>{{else}}{{#if bio}}<p class="ghcn-archive-header__description">{{bio}}</p>{{/if}}{{/if}}
  {{#if archiveImage}}<img class="ghcn-archive-header__image" src="{{img_url archiveImage size="l"}}" alt="{{imageAlt}}" />{{/if}}
</header>`, `.ghcn-archive-header { font-size: 16px; color: var(--foreground); text-align: center; margin-block: 2em; }
.ghcn-archive-header__title { font-size: clamp(2em,5vw,3em); line-height: 1.1; margin: .5em 0; overflow-wrap: anywhere; }
.ghcn-archive-header__description { max-width: 42em; margin: 1em auto; color: var(--muted-foreground); }
.ghcn-archive-header__image { display: block; width: 100%; max-height: 28em; object-fit: cover; border-radius: var(--radius); margin-top: 2em; }
`, { class: ['ghcn-archive-header'], titleClass: ['ghcn-archive-header__title'], descriptionClass: ['ghcn-archive-header__description'], imageClass: ['ghcn-archive-header__image'] }, { badgeClass: ['.ghcn-ui-badge'] }, {
  heading: { description: 'Heading override; otherwise uses author/tag name or site title.' }, eyebrow: { description: 'Optional badge label.' },
  description: { description: 'Description override; otherwise uses author bio.' }, archiveImage: { description: 'Optional archive feature image URL.' }, imageAlt: { description: 'Alternative text for the image (empty for decorative images).' }
});
module.exports = [postGrid, authorList, tagGrid, archive];
