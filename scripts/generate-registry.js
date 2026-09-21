const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '..', 'registry', 'components');
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

// 1. pricing-table
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
<section class="gh-pricing bg-white py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto my-8">
    <div class="text-center mb-10">
        <h2 class="gh-pricing-title text-3xl font-extrabold text-slate-900 mb-3">{{#if title}}{{title}}{{else}}Choose the right plan for you{{/if}}</h2>
        <p class="gh-pricing-desc text-slate-600 max-w-xl mx-auto">{{#if description}}{{description}}{{else}}Unlock unlimited access to exclusive content, newsletters, and community discussions.{{/if}}</p>
    </div>

    <div class="gh-pricing-grid grid grid-cols-1 md:grid-cols-3 gap-8">
        {{!-- Free Tier --}}
        <div class="gh-pricing-card border border-slate-200 rounded-2xl p-6 bg-slate-50 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
                <h3 class="text-xl font-bold text-slate-900 mb-2">Free</h3>
                <p class="text-slate-500 text-sm mb-4">Preview public posts</p>
                <div class="text-3xl font-extrabold text-slate-900 mb-6">$0 <span class="text-sm font-normal text-slate-500">/ forever</span></div>
                <ul class="space-y-3 text-sm text-slate-600 mb-6">
                    <li class="flex items-center gap-2"><span>&#10003;</span> Access to public posts</li>
                    <li class="flex items-center gap-2"><span>&#10003;</span> Regular email newsletters</li>
                </ul>
            </div>
            <a href="#/portal/signup/free" data-portal="signup/free" class="gh-pricing-btn block w-full text-center py-2.5 px-4 rounded-lg font-medium border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 transition-colors">
                Sign up free
            </a>
        </div>

        {{!-- Monthly Tier (Featured) --}}
        <div class="gh-pricing-card gh-pricing-card-featured border-2 border-indigo-600 rounded-2xl p-6 bg-white flex flex-col justify-between shadow-lg relative">
            <span class="gh-pricing-badge absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>
            <div>
                <h3 class="text-xl font-bold text-slate-900 mb-2">Monthly</h3>
                <p class="text-slate-500 text-sm mb-4">Full access billed monthly</p>
                <div class="text-3xl font-extrabold text-indigo-600 mb-6">$5 <span class="text-sm font-normal text-slate-500">/ month</span></div>
                <ul class="space-y-3 text-sm text-slate-600 mb-6">
                    <li class="flex items-center gap-2"><span>&#10003;</span> Full archive access</li>
                    <li class="flex items-center gap-2"><span>&#10003;</span> Member-only newsletter</li>
                    <li class="flex items-center gap-2"><span>&#10003;</span> Member community comments</li>
                </ul>
            </div>
            <a href="#/portal/signup/monthly" data-portal="signup/monthly" class="gh-pricing-btn gh-pricing-btn-primary block w-full text-center py-2.5 px-4 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm">
                Subscribe monthly
            </a>
        </div>

        {{!-- Annual Tier --}}
        <div class="gh-pricing-card border border-slate-200 rounded-2xl p-6 bg-slate-50 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
                <h3 class="text-xl font-bold text-slate-900 mb-2">Annual</h3>
                <p class="text-slate-500 text-sm mb-4">Save 20% with annual billing</p>
                <div class="text-3xl font-extrabold text-slate-900 mb-6">$48 <span class="text-sm font-normal text-slate-500">/ year</span></div>
                <ul class="space-y-3 text-sm text-slate-600 mb-6">
                    <li class="flex items-center gap-2"><span>&#10003;</span> Everything in Monthly</li>
                    <li class="flex items-center gap-2"><span>&#10003;</span> 2 months free</li>
                    <li class="flex items-center gap-2"><span>&#10003;</span> VIP priority support</li>
                </ul>
            </div>
            <a href="#/portal/signup/yearly" data-portal="signup/yearly" class="gh-pricing-btn block w-full text-center py-2.5 px-4 rounded-lg font-medium border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 transition-colors">
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
      content: `/* Ghost UI: Pricing Table Styles (Vanilla CSS fallback) */
.gh-pricing {
    max-width: 64rem;
    margin: 2rem auto;
    padding: 2rem 1rem;
}

.gh-pricing-title {
    font-size: 1.875rem;
    font-weight: 800;
    text-align: center;
    color: var(--ghost-heading-color, #0f172a);
    margin-bottom: 0.75rem;
}

.gh-pricing-desc {
    text-align: center;
    color: var(--ghost-text-muted, #475569);
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
    border: 1px solid var(--ghost-border, #e2e8f0);
    border-radius: 1rem;
    padding: 1.5rem;
    background-color: var(--ghost-card-bg, #f8fafc);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
}

.gh-pricing-card-featured {
    border: 2px solid var(--ghost-accent-color, #4f46e5);
    background-color: #ffffff;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.gh-pricing-badge {
    position: absolute;
    top: -0.75rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--ghost-accent-color, #4f46e5);
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
}

.gh-pricing-btn {
    display: block;
    width: 100%;
    text-align: center;
    padding: 0.625rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    text-decoration: none;
    border: 1px solid #cbd5e1;
    color: #334155;
    background-color: #ffffff;
    margin-top: 1.5rem;
    transition: background-color 0.15s ease;
}

.gh-pricing-btn:hover {
    background-color: #f1f5f9;
}

.gh-pricing-btn-primary {
    background-color: var(--ghost-accent-color, #4f46e5);
    border-color: var(--ghost-accent-color, #4f46e5);
    color: #ffffff;
}

.gh-pricing-btn-primary:hover {
    opacity: 0.9;
}`
    }
  ],
  gscan: {
    rules_satisfied: ["GS010-PJ-VALID"],
    notes: "Uses Ghost native data-portal attributes for seamless checkout without third-party scripts."
  }
};

// 2. author-card
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
<section class="gh-author-card bg-slate-50 border border-slate-200 rounded-xl p-6 my-8 max-w-2xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-5">
    {{#if profile_image}}
    <img src="{{img_url profile_image size="m"}}" alt="{{name}}" class="gh-author-avatar w-20 h-20 rounded-full object-cover border-2 border-white shadow" />
    {{else}}
    <div class="gh-author-avatar-fallback w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-2xl border-2 border-white shadow">
        {{name.[0]}}
    </div>
    {{/if}}

    <div class="gh-author-details flex-1 text-center sm:text-left">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h4 class="gh-author-name text-xl font-bold text-slate-900">
                <a href="{{url}}" class="hover:text-indigo-600 transition-colors">{{name}}</a>
            </h4>
            {{#if count.posts}}
            <span class="gh-author-post-count text-xs text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full font-medium">
                {{plural count.posts empty="0 posts" singular="% post" plural="% posts"}}
            </span>
            {{/if}}
        </div>

        {{#if bio}}
        <p class="gh-author-bio text-slate-600 text-sm mb-4 leading-relaxed">{{bio}}</p>
        {{/if}}

        <div class="gh-author-meta flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500">
            {{#if location}}
            <span class="gh-author-location flex items-center gap-1">?? {{location}}</span>
            {{/if}}
            {{#if website}}
            <a href="{{website}}" target="_blank" rel="noopener noreferrer" class="gh-author-link text-indigo-600 hover:underline">Website</a>
            {{/if}}
            {{#if twitter_url}}
            <a href="{{twitter_url}}" target="_blank" rel="noopener noreferrer" class="gh-author-link text-indigo-600 hover:underline">Twitter/X</a>
            {{/if}}
            {{#if facebook_url}}
            <a href="{{facebook_url}}" target="_blank" rel="noopener noreferrer" class="gh-author-link text-indigo-600 hover:underline">Facebook</a>
            {{/if}}
        </div>
    </div>
</section>`
    },
    {
      name: "author-card.css",
      type: "style",
      target: "assets/css/components/author-card.css",
      content: `/* Ghost UI: Author Card Styles (Vanilla CSS fallback) */
.gh-author-card {
    background-color: var(--ghost-card-bg, #f8fafc);
    border: 1px solid var(--ghost-border, #e2e8f0);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin: 2rem auto;
    max-width: 42rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
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
    border: 2px solid #ffffff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.gh-author-avatar-fallback {
    width: 5rem;
    height: 5rem;
    border-radius: 9999px;
    background-color: #e0e7ff;
    color: #4f46e5;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
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
    margin: 0;
}

.gh-author-name a {
    color: var(--ghost-heading-color, #0f172a);
    text-decoration: none;
}

.gh-author-name a:hover {
    color: var(--ghost-accent-color, #4f46e5);
}

.gh-author-bio {
    color: var(--ghost-text-muted, #475569);
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0.5rem 0 1rem;
}

.gh-author-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.75rem;
    color: #64748b;
}

.gh-author-meta a {
    color: var(--ghost-accent-color, #4f46e5);
    text-decoration: none;
}

.gh-author-meta a:hover {
    text-decoration: underline;
}`
    }
  ],
  gscan: {
    rules_satisfied: ["GS010-PJ-VALID"],
    notes: "Uses standard Ghost author helpers (profile_image, img_url, plural, url, bio)."
  }
};

// 3. post-card
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
<article class="gh-post-card group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col">
    {{#if feature_image}}
    <a href="{{url}}" class="gh-post-card-image block aspect-video overflow-hidden bg-slate-100">
        <img src="{{img_url feature_image size="m"}}" alt="{{#if feature_image_alt}}{{feature_image_alt}}{{else}}{{title}}{{/if}}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
    </a>
    {{/if}}

    <div class="gh-post-card-content p-5 flex-1 flex flex-col justify-between">
        <div>
            <div class="flex items-center gap-2 mb-2 text-xs font-semibold">
                {{#if primary_tag}}
                <a href="{{primary_tag.url}}" class="gh-post-card-tag text-indigo-600 uppercase tracking-wider hover:underline">{{primary_tag.name}}</a>
                <span class="text-slate-300">&bull;</span>
                {{/if}}
                <span class="gh-post-card-reading-time text-slate-500">{{reading_time}}</span>
            </div>

            <h3 class="gh-post-card-title text-xl font-bold text-slate-900 mb-2 leading-snug group-hover:text-indigo-600 transition-colors">
                <a href="{{url}}">{{title}}</a>
            </h3>

            {{#if excerpt}}
            <p class="gh-post-card-excerpt text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">{{excerpt words="25"}}</p>
            {{/if}}
        </div>

        <div class="gh-post-card-footer pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div class="flex items-center gap-2">
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
      content: `/* Ghost UI: Post Card Styles (Vanilla CSS fallback) */
.gh-post-card {
    background-color: var(--ghost-card-bg, #ffffff);
    border: 1px solid var(--ghost-border, #e2e8f0);
    border-radius: 0.75rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.gh-post-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.gh-post-card-image {
    aspect-ratio: 16 / 9;
    overflow: hidden;
    display: block;
    background-color: #f1f5f9;
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
    color: var(--ghost-accent-color, #4f46e5);
    font-size: 0.75rem;
    font-weight: 600;
    text-decoration: none;
    text-transform: uppercase;
}

.gh-post-card-tag:hover {
    text-decoration: underline;
}

.gh-post-card-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0.5rem 0;
    line-height: 1.35;
}

.gh-post-card-title a {
    color: var(--ghost-heading-color, #0f172a);
    text-decoration: none;
}

.gh-post-card-title a:hover {
    color: var(--ghost-accent-color, #4f46e5);
}

.gh-post-card-excerpt {
    color: var(--ghost-text-muted, #475569);
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 1rem;
}

.gh-post-card-footer {
    padding-top: 1rem;
    border-top: 1px solid var(--ghost-border, #f1f5f9);
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #64748b;
}`
    }
  ],
  gscan: {
    rules_satisfied: ["GS010-PJ-VALID"],
    notes: "Uses standard Ghost post helpers (feature_image, primary_tag, reading_time, excerpt, date)."
  }
};

fs.writeFileSync(path.join(componentsDir, 'pricing-table.json'), JSON.stringify(pricingTable, null, 2), 'utf8');
console.log('Created pricing-table.json');

fs.writeFileSync(path.join(componentsDir, 'author-card.json'), JSON.stringify(authorCard, null, 2), 'utf8');
console.log('Created author-card.json');

fs.writeFileSync(path.join(componentsDir, 'post-card.json'), JSON.stringify(postCard, null, 2), 'utf8');
console.log('Created post-card.json');

// 4. Generate registry/index.json
const index = [
  {
    name: "newsletter-form",
    description: "A native Ghost members subscription form.",
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
  }
];

fs.writeFileSync(path.join(__dirname, '..', 'registry', 'index.json'), JSON.stringify(index, null, 2), 'utf8');
console.log('Created registry/index.json');
