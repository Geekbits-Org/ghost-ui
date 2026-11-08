const { applyStyleSlots } = require('./component-styling');
const { token, section, wideSection, sectionTitle, displayTitle, grid } = require('./component-defaults');
function block(name, description, dependencies, markup, css, slots, forwarded = {}, parameters = {}) {
  const result = applyStyleSlots({ name, type: 'components:content', description, dependencies, ghost_version: '>=5.0.0', parameters,
    files: [
      { name: `${name}.hbs`, type: 'partial', target: `partials/components/${name}.hbs`, content: markup },
      { name: `${name}.css`, type: 'style', target: `assets/css/components/${name}.css`, content: css }
    ] }, slots);
  Object.assign(result.styleSlots, forwarded);
  return result;
}
const gridCss = (selector, minimum) => `${selector} { ${section} ${wideSection} }
${selector}__title { ${sectionTitle} margin: 0 0 ${token('section-gap')}; }
${selector}__grid { ${grid(minimum)} }
${selector}__grid > * { min-width: 0; }
${selector}__empty { color: var(--muted-foreground); }`;
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
{{/get}}`, `${gridCss('.ghcn-author-list', 280)}
:where(.ghcn-author-list__grid) > .gh-author-card { width: 100%; margin: 0; }
`, gridSlots('ghcn-author-list'), {
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
{{/get}}`, `${gridCss('.ghcn-tag-grid')}
:where(.ghcn-tag-grid__grid) > .ghcn-ui-card { display: flex; flex-direction: column; }
:where(.ghcn-tag-grid__grid) .ghcn-ui-card__content { margin-top: auto; }
`, gridSlots('ghcn-tag-grid'), {
  cardClass: ['.ghcn-ui-card'], cardTitleClass: ['.ghcn-ui-card__title'], descriptionClass: ['.ghcn-ui-card__description'], buttonClass: ['.ghcn-ui-button']
}, { ...headingParam, cardVariant: { description: 'Variant forwarded to each card.', options: ['default', 'secondary', 'outline'], default: 'default' } });

const archive = block('archive-header', 'A reusable tag or author archive heading with an optional badge and image.', ['badge'], `<header class="ghcn-archive-header">
  {{#if eyebrow}}{{> "components/badge" text=eyebrow variant="secondary" class=ghostcnStyles.badgeClass}}{{/if}}
  <h1 class="ghcn-archive-header__title">{{#if heading}}{{heading}}{{else}}{{#if name}}{{name}}{{else}}{{@site.title}}{{/if}}{{/if}}</h1>
  {{#if description}}<p class="ghcn-archive-header__description">{{description}}</p>{{else}}{{#if bio}}<p class="ghcn-archive-header__description">{{bio}}</p>{{/if}}{{/if}}
  {{#if archiveImage}}<img class="ghcn-archive-header__image" src="{{img_url archiveImage size="l"}}" alt="{{imageAlt}}" />{{/if}}
</header>`, `.ghcn-archive-header { ${section} ${wideSection} text-align: center; }
.ghcn-archive-header__title { ${displayTitle} max-width: 24ch; margin: 12px auto; }
.ghcn-archive-header__description { max-width: 60ch; margin: 12px auto; color: var(--muted-foreground); }
.ghcn-archive-header__image { display: block; width: 100%; max-height: 440px; aspect-ratio: 16 / 9; object-fit: cover; border-radius: ${token('panel-radius')}; margin-top: ${token('section-gap')}; }
`, { class: ['ghcn-archive-header'], titleClass: ['ghcn-archive-header__title'], descriptionClass: ['ghcn-archive-header__description'], imageClass: ['ghcn-archive-header__image'] }, { badgeClass: ['.ghcn-ui-badge'] }, {
  heading: { description: 'Heading override; otherwise uses author/tag name or site title.' }, eyebrow: { description: 'Optional badge label.' },
  description: { description: 'Description override; otherwise uses author bio.' }, archiveImage: { description: 'Optional archive feature image URL.' }, imageAlt: { description: 'Alternative text for the image (empty for decorative images).' }
});
module.exports = [postGrid, authorList, tagGrid, archive];
