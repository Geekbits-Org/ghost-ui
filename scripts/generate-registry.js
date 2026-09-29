const fs = require('fs');
const path = require('path');
const coreComponents = require('./core-components');

const componentsDir = path.join(__dirname, '..', 'registry', 'components');
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

// 1. newsletter-form
const newsletterForm = {
  name: "newsletter-form",
  type: "components:ui",
  description: "A native Ghost members subscription form with state handling.",
  dependencies: [],
  ghost_version: ">=5.0.0",
  files: [
    {
      name: "newsletter-form.hbs",
      type: "partial",
      target: "partials/components/newsletter-form.hbs",
      content: `{{!--
  Component: Newsletter Form
  Usage: {{> "components/newsletter-form" title="Subscribe to our newsletter" description="Get the latest posts delivered right to your inbox."}}
--}}
<section class="gh-newsletter-form bg-card text-card-foreground border border-border p-8 rounded-ghostcn text-center max-w-2xl mx-auto my-8 shadow-sm">
    <div class="mb-6">
        <h3 class="gh-newsletter-title text-2xl font-bold tracking-tight mb-2 text-foreground">
            {{#if title}}{{title}}{{else}}Subscribe to our newsletter{{/if}}
        </h3>
        <p class="gh-newsletter-desc text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            {{#if description}}{{description}}{{else}}Get the latest stories, news, and perspectives delivered directly to your inbox.{{/if}}
        </p>
    </div>

    {{!-- Ghost native members form handling --}}
    <form data-members-form="subscribe" class="gh-newsletter-fields flex flex-col sm:flex-row gap-3 max-w-md mx-auto relative">
        <label for="gh-email" class="sr-only">Email address</label>
        <input
            data-members-email
            type="email"
            id="gh-email"
            required
            placeholder="jamie@example.com"
            class="gh-newsletter-input flex-1 px-4 py-2.5 bg-background text-foreground border border-input rounded-ghostcn text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
        <button type="submit" class="gh-newsletter-btn bg-primary text-primary-foreground px-6 py-2.5 rounded-ghostcn text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center shadow-sm">
            <span class="button-text">Subscribe</span>
        </button>

        {{!-- Ghost automatic states (hidden by default, shown via Ghost Portal JS) --}}
        <div class="gh-newsletter-msg-success message-success hidden absolute -bottom-7 left-0 right-0 text-xs text-green-600 dark:text-green-400 font-medium" data-members-success>
            ✓ Check your inbox to confirm your subscription!
        </div>
        <div class="gh-newsletter-msg-error message-error hidden absolute -bottom-7 left-0 right-0 text-xs text-red-600 dark:text-red-400 font-medium" data-members-error>
            ✕ Please enter a valid email address.
        </div>
    </form>
</section>`
    },
    {
      name: "newsletter-form.css",
      type: "style",
      target: "assets/css/components/newsletter-form.css",
      content: `/* ghostcn: Newsletter Form Styles */
.gh-newsletter-form {
    box-sizing: border-box;
    font-family: inherit;
    font-size: 16px;
    line-height: 1.5;
    isolation: isolate;
    background-color: var(--card, #ffffff);
    color: var(--card-foreground, #09090b);
    border: 1px solid var(--border, #e4e4e7);
    border-radius: min(var(--radius, 0.5rem), 1.5rem);
    padding: 2rem;
    text-align: center;
    max-width: 42rem;
    margin: 2rem auto;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.gh-newsletter-form *,
.gh-newsletter-form *::before,
.gh-newsletter-form *::after {
    box-sizing: border-box;
}

.gh-newsletter-title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    margin-bottom: 0.5rem;
    color: var(--foreground, #09090b);
}

.gh-newsletter-desc {
    color: var(--muted-foreground, #71717a);
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0 auto 1.5rem;
    max-width: 28rem;
}

.gh-newsletter-fields {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 28rem;
    margin: 0 auto;
    position: relative;
}

@media (min-width: 640px) {
    .gh-newsletter-fields {
        flex-direction: row;
    }
}

.gh-newsletter-input {
    flex: 1;
    padding: 0.625rem 1rem;
    background-color: var(--background, #ffffff);
    color: var(--foreground, #09090b);
    border: 1px solid var(--input, #e4e4e7);
    border-radius: var(--radius, 0.5rem);
    font-size: 0.875rem;
    outline: none;
    transition: box-shadow 0.15s ease, border-color 0.15s ease;
}

.gh-newsletter-input:focus {
    border-color: var(--ring, #18181b);
    box-shadow: 0 0 0 2px var(--ring, #18181b);
}

.gh-newsletter-btn {
    background-color: var(--primary, var(--ghost-accent-color, #18181b));
    color: var(--primary-foreground, #ffffff);
    padding: 0.625rem 1.5rem;
    border-radius: var(--radius, 0.5rem);
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    cursor: pointer;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    transition: opacity 0.15s ease;
}

.gh-newsletter-btn:hover {
    opacity: 0.9;
}

.gh-newsletter-msg-success,
.gh-newsletter-msg-error {
    display: none;
    position: absolute;
    bottom: -1.75rem;
    left: 0;
    right: 0;
    font-size: 0.75rem;
    font-weight: 500;
}

.gh-newsletter-fields.success .gh-newsletter-msg-success,
.gh-newsletter-fields.error .gh-newsletter-msg-error {
    display: block;
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
    color: #16a34a;
}

.gh-newsletter-msg-error {
    color: #dc2626;
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
const pricingTable = {
  name: "pricing-table",
  type: "components:ui",
  description: "Membership tiers and pricing plans with native Ghost Portal checkout triggers.",
  dependencies: [],
  ghost_version: ">=5.0.0",
  files: [
    {
      name: "pricing-table.hbs",
      type: "partial",
      target: "partials/components/pricing-table.hbs",
      content: `{{!--
  Component: Pricing Table
  Usage: {{> "components/pricing-table" title="Choose your plan"}}
--}}
<section class="gh-pricing bg-background py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto my-8">
    <div class="text-center mb-12">
        <h2 class="gh-pricing-title text-3xl font-extrabold tracking-tight text-foreground mb-3">
            {{#if title}}{{title}}{{else}}Choose the right plan for you{{/if}}
        </h2>
        <p class="gh-pricing-desc text-muted-foreground text-base max-w-xl mx-auto">
            {{#if description}}{{description}}{{else}}Unlock unlimited access to exclusive content, newsletters, and member-only discussions.{{/if}}
        </p>
    </div>

    <div class="gh-pricing-grid grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {{!-- Free Tier --}}
        <div class="gh-pricing-card bg-card text-card-foreground border border-border rounded-ghostcn p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
                <h3 class="text-xl font-bold text-foreground mb-1">Free</h3>
                <p class="text-muted-foreground text-sm mb-4">Preview public posts</p>
                <div class="text-3xl font-extrabold text-foreground mb-6">$0 <span class="text-sm font-normal text-muted-foreground">/ forever</span></div>
                <ul class="space-y-3 text-sm text-muted-foreground mb-6">
                    <li class="flex items-center gap-2"><span class="text-primary font-bold">✓</span> Access to public posts</li>
                    <li class="flex items-center gap-2"><span class="text-primary font-bold">✓</span> Regular email newsletters</li>
                </ul>
            </div>
            <a href="#/portal/signup/free" data-portal="signup/free" class="gh-pricing-btn block w-full text-center py-2.5 px-4 rounded-ghostcn text-sm font-medium border border-input text-foreground bg-background hover:bg-muted transition-colors">
                Sign up free
            </a>
        </div>

        {{!-- Monthly Tier (Featured) --}}
        <div class="gh-pricing-card gh-pricing-card-featured bg-card text-card-foreground border-2 border-primary rounded-ghostcn p-6 flex flex-col justify-between shadow-lg relative">
            <span class="gh-pricing-badge absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Most Popular
            </span>
            <div>
                <h3 class="text-xl font-bold text-foreground mb-1">Monthly</h3>
                <p class="text-muted-foreground text-sm mb-4">Full access billed monthly</p>
                <div class="text-3xl font-extrabold text-primary mb-6">$5 <span class="text-sm font-normal text-muted-foreground">/ month</span></div>
                <ul class="space-y-3 text-sm text-muted-foreground mb-6">
                    <li class="flex items-center gap-2"><span class="text-primary font-bold">✓</span> Full archive access</li>
                    <li class="flex items-center gap-2"><span class="text-primary font-bold">✓</span> Member-only newsletter</li>
                    <li class="flex items-center gap-2"><span class="text-primary font-bold">✓</span> Community discussions</li>
                </ul>
            </div>
            <a href="#/portal/signup/monthly" data-portal="signup/monthly" class="gh-pricing-btn gh-pricing-btn-primary block w-full text-center py-2.5 px-4 rounded-ghostcn text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 transition-opacity shadow-sm">
                Subscribe monthly
            </a>
        </div>

        {{!-- Annual Tier --}}
        <div class="gh-pricing-card bg-card text-card-foreground border border-border rounded-ghostcn p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
                <h3 class="text-xl font-bold text-foreground mb-1">Annual</h3>
                <p class="text-muted-foreground text-sm mb-4">Save 20% with annual billing</p>
                <div class="text-3xl font-extrabold text-foreground mb-6">$48 <span class="text-sm font-normal text-muted-foreground">/ year</span></div>
                <ul class="space-y-3 text-sm text-muted-foreground mb-6">
                    <li class="flex items-center gap-2"><span class="text-primary font-bold">✓</span> Everything in Monthly</li>
                    <li class="flex items-center gap-2"><span class="text-primary font-bold">✓</span> 2 months free included</li>
                    <li class="flex items-center gap-2"><span class="text-primary font-bold">✓</span> VIP priority support</li>
                </ul>
            </div>
            <a href="#/portal/signup/yearly" data-portal="signup/yearly" class="gh-pricing-btn block w-full text-center py-2.5 px-4 rounded-ghostcn text-sm font-medium border border-input text-foreground bg-background hover:bg-muted transition-colors">
                Subscribe yearly
            </a>
        </div>
    </div>
</section>`
    },
    {
      name: "pricing-table.css",
      type: "style",
      target: "assets/css/components/pricing-table.css",
      content: `/* ghostcn: Pricing Table Styles */
.gh-pricing {
    box-sizing: border-box;
    font-family: inherit;
    font-size: 16px;
    line-height: 1.5;
    isolation: isolate;
    max-width: 64rem;
    margin: 2rem auto;
    padding: 2rem 1rem;
}

.gh-pricing *,
.gh-pricing *::before,
.gh-pricing *::after {
    box-sizing: border-box;
}

.gh-pricing-title {
    font-size: 1.875rem;
    font-weight: 800;
    letter-spacing: -0.025em;
    text-align: center;
    color: var(--foreground, #09090b);
    margin-bottom: 0.75rem;
}

.gh-pricing-desc {
    text-align: center;
    color: var(--muted-foreground, #71717a);
    margin-bottom: 2.5rem;
}

.gh-pricing-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
}

@media (min-width: 768px) {
    .gh-pricing-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

.gh-pricing-card {
    border: 1px solid var(--border, #e4e4e7);
    border-radius: min(var(--radius, 0.5rem), 1.5rem);
    padding: 1.5rem;
    background-color: var(--card, #ffffff);
    color: var(--card-foreground, #09090b);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.2s ease;
}

.gh-pricing-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.gh-pricing-card-featured {
    border: 2px solid var(--primary, var(--ghost-accent-color, #18181b));
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.gh-pricing-badge {
    position: absolute;
    top: -0.75rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--primary, var(--ghost-accent-color, #18181b));
    color: var(--primary-foreground, #ffffff);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

.gh-pricing-btn {
    display: block;
    width: 100%;
    text-align: center;
    padding: 0.625rem 1rem;
    border-radius: var(--radius, 0.5rem);
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    border: 1px solid var(--input, #e4e4e7);
    color: var(--foreground, #09090b);
    background-color: var(--background, #ffffff);
    margin-top: 1.5rem;
    transition: background-color 0.15s ease;
}

.gh-pricing-btn:hover {
    background-color: var(--muted, #f4f4f5);
}

.gh-pricing-btn-primary {
    background-color: var(--primary, var(--ghost-accent-color, #18181b));
    border-color: var(--primary, var(--ghost-accent-color, #18181b));
    color: var(--primary-foreground, #ffffff);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.gh-pricing-btn-primary:hover {
    opacity: 0.9;
}
`
    }
  ],
  gscan: {
    rules_satisfied: ["GS010-PJ-VALID"],
    notes: "Uses Ghost native data-portal attributes for seamless checkout without third-party scripts."
  }
};

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
    <div class="gh-author-avatar-fallback w-20 h-20 rounded-full bg-muted text-foreground flex items-center justify-center font-bold text-2xl border-2 border-border shadow-sm">
        {{name.[0]}}
    </div>
    {{/if}}

    <div class="gh-author-details flex-1 text-center sm:text-left">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
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
            <span class="gh-author-location flex items-center gap-1">📍 {{location}}</span>
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
    box-sizing: border-box;
    font-family: inherit;
    font-size: 16px;
    line-height: 1.5;
    isolation: isolate;
    background-color: var(--card, #ffffff);
    color: var(--card-foreground, #09090b);
    border: 1px solid var(--border, #e4e4e7);
    border-radius: min(var(--radius, 0.5rem), 1.5rem);
    padding: 1.5rem;
    margin: 2rem auto;
    max-width: 42rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
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
    width: 5rem;
    height: 5rem;
    border-radius: 9999px;
    object-fit: cover;
    border: 2px solid var(--border, #e4e4e7);
}

.gh-author-avatar-fallback {
    width: 5rem;
    height: 5rem;
    border-radius: 9999px;
    background-color: var(--muted, #f4f4f5);
    color: var(--foreground, #09090b);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    border: 2px solid var(--border, #e4e4e7);
}

.gh-author-details {
    flex: 1;
    text-align: center;
}

@media (min-width: 640px) {
    .gh-author-details {
        text-align: left;
    }
}

.gh-author-name {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    margin: 0;
}

.gh-author-name a {
    color: var(--foreground, #09090b);
    text-decoration: none;
    transition: color 0.15s ease;
}

.gh-author-name a:hover {
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
    <a href="{{url}}" class="gh-post-card-image block aspect-video overflow-hidden bg-muted">
        <img src="{{img_url feature_image size="m"}}" alt="{{#if feature_image_alt}}{{feature_image_alt}}{{else}}{{title}}{{/if}}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
    </a>
    {{/if}}

    <div class="gh-post-card-content p-5 flex-1 flex flex-col justify-between">
        <div>
            <div class="flex items-center gap-2 mb-2 text-xs font-semibold">
                {{#if primary_tag}}
                <a href="{{primary_tag.url}}" class="gh-post-card-tag text-primary uppercase tracking-wider hover:underline">{{primary_tag.name}}</a>
                <span class="text-muted-foreground/40">&bull;</span>
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
            <div class="flex items-center gap-2 font-medium">
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
    box-sizing: border-box;
    font-family: inherit;
    font-size: 16px;
    line-height: 1.5;
    isolation: isolate;
    background-color: var(--card, #ffffff);
    color: var(--card-foreground, #09090b);
    border: 1px solid var(--border, #e4e4e7);
    border-radius: min(var(--radius, 0.5rem), 1.5rem);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.gh-post-card *,
.gh-post-card *::before,
.gh-post-card *::after {
    box-sizing: border-box;
}

.gh-post-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.gh-post-card-image {
    aspect-ratio: 16 / 9;
    overflow: hidden;
    display: block;
    background-color: var(--muted, #f4f4f5);
}

.gh-post-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.gh-post-card:hover .gh-post-card-image img {
    transform: scale(1.03);
}

.gh-post-card-content {
    padding: 1.25rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.gh-post-card-tag {
    color: var(--primary, var(--ghost-accent-color, #18181b));
    font-size: 0.75rem;
    font-weight: 600;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.gh-post-card-tag:hover {
    text-decoration: underline;
}

.gh-post-card-title {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    margin: 0.5rem 0;
    line-height: 1.35;
}

.gh-post-card-title a {
    color: var(--foreground, #09090b);
    text-decoration: none;
    transition: color 0.15s ease;
}

.gh-post-card-title a:hover {
    color: var(--primary, var(--ghost-accent-color, #18181b));
}

.gh-post-card-excerpt {
    color: var(--muted-foreground, #71717a);
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 1rem;
}

.gh-post-card-footer {
    padding-top: 1rem;
    border-top: 1px solid var(--border, #e4e4e7);
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--muted-foreground, #71717a);
}
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
      // Casper and other themes may change the root font size. Component
      // spacing follows each component's own 16px baseline instead.
      file.content = file.content.replace(/(-?\d*\.?\d+)rem\b/g, '$1em');
    }
  }
}

const allComponents = [newsletterForm, pricingTable, authorCard, postCard, ...coreComponents];
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

// 5. Generate registry/index.json
const index = [
  {
    name: "newsletter-form",
    description: "A native Ghost members subscription form with state handling.",
    category: "components:ui",
    ghost_version: ">=5.0.0",
    files: ["newsletter-form.hbs", "newsletter-form.css"]
  },
  {
    name: "pricing-table",
    description: "Membership tiers and pricing plans with native Ghost Portal checkout triggers.",
    category: "components:ui",
    ghost_version: ">=5.0.0",
    files: ["pricing-table.hbs", "pricing-table.css"]
  },
  {
    name: "author-card",
    description: "Author bio box featuring avatar, biography, social links, and post counts.",
    category: "components:ui",
    ghost_version: ">=5.0.0",
    files: ["author-card.hbs", "author-card.css"]
  },
  {
    name: "post-card",
    description: "Post preview card with feature image, primary tag, excerpt, and reading time.",
    category: "components:ui",
    ghost_version: ">=5.0.0",
    files: ["post-card.hbs", "post-card.css"]
  },
  ...coreComponents.map(component => ({
    name: component.name,
    description: component.description,
    category: component.type,
    ghost_version: component.ghost_version,
    files: component.files.map(file => file.name)
  }))
];

fs.writeFileSync(path.join(__dirname, '..', 'registry', 'index.json'), JSON.stringify(index, null, 2), 'utf8');
console.log('Created registry/index.json');
