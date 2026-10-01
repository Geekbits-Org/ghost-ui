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
        <article class="gh-pricing-card">
            <h3>{{name}}</h3>
            {{#if description}}<p>{{description}}</p>{{/if}}
            <p class="gh-pricing-price">Free</p>
            {{#if benefits}}<ul>{{#foreach benefits}}<li>{{this}}</li>{{/foreach}}</ul>{{/if}}
            {{#if @member}}<a class="ghcn-button ghcn-button--outline" href="#/portal/account" data-portal="account">Manage account</a>
            {{else}}<a class="ghcn-button ghcn-button--outline" href="#/portal/signup/free" data-portal="signup/free">Join free</a>{{/if}}
        </article>
        {{else}}
        {{#if @site.paid_members_enabled}}
        <article class="gh-pricing-card">
            <h3>{{name}}</h3>
            {{#if description}}<p>{{description}}</p>{{/if}}
            {{#if benefits}}<ul>{{#foreach benefits}}<li>{{this}}</li>{{/foreach}}</ul>{{/if}}
            {{#if monthly_price}}<p class="gh-pricing-price">{{price monthly_price currency=currency}} <span>/ month</span></p>{{/if}}
            {{#if yearly_price}}<p class="gh-pricing-price">{{price yearly_price currency=currency}} <span>/ year</span></p>{{/if}}
            <div class="gh-pricing-actions">
            {{#if @member}}
                <a class="ghcn-button" href="#/portal/account/plans" data-portal="account/plans">{{#if @member.paid}}Manage plan{{else}}Upgrade membership{{/if}}</a>
            {{else}}
                {{#if monthly_price}}<a class="ghcn-button" href="#/portal/signup/{{id}}/monthly" data-portal="signup/{{id}}/monthly">Subscribe monthly</a>{{/if}}
                {{#if yearly_price}}<a class="ghcn-button ghcn-button--outline" href="#/portal/signup/{{id}}/yearly" data-portal="signup/{{id}}/yearly">Subscribe yearly</a>{{/if}}
            {{/if}}
            </div>
        </article>
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
.gh-pricing { box-sizing: border-box; width: min(100% - 2rem, 72rem); margin: 3rem auto; color: var(--foreground); font-size: 16px; line-height: 1.5; }
.gh-pricing *, .gh-pricing *::before, .gh-pricing *::after { box-sizing: border-box; }
.gh-pricing-title { margin: 0 0 1.5rem; text-align: center; font-size: 2rem; }
.gh-pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); gap: 1.25rem; }
.gh-pricing-card { display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; border: 1px solid var(--border); border-radius: min(var(--radius), 1.5rem); background: var(--card); color: var(--card-foreground); }
.gh-pricing-card h3 { margin: 0; font-size: 1.25rem; }
.gh-pricing-card p { margin: 0; }
.gh-pricing-card ul { margin: 0; padding-left: 1.25rem; color: var(--muted-foreground); }
.gh-pricing-price { font-size: 1.75rem; font-weight: 700; }
.gh-pricing-price span { font-size: 0.875rem; font-weight: 400; color: var(--muted-foreground); }
.gh-pricing-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: auto; }
` }
  ],
  gscan: { rules_satisfied: ['GS010-PJ-VALID'], notes: 'Reads public Ghost tiers; no placeholder pricing or invented benefits.' }
};
