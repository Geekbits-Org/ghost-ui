const fs = require('fs');
const path = require('path');
const coreComponents = require('./core-components');
const readingComponents = require('./reading-components');
const primitives = require('./ui-primitives');
const composedComponents = require('./composed-components');
const extraComponents = require('./extra-components');
const { applyStyleSlots } = require('./component-styling');
const { token, section, sectionTitle, surface, cardTitle, focusWithin } = require('./component-defaults');

const componentsDir = path.join(__dirname, '..', 'registry', 'components');
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

// 1. newsletter-form
const newsletterForm = {
  name: "newsletter-form",
  type: "components:members",
  description: "A native Ghost members subscription form with state handling.",
  dependencies: [],
  ghost_version: ">=5.0.0",
  parameters: {
    title: { description: "Optional heading override.", default: "Subscribe to our newsletter" },
    description: { description: "Optional introductory text override." }
  },
  files: [
    {
      name: "newsletter-form.hbs",
      type: "partial",
      target: "partials/components/newsletter-form.hbs",
      content: `{{!--
  Component: Newsletter Form
  Usage: {{> "components/newsletter-form" title="Subscribe to our newsletter" description="Get the latest posts delivered right to your inbox."}}
--}}
{{#if @site.members_enabled}}
{{#unless @site.members_invite_only}}
{{#if @site.allow_self_signup}}
{{#unless @member}}
<section class="gh-newsletter-form bg-card text-card-foreground border border-border p-8 rounded-ghostcn text-center max-w-2xl mx-auto my-8 shadow-sm">
    <div class="gh-newsletter-heading">
        <h3 class="gh-newsletter-title text-2xl font-bold tracking-tight mb-2 text-foreground">
            {{#if title}}{{title}}{{else}}Subscribe to our newsletter{{/if}}
        </h3>
        <p class="gh-newsletter-desc text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            {{#if description}}{{description}}{{else}}Get the latest stories, news, and perspectives delivered directly to your inbox.{{/if}}
        </p>
    </div>

    {{!-- Ghost native members form handling --}}
    {{#if @site.portal_signup_checkbox_required}}
    <a class="ghcn-button" href="#/portal/signup" data-portal="signup">Subscribe</a>
    {{else}}
    <form data-members-form="subscribe" class="gh-newsletter-fields flex flex-col sm:flex-row gap-3 max-w-md mx-auto relative">
        <input
            data-members-email
            type="email"
            aria-label="Email address"
            autocomplete="email"
            required
            placeholder="jamie@example.com"
            class="gh-newsletter-input flex-1 px-4 py-2.5 bg-background text-foreground border border-input rounded-ghostcn text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
        <button type="submit" class="gh-newsletter-btn bg-primary text-primary-foreground px-6 py-2.5 rounded-ghostcn text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center shadow-sm">
            <span class="button-text">Subscribe</span>
        </button>

        {{!-- Ghost automatic states (hidden by default, shown via Ghost Portal JS) --}}
        <div class="gh-newsletter-msg-success message-success absolute -bottom-7 left-0 right-0 text-xs text-green-600 dark:text-green-400 font-medium" role="status" data-members-success>
            <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5 6.5 12 13 4"/></svg>
            <span>Check your inbox to confirm your subscription!</span>
        </div>
        <div class="gh-newsletter-msg-error message-error absolute -bottom-7 left-0 right-0 text-xs text-red-600 dark:text-red-400 font-medium" role="alert" data-members-error>
            <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
            <span>Please enter a valid email address.</span>
        </div>
    </form>
    {{/if}}
</section>
{{/unless}}
{{/if}}
{{/unless}}
{{/if}}`
    },
    {
      name: "newsletter-form.css",
      type: "style",
      target: "assets/css/components/newsletter-form.css",
      content: `/* ghostcn: Newsletter Form Styles */
.gh-newsletter-form {
    ${surface}
    margin-block: ${token('section-space')};
    font-family: inherit;
    font-size: ${token('text-body')};
    line-height: 1.5;
    padding: ${token('panel-padding')};
    text-align: center;
    width: min(100% - 32px, 704px);
    margin-inline: auto;
}

.gh-newsletter-form *,
.gh-newsletter-form *::before,
.gh-newsletter-form *::after {
    box-sizing: border-box;
}

.gh-newsletter-heading { margin-bottom: 16px; }

.gh-newsletter-title {
    ${sectionTitle}
    margin: 0 0 8px;
    color: inherit;
}

.gh-newsletter-desc {
    color: var(--muted-foreground, #71717a);
    font-size: ${token('text-small')};
    line-height: 1.5;
    margin: 0 auto;
    max-width: 28rem;
}

.gh-newsletter-fields {
    display: grid;
    gap: ${token('control-gap')};
    max-width: 28rem;
    margin: 0 auto;
    position: relative;
}

@media (min-width: 640px) {
    .gh-newsletter-fields {
        grid-template-columns: minmax(0, 1fr) auto;
    }
}

.gh-newsletter-input {
    min-width: 0;
    min-height: ${token('control-height')};
    padding: ${token('control-padding')};
    background-color: var(--background, #ffffff);
    color: var(--foreground, #09090b);
    border: 1px solid var(--input, #e4e4e7);
    border-radius: ${token('control-radius')};
    font-family: inherit;
    font-size: ${token('text-small')};
    line-height: 1.25;
}

${focusWithin('.gh-newsletter-form')}

.gh-newsletter-btn {
    background-color: var(--primary, var(--ghost-accent-color, #18181b));
    color: var(--primary-foreground, #ffffff);
    min-height: ${token('control-height')};
    padding: ${token('control-padding')};
    border-radius: ${token('control-radius')};
    font-family: inherit;
    font-size: ${token('text-small')};
    font-weight: 600;
    line-height: 1.25;
    border: 1px solid transparent;
    cursor: pointer;
    transition: opacity 0.15s ease;
}

.gh-newsletter-btn:hover {
    opacity: 0.9;
}

.gh-newsletter-msg-success,
.gh-newsletter-msg-error {
    display: none;
    grid-column: 1 / -1;
    font-size: 0.75rem;
    font-weight: 500;
}

.gh-newsletter-fields.success .gh-newsletter-msg-success,
.gh-newsletter-fields.error .gh-newsletter-msg-error {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.gh-newsletter-form .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

.gh-newsletter-msg-success {
    color: var(--success, #15803d);
}

.gh-newsletter-msg-error {
    color: var(--destructive, #dc2626);
}
`
    }
  ],
  gscan: {
    rules_satisfied: ["GS010-PJ-VALID", "GS050-MEMBERS-FORM"],
    notes: "Uses Ghost's native data-members-form attributes. No custom JS required."
  }
};

// 2. pricing-table
const pricingTable = require('./pricing-table');

// 3. author-card
const authorCard = {
  name: "author-card",
  type: "components:ui",
  description: "Author bio box featuring avatar, biography, social links, and post counts.",
  dependencies: [],
  ghost_version: ">=5.0.0",
  files: [
    {
      name: "author-card.hbs",
      type: "partial",
      target: "partials/components/author-card.hbs",
      content: `{{!--
  Component: Author Card
  Usage: In post context {{> "components/author-card"}} or {{#primary_author}}{{> "components/author-card"}}{{/primary_author}}
--}}
<section class="gh-author-card bg-card text-card-foreground border border-border rounded-ghostcn p-6 my-8 max-w-2xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-sm">
    {{#if profile_image}}
    <img src="{{img_url profile_image size="m"}}" alt="{{name}}" class="gh-author-avatar w-20 h-20 rounded-full object-cover border-2 border-border shadow-sm" />
    {{else}}
    <div class="gh-author-avatar-fallback w-20 h-20 rounded-full bg-muted text-foreground flex items-center justify-center font-bold text-2xl border-2 border-border shadow-sm" aria-hidden="true">
        {{name.[0]}}
    </div>
    {{/if}}

    <div class="gh-author-details flex-1 text-center sm:text-left">
        <div class="gh-author-heading">
            <h4 class="gh-author-name text-xl font-bold tracking-tight text-foreground">
                <a href="{{url}}" class="hover:text-primary transition-colors">{{name}}</a>
            </h4>
            {{#if count.posts}}
            <span class="gh-author-post-count text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
                {{plural count.posts empty="0 posts" singular="% post" plural="% posts"}}
            </span>
            {{/if}}
        </div>

        {{#if bio}}
        <p class="gh-author-bio text-muted-foreground text-sm mb-4 leading-relaxed">{{bio}}</p>
        {{/if}}

        <div class="gh-author-meta flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground">
            {{#if location}}
            <span class="gh-author-location flex items-center gap-1"><svg aria-hidden="true" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 14s5-4.4 5-8a5 5 0 1 0-10 0c0 3.6 5 8 5 8Z"/><circle cx="8" cy="6" r="1.75"/></svg>{{location}}</span>
            {{/if}}
            {{#if website}}
            <a href="{{website}}" target="_blank" rel="noopener noreferrer" class="gh-author-link text-primary hover:underline">Website</a>
            {{/if}}
            {{#if twitter}}
            <a href="{{social_url type="twitter"}}" target="_blank" rel="noopener noreferrer" class="gh-author-link text-primary hover:underline">Twitter/X</a>
            {{/if}}
            {{#if facebook}}
            <a href="{{social_url type="facebook"}}" target="_blank" rel="noopener noreferrer" class="gh-author-link text-primary hover:underline">Facebook</a>
            {{/if}}
        </div>
    </div>
</section>`
    },
    {
      name: "author-card.css",
      type: "style",
      target: "assets/css/components/author-card.css",
      content: `/* ghostcn: Author Card Styles */
.gh-author-card {
    ${surface}
    font-family: inherit;
    font-size: ${token('text-body')};
    line-height: 1.5;
    isolation: isolate;
    padding: ${token('panel-padding')};
    margin: ${token('section-space')} auto;
    width: min(100% - 32px, 704px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${token('grid-gap')};
}

.gh-author-card *,
.gh-author-card *::before,
.gh-author-card *::after {
    box-sizing: border-box;
}

@media (min-width: 640px) {
    .gh-author-card {
        flex-direction: row;
        align-items: flex-start;
    }
}

.gh-author-avatar {
    width: 56px;
    height: 56px;
    flex: 0 0 56px;
    border-radius: 9999px;
    object-fit: cover;
    border: 2px solid var(--border, #e4e4e7);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.gh-author-avatar-fallback {
    width: 56px;
    height: 56px;
    flex: 0 0 56px;
    border-radius: 9999px;
    background-color: var(--muted, #f4f4f5);
    color: var(--foreground, #09090b);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    border: 2px solid var(--border, #e4e4e7);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.gh-author-details {
    flex: 1;
    min-width: 0;
    text-align: center;
}

@media (min-width: 640px) {
    .gh-author-details {
        text-align: left;
    }
}

.gh-author-name {
    ${cardTitle}
    margin: 0;
}

.gh-author-name a {
    color: inherit;
    text-decoration: none;
    transition: color 0.15s ease;
}

.gh-author-name:hover {
    color: var(--primary, var(--ghost-accent-color, #18181b));
}

.gh-author-bio {
    color: var(--muted-foreground, #71717a);
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0.5rem 0 1rem;
}

.gh-author-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    font-size: 0.75rem;
    color: var(--muted-foreground, #71717a);
}

.gh-author-meta a {
    color: var(--primary, var(--ghost-accent-color, #18181b));
    text-decoration: none;
}

.gh-author-meta a:hover {
    text-decoration: underline;
}

.gh-author-heading { display: flex; flex-direction: column; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.5rem; }
.gh-author-post-count { border-radius: 9999px; padding: 0.25rem 0.625rem; background: var(--muted); color: var(--muted-foreground); font-size: 0.75rem; font-weight: 500; }
.gh-author-location { display: inline-flex; align-items: center; gap: 0.25rem; }
@media (min-width: 640px) { .gh-author-heading { flex-direction: row; flex-wrap: wrap; align-items: center; } .gh-author-meta { justify-content: flex-start; } }
${focusWithin('.gh-author-card')}
`
    }
  ],
  gscan: {
    rules_satisfied: ["GS010-PJ-VALID"],
    notes: "Uses standard Ghost author helpers (profile_image, img_url, plural, url, bio)."
  }
};

// 4. post-card
const postCard = {
  name: "post-card",
  type: "components:ui",
  description: "Post preview card with feature image, primary tag, excerpt, and reading time.",
  dependencies: [],
  ghost_version: ">=5.0.0",
  files: [
    {
      name: "post-card.hbs",
      type: "partial",
      target: "partials/components/post-card.hbs",
      content: `{{!--
  Component: Post Card
  Usage: Inside {{#foreach posts}} ... {{> "components/post-card"}} ... {{/foreach}}
--}}
<article class="gh-post-card group bg-card text-card-foreground border border-border rounded-ghostcn overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col">
    {{#if feature_image}}
    <a href="{{url}}" class="gh-post-card-image block aspect-video overflow-hidden bg-muted" tabindex="-1" aria-hidden="true">
        <img src="{{img_url feature_image size="m"}}" alt="" class="gh-post-card-img" loading="lazy" />
    </a>
    {{/if}}

    <div class="gh-post-card-content p-5 flex-1 flex flex-col justify-between">
        <div>
            <div class="gh-post-card-meta">
                {{#if primary_tag}}
                <a href="{{primary_tag.url}}" class="gh-post-card-tag text-primary uppercase tracking-wider hover:underline">{{primary_tag.name}}</a>
                <span class="gh-post-card-separator" aria-hidden="true">&bull;</span>
                {{/if}}
                <span class="gh-post-card-reading-time text-muted-foreground">{{reading_time}}</span>
            </div>

            <h3 class="gh-post-card-title text-xl font-bold tracking-tight text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
                <a href="{{url}}">{{title}}</a>
            </h3>

            {{#if excerpt}}
            <p class="gh-post-card-excerpt text-muted-foreground text-sm line-clamp-3 mb-4 leading-relaxed">{{excerpt words="25"}}</p>
            {{/if}}
        </div>

        <div class="gh-post-card-footer pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div class="gh-post-card-author">
                {{#primary_author}}
                <span>{{name}}</span>
                {{/primary_author}}
            </div>
            <time datetime="{{date format="YYYY-MM-DD"}}">{{date format="D MMM YYYY"}}</time>
        </div>
    </div>
</article>`
    },
    {
      name: "post-card.css",
      type: "style",
      target: "assets/css/components/post-card.css",
      content: `/* ghostcn: Post Card Styles */
.gh-post-card {
    ${surface}
    font-family: inherit;
    font-size: ${token('text-body')};
    line-height: 1.5;
    isolation: isolate;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: border-color 180ms ease;
}

.gh-post-card:hover {
    border-color: color-mix(in srgb, var(--foreground) 22%, var(--border));
}

.gh-post-card *,
.gh-post-card *::before,
.gh-post-card *::after {
    box-sizing: border-box;
}

.gh-post-card-image {
    aspect-ratio: 16 / 9;
    overflow: hidden;
    display: block;
    background-color: var(--muted, #f4f4f5);
}

.gh-post-card-image img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 300ms ease;
}

.gh-post-card:hover .gh-post-card-image img {
    transform: scale(1.02);
}

@media (prefers-reduced-motion: reduce) {
    .gh-post-card, .gh-post-card-image img { transition: none; transform: none; }
}

.gh-post-card-content {
    padding: ${token('panel-padding')};
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.gh-post-card-tag {
    color: inherit;
    font-size: inherit;
    font-weight: 600;
    text-decoration: none;
}

.gh-post-card-tag:hover {
    text-decoration: underline;
}

.gh-post-card-title {
    ${cardTitle}
    margin: 8px 0;
}

.gh-post-card-title a {
    color: inherit;
    text-decoration: none;
    transition: color 0.15s ease;
}

.gh-post-card-title a:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
}

.gh-post-card-excerpt {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    color: var(--muted-foreground, #71717a);
    font-size: ${token('text-small')};
    line-height: 1.5;
    margin: 0 0 16px;
}

.gh-post-card-footer {
    padding-top: 1rem;
    border-top: 1px solid var(--border, #e4e4e7);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 4px 12px;
    font-size: ${token('text-meta')};
    color: var(--muted-foreground, #71717a);
}

.gh-post-card-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; color: var(--muted-foreground); font-size: ${token('text-meta')}; }
.gh-post-card-reading-time { color: var(--muted-foreground); }
.gh-post-card-separator { color: color-mix(in srgb, var(--muted-foreground) 40%, transparent); }
.gh-post-card-author { display: flex; align-items: center; gap: 0.5rem; font-weight: 500; }
${focusWithin('.gh-post-card')}
.gh-post-card-image:focus-visible { outline-offset: -3px; }
`
    }
  ],
  gscan: {
    rules_satisfied: ["GS010-PJ-VALID"],
    notes: "Uses standard Ghost post helpers (feature_image, primary_tag, reading_time, excerpt, date)."
  }
};

function makeCssHostIndependent(component) {
  for (const file of component.files) {
    if (file.type === 'style') {
      // Casper and other themes may change the root font size (e.g. 62.5%).
      // Convert rem to exact px on a 16px baseline so nested smaller-font elements don't compound em scaling.
      file.content = file.content.replace(/(-?\d*\.?\d+)rem\b/g, (_match, value) => {
        const px = Math.round(parseFloat(value) * 16 * 100) / 100;
        return `${px}px`;
      });
    }
  }
}

const allComponents = [newsletterForm, pricingTable, authorCard, postCard, ...coreComponents, ...readingComponents, ...primitives, ...composedComponents, ...extraComponents];
applyStyleSlots(pricingTable, {
  class: ['gh-pricing'], titleClass: ['gh-pricing-title'], gridClass: ['gh-pricing-grid'],
  cardClass: ['gh-pricing-card'], buttonClass: ['ghcn-button'], cardTitleClass: ['gh-pricing-card-title'],
  descriptionClass: ['gh-pricing-description'], priceClass: ['gh-pricing-price'], benefitsClass: ['gh-pricing-benefits']
});
applyStyleSlots(newsletterForm, {
  class: ['gh-newsletter-form'], titleClass: ['gh-newsletter-title'], descriptionClass: ['gh-newsletter-desc'],
  formClass: ['gh-newsletter-fields'], inputClass: ['gh-newsletter-input'], buttonClass: ['gh-newsletter-btn', 'ghcn-button']
}, { portableMarkup: true });
applyStyleSlots(authorCard, {
  class: ['gh-author-card'], avatarClass: ['gh-author-avatar', 'gh-author-avatar-fallback'],
  contentClass: ['gh-author-details'], titleClass: ['gh-author-name'], descriptionClass: ['gh-author-bio'], metaClass: ['gh-author-meta']
}, { portableMarkup: true });
applyStyleSlots(postCard, {
  class: ['gh-post-card'], imageClass: ['gh-post-card-img'], contentClass: ['gh-post-card-content'],
  titleClass: ['gh-post-card-title'], descriptionClass: ['gh-post-card-excerpt'], metaClass: ['gh-post-card-meta'], footerClass: ['gh-post-card-footer']
}, { portableMarkup: true });
const coreStyleSlots = {
  'site-header': { class: ['ghcn-header'], innerClass: ['ghcn-header__inner'], navClass: ['ghcn-header__nav', 'ghcn-header__mobile-nav'], buttonClass: ['ghcn-button'] },
  'site-footer': { class: ['ghcn-footer'], innerClass: ['ghcn-footer__inner'], navClass: ['ghcn-footer__nav'], socialClass: ['ghcn-footer__social'] },
  'featured-posts': { class: ['ghcn-featured'], titleClass: ['ghcn-featured__title'], gridClass: ['ghcn-featured__grid'], cardClass: ['ghcn-featured__card'], contentClass: ['ghcn-featured__content'] },
  'pagination': { class: ['ghcn-pagination'], buttonClass: ['ghcn-button'], statusClass: ['ghcn-pagination__status'] },
  'post-header': { class: ['ghcn-post-header'], titleClass: ['ghcn-post-header__title'], descriptionClass: ['ghcn-post-header__excerpt'], metaClass: ['ghcn-post-header__meta'], imageClass: ['ghcn-post-header__image'] },
  'member-cta': { class: ['ghcn-member-cta'], titleClass: ['ghcn-member-cta__title'], descriptionClass: ['ghcn-member-cta__description'], buttonClass: ['ghcn-button'] }
};
for (const component of coreComponents) applyStyleSlots(component, coreStyleSlots[component.name]);
allComponents.forEach(makeCssHostIndependent);

fs.writeFileSync(path.join(componentsDir, 'newsletter-form.json'), JSON.stringify(newsletterForm, null, 2), 'utf8');
console.log('Created newsletter-form.json');

fs.writeFileSync(path.join(componentsDir, 'pricing-table.json'), JSON.stringify(pricingTable, null, 2), 'utf8');
console.log('Created pricing-table.json');

fs.writeFileSync(path.join(componentsDir, 'author-card.json'), JSON.stringify(authorCard, null, 2), 'utf8');
console.log('Created author-card.json');

fs.writeFileSync(path.join(componentsDir, 'post-card.json'), JSON.stringify(postCard, null, 2), 'utf8');
console.log('Created post-card.json');

for (const component of coreComponents) {
  fs.writeFileSync(path.join(componentsDir, `${component.name}.json`), JSON.stringify(component, null, 2), 'utf8');
  console.log(`Created ${component.name}.json`);
}
for (const component of [...readingComponents, ...primitives, ...composedComponents, ...extraComponents]) {
  fs.writeFileSync(path.join(componentsDir, `${component.name}.json`), JSON.stringify(component, null, 2), 'utf8');
  console.log(`Created ${component.name}.json`);
}

// 5. Generate registry/index.json from the single source of truth
const index = allComponents.map(component => ({
  name: component.name,
  description: component.description,
  category: component.type,
  ghost_version: component.ghost_version,
  files: component.files.map(file => file.name)
}));

fs.writeFileSync(path.join(__dirname, '..', 'registry', 'index.json'), JSON.stringify(index, null, 2), 'utf8');
console.log('Created registry/index.json');
