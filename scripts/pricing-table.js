const { token, section, sectionTitle, surface, cardTitle, grid } = require('./component-defaults');

// Plan rules remain in Ghost's branches below. Both plans use the same layout.
const tierCard = (price, actions, paid = false) => `<article class="gh-pricing-card${paid ? ' gh-pricing-card--paid' : ''}">
    <header class="gh-pricing-card__header">
        <h3 class="gh-pricing-card-title">{{name}}</h3>
        {{#if description}}<p class="gh-pricing-description">{{description}}</p>{{/if}}
    </header>
    <div class="gh-pricing-card__rates">${price}</div>
    {{#if benefits}}
    <ul class="gh-pricing-benefits" role="list">{{#foreach benefits}}<li>{{this}}</li>{{/foreach}}</ul>
    {{/if}}
    <div class="gh-pricing-actions">${actions}</div>
</article>`;

const freeCard = tierCard('<p class="gh-pricing-price">Free</p>', `
    {{#if @member}}<a class="ghcn-button ghcn-button--outline" href="#/portal/account" data-portal="account">Manage account</a>
    {{else}}<a class="ghcn-button ghcn-button--outline" href="#/portal/signup/free" data-portal="signup/free">Join free</a>{{/if}}`);

const paidCard = tierCard(`
    {{#if monthly_price}}
        <p class="gh-pricing-price">{{price monthly_price currency=currency}} <span>/ month</span></p>
        {{#if yearly_price}}<p class="gh-pricing-price gh-pricing-price--alternate">{{price yearly_price currency=currency}} <span>billed yearly</span></p>{{/if}}
    {{else}}
        {{#if yearly_price}}<p class="gh-pricing-price">{{price yearly_price currency=currency}} <span>/ year</span></p>{{/if}}
    {{/if}}`, `
    {{#if @member}}
        <a class="ghcn-button" href="#/portal/account/plans" data-portal="account/plans">{{#if @member.paid}}Manage plan{{else}}Upgrade membership{{/if}}</a>
    {{else}}
        {{#if monthly_price}}
            <a class="ghcn-button" href="#/portal/signup/{{id}}/monthly" data-portal="signup/{{id}}/monthly">Subscribe monthly</a>
            {{#if yearly_price}}<a class="ghcn-button gh-pricing-alternate" href="#/portal/signup/{{id}}/yearly" data-portal="signup/{{id}}/yearly">Subscribe yearly</a>{{/if}}
        {{else}}
            {{#if yearly_price}}<a class="ghcn-button" href="#/portal/signup/{{id}}/yearly" data-portal="signup/{{id}}/yearly">Subscribe yearly</a>{{/if}}
        {{/if}}
    {{/if}}`, true);

module.exports = {
  name: 'pricing-table', type: 'components:members',
  description: 'Live Ghost tiers, prices, currencies and benefits with tier-specific Portal checkout.',
  dependencies: [], ghost_version: '>=5.0.0',
  files: [
    { name: 'pricing-table.hbs', type: 'partial', target: 'partials/components/pricing-table.hbs', content: `{{!-- Component: Pricing Table | Usage: {{> "components/pricing-table"}} --}}
{{#if @site.members_enabled}}
{{#unless @site.members_invite_only}}
{{#if @site.allow_self_signup}}
<section class="gh-pricing" aria-label="Membership plans">
    <h2 class="gh-pricing-title">{{#if title}}{{title}}{{else}}Choose your membership{{/if}}</h2>
    <div class="gh-pricing-grid">
    {{#get "tiers" filter="visibility:public+active:true" include="monthly_price,yearly_price,benefits"}}
    {{#foreach tiers}}
        {{#match type "free"}}
        ${freeCard}
        {{else}}
        {{#if @site.paid_members_enabled}}
        ${paidCard}
        {{/if}}
        {{/match}}
    {{/foreach}}
    {{else}}
        <p>Membership plans are currently unavailable.</p>
    {{/get}}
    </div>
</section>
{{/if}}
{{/unless}}
{{/if}}` },
    { name: 'pricing-table.css', type: 'style', target: 'assets/css/components/pricing-table.css', content: `/* ghostcn: live membership pricing */
.gh-pricing { ${section} width: min(100% - 32px, 960px); margin-inline: auto; }
.gh-pricing *, .gh-pricing *::before, .gh-pricing *::after { box-sizing: border-box; }
.gh-pricing-title { ${sectionTitle} margin: 0 0 ${token('section-gap')}; text-align: center; }
.gh-pricing-grid { ${grid(288)} }
.gh-pricing-card { ${surface} display: flex; flex-direction: column; gap: 16px; padding: ${token('panel-padding')}; }
.gh-pricing-card--paid { border-color: color-mix(in srgb, var(--foreground) 24%, var(--border)); }
.gh-pricing-card:only-child { width: min(100%, 440px); justify-self: center; }
.gh-pricing-card__header { display: grid; gap: 4px; }
.gh-pricing-card__rates { display: grid; gap: 4px; }
/* Follow the card's local foreground, not the page's dark/light tokens.
   A custom background must be paired with a readable foreground at the call site. */
.gh-pricing-card-title { ${cardTitle} margin: 0; }
.gh-pricing-description { margin: 0; color: inherit; font-size: ${token('text-small')}; }
.gh-pricing-benefits { display: grid; gap: 8px; margin: 0; padding: 14px 0 0; border-block-start: 1px solid var(--border); list-style: none; color: inherit; font-size: ${token('text-small')}; }
.gh-pricing-benefits li { display: flex; align-items: baseline; gap: 10px; color: inherit; }
.gh-pricing-benefits li::before { content: ""; flex: 0 0 5px; height: 9px; border: solid currentColor; border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); }
.gh-pricing-price { ${sectionTitle} margin: 0; color: inherit; font-variant-numeric: tabular-nums; }
.gh-pricing-price span { font-size: ${token('text-small')}; font-weight: 400; letter-spacing: normal; color: inherit; }
.gh-pricing-price--alternate { font-size: ${token('text-small')}; font-weight: 600; line-height: 1.5; letter-spacing: normal; }
.gh-pricing-actions { display: grid; align-content: start; gap: 4px; margin-block-start: auto; padding-block-start: 4px; }
.gh-pricing-actions:empty, .gh-pricing-card__rates:empty { display: none; }
:where(.gh-pricing-actions) .ghcn-button--outline { background: var(--background); }
.gh-pricing-alternate { justify-self: center; background: transparent; color: inherit; text-decoration: underline; text-underline-offset: 3px; }
@media (min-width: 640px) {
    :where(.gh-pricing-grid:has(.gh-pricing-price--alternate)) .gh-pricing-card__rates { min-block-size: calc(1.18 * ${token('title-section')} + 25px); align-content: start; }
    :where(.gh-pricing-grid:has(.gh-pricing-alternate)) .gh-pricing-actions { min-block-size: calc(2 * ${token('control-height')} + 8px); }
}
` }
  ],
  gscan: { rules_satisfied: ['GS010-PJ-VALID'], notes: 'Reads public Ghost tiers; no placeholder pricing or invented benefits.' }
};
