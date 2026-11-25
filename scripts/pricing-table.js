const { token, section, sectionTitle, surface, cardTitle, grid, focusWithin } = require('./component-defaults');

// Plan rules remain in Ghost's branches below. Both plans use the same layout.
const tierCard = (price, actions, paid = false) => `<article class="gh-pricing-card${paid ? ' gh-pricing-card--paid' : ''}"${paid ? '{{#if monthly_price}} data-monthly-cents="{{monthly_price}}"{{/if}}{{#if yearly_price}} data-yearly-cents="{{yearly_price}}"{{/if}}' : ''}>
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
        <p class="gh-pricing-price"{{#if yearly_price}} data-pricing-interval="monthly"{{/if}}>{{price monthly_price currency=currency}} <span>/ month</span></p>
        {{#if yearly_price}}<p class="gh-pricing-price gh-pricing-price--alternate" data-pricing-interval="yearly">{{price yearly_price currency=currency}} <span>/ year</span></p>{{/if}}
    {{else}}
        {{#if yearly_price}}<p class="gh-pricing-price">{{price yearly_price currency=currency}} <span>/ year</span></p>{{/if}}
    {{/if}}`, `
    {{#if @member}}
        <a class="ghcn-button" href="#/portal/account/plans" data-portal="account/plans">{{#if @member.paid}}Manage plan{{else}}Upgrade membership{{/if}}</a>
    {{else}}
        {{#if monthly_price}}
            <a class="ghcn-button"{{#if yearly_price}} data-pricing-interval="monthly"{{/if}} href="#/portal/signup/{{id}}/monthly" data-portal="signup/{{id}}/monthly" aria-label="Subscribe monthly to {{name}}">Subscribe monthly</a>
            {{#if yearly_price}}<a class="ghcn-button gh-pricing-alternate" data-pricing-interval="yearly" href="#/portal/signup/{{id}}/yearly" data-portal="signup/{{id}}/yearly" aria-label="Subscribe yearly to {{name}}">Subscribe yearly</a>{{/if}}
        {{else}}
            {{#if yearly_price}}<a class="ghcn-button" href="#/portal/signup/{{id}}/yearly" data-portal="signup/{{id}}/yearly" aria-label="Subscribe yearly to {{name}}">Subscribe yearly</a>{{/if}}
        {{/if}}
    {{/if}}`, true);

const pricingToggleScript = `/* ghostcn pricing billing toggle: progressive enhancement, zero-JS fallback, repeat-safe. */
(() => {
  function init() {
    document.querySelectorAll('[data-ghcn-pricing]').forEach(section => {
      if (section.dataset.ghcnPricingReady) return;
      const toggle = section.querySelector('[data-ghcn-billing-toggle]');
      if (!toggle) return;
      const dualCards = [...section.querySelectorAll('.gh-pricing-card--paid[data-monthly-cents][data-yearly-cents]')];
      if (!dualCards.length) return;
      section.dataset.ghcnPricingReady = 'true';

      let bestSavings = 0;
      for (const card of dualCards) {
        const monthly = Number(card.dataset.monthlyCents);
        const yearly = Number(card.dataset.yearlyCents);
        if (monthly > 0 && yearly > 0 && yearly < monthly * 12) {
          bestSavings = Math.max(bestSavings, Math.round((1 - yearly / (monthly * 12)) * 100));
        }
      }
      const savingsBadge = toggle.querySelector('[data-billing-savings]');
      if (savingsBadge && bestSavings >= 5) {
        savingsBadge.textContent = 'Save ' + bestSavings + '%';
        savingsBadge.hidden = false;
      }

      const buttons = [...toggle.querySelectorAll('[data-billing-choice]')];
      const setIntervalMode = (mode) => {
        section.dataset.billing = mode;
        buttons.forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.billingChoice === mode)));
      };
      buttons.forEach(btn => btn.addEventListener('click', () => setIntervalMode(btn.dataset.billingChoice)));
      toggle.hidden = false;
      setIntervalMode(section.dataset.defaultBilling === 'yearly' ? 'yearly' : 'monthly');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();`;

module.exports = {
  name: 'pricing-table', type: 'components:members',
  description: 'Live Ghost tiers, prices, currencies, benefits, and progressive monthly/yearly toggle with Portal checkout.',
  dependencies: [], ghost_version: '>=5.0.0',
  parameters: {
    title: { description: 'Optional section heading override.', default: 'Choose your membership' },
    defaultBilling: { description: 'Initial interval when the progressive billing toggle activates.', options: ['monthly', 'yearly'], default: 'monthly' }
  },
  files: [
    { name: 'pricing-table.hbs', type: 'partial', target: 'partials/components/pricing-table.hbs', content: `{{!-- Component: Pricing Table | Usage: {{> "components/pricing-table"}} --}}
{{#if @site.members_enabled}}
{{#unless @site.members_invite_only}}
{{#if @site.allow_self_signup}}
<section class="gh-pricing" data-ghcn-pricing data-default-billing="{{#match defaultBilling "yearly"}}yearly{{else}}monthly{{/match}}" aria-label="Membership plans">
    <h2 class="gh-pricing-title">{{#if title}}{{title}}{{else}}Choose your membership{{/if}}</h2>
    <div class="gh-pricing-billing" data-ghcn-billing-toggle role="group" aria-label="Billing interval" hidden>
        <button type="button" class="gh-pricing-billing__btn" data-billing-choice="monthly" aria-pressed="true">Monthly</button>
        <button type="button" class="gh-pricing-billing__btn" data-billing-choice="yearly" aria-pressed="false">Yearly <span class="gh-pricing-billing__badge" data-billing-savings hidden></span></button>
    </div>
    <div class="gh-pricing-grid">
    {{#get "tiers" filter="visibility:public+active:true" include="monthly_price,yearly_price,benefits"}}
    {{#if tiers}}
    {{#foreach tiers}}
        {{#match type "free"}}
        ${freeCard}
        {{else}}
        {{#if @site.paid_members_enabled}}
        {{#if monthly_price}}
        ${paidCard}
        {{else if yearly_price}}
        ${paidCard}
        {{/if}}
        {{/if}}
        {{/match}}
    {{/foreach}}
    {{else}}
        <p class="gh-pricing-empty">Membership plans are currently unavailable.</p>
    {{/if}}
    {{else}}
        <p class="gh-pricing-empty">Membership plans are currently unavailable.</p>
    {{/get}}
    </div>
</section>
{{/if}}
{{/unless}}
{{/if}}` },
    { name: 'pricing-table.css', type: 'style', target: 'assets/css/components/pricing-table.css', content: `/* ghostcn: live membership pricing */
.gh-pricing { ${section} width: min(100% - 32px, 960px); margin-inline: auto; }
.gh-pricing *, .gh-pricing *::before, .gh-pricing *::after { box-sizing: border-box; }
.gh-pricing-title { ${sectionTitle} margin: 0 0 16px; text-align: center; }
.gh-pricing-billing { display: flex; align-items: center; justify-content: center; gap: 4px; width: fit-content; margin: 0 auto ${token('section-gap')}; padding: 4px; border: 1px solid var(--border); border-radius: 9999px; background: var(--secondary); }
.gh-pricing-billing[hidden] { display: none; }
.gh-pricing-billing__btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border: 1px solid transparent; border-radius: 9999px; background: transparent; color: var(--muted-foreground); font: inherit; font-size: ${token('text-small')}; font-weight: 600; cursor: pointer; transition: background-color 150ms ease, color 150ms ease; }
.gh-pricing-billing__btn:hover { color: var(--foreground); }
.gh-pricing-billing__btn[aria-pressed="true"] { background: var(--background); color: var(--foreground); border-color: var(--border); box-shadow: 0 1px 2px #0001; }
.gh-pricing-billing__badge { display: inline-flex; align-items: center; padding: 1px 7px; border-radius: 9999px; background: var(--primary); color: var(--primary-foreground); font-size: 11px; font-weight: 700; }
.gh-pricing-billing__badge[hidden] { display: none; }
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
/* Progressive billing toggle: when JS activates, promote the selected interval to primary */
.gh-pricing:where([data-billing="monthly"]) [data-pricing-interval="yearly"],
.gh-pricing:where([data-billing="yearly"]) [data-pricing-interval="monthly"] { display: none; }
.gh-pricing:where([data-billing="yearly"]) .gh-pricing-price--alternate { ${sectionTitle} }
.gh-pricing:where([data-billing="yearly"]) .gh-pricing-alternate { justify-self: stretch; background: var(--primary); color: var(--primary-foreground); text-decoration: none; }
${focusWithin('.gh-pricing')}
@media (min-width: 640px) {
    :where(.gh-pricing:not([data-billing]) .gh-pricing-grid:has(.gh-pricing-price--alternate)) .gh-pricing-card__rates { min-block-size: calc(1.18 * ${token('title-section')} + 25px); align-content: start; }
    :where(.gh-pricing:not([data-billing]) .gh-pricing-grid:has(.gh-pricing-price--alternate)) .gh-pricing-actions { min-block-size: calc(2 * ${token('control-height')} + 8px); }
}
@media (prefers-reduced-motion: reduce) { .gh-pricing-billing__btn { transition: none; } }
` },
    { name: 'pricing-table.js', type: 'js', target: 'assets/js/components/pricing-table.js', content: pricingToggleScript }
  ],
  gscan: { rules_satisfied: ['GS010-PJ-VALID'], notes: 'Reads public Ghost tiers; progressive monthly/yearly toggle with zero-JS fallback.' }
};
