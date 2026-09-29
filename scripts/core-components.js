const siteHeader = {
  name: 'site-header',
  type: 'components:layout',
  description: 'Responsive Ghost navigation with search, member actions, and an accessible mobile menu.',
  dependencies: [],
  ghost_version: '>=5.0.0',
  files: [
    {
      name: 'site-header.hbs',
      type: 'partial',
      target: 'partials/components/site-header.hbs',
      content: `{{!-- Component: Site Header | Usage: {{> "components/site-header"}} --}}
<header class="ghcn-header">
    <div class="ghcn-header__inner ghcn-container">
        <a class="ghcn-header__brand" href="{{@site.url}}" aria-label="{{@site.title}} home">
            {{#if @site.logo}}
                <img src="{{@site.logo}}" alt="{{@site.title}}" />
            {{else}}
                <span>{{@site.title}}</span>
            {{/if}}
        </a>

        <nav class="ghcn-header__nav" aria-label="Primary navigation">{{navigation}}</nav>

        <div class="ghcn-header__actions">
            {{search}}
            {{#if @member}}
                <a class="ghcn-button ghcn-button--outline" href="#/portal/account" data-portal="account">Account</a>
            {{else}}
                <a class="ghcn-header__signin" href="#/portal/signin" data-portal="signin">Sign in</a>
                <a class="ghcn-button" href="#/portal/signup" data-portal="signup">Subscribe</a>
            {{/if}}
        </div>

        <details class="ghcn-header__mobile">
            <summary class="ghcn-icon-button ghcn-button--outline" aria-label="Open navigation">
                <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </summary>
            <div class="ghcn-header__panel">
                <nav aria-label="Mobile navigation">{{navigation}}</nav>
                <div class="ghcn-header__mobile-actions">
                    {{search}}
                    {{#if @member}}
                        <a class="ghcn-button ghcn-button--outline" href="#/portal/account" data-portal="account">Account</a>
                    {{else}}
                        <a class="ghcn-button ghcn-button--outline" href="#/portal/signin" data-portal="signin">Sign in</a>
                        <a class="ghcn-button" href="#/portal/signup" data-portal="signup">Subscribe</a>
                    {{/if}}
                </div>
            </div>
        </details>
    </div>
</header>`
    },
    {
      name: 'site-header.css',
      type: 'style',
      target: 'assets/css/components/site-header.css',
      content: `/* ghostcn: Site Header */
.ghcn-header { box-sizing: border-box; position: relative; z-index: 30; border-bottom: 1px solid var(--border); color: var(--foreground); background: color-mix(in srgb, var(--background) 92%, transparent); font-family: inherit; font-size: 16px; line-height: 1.5; isolation: isolate; }
.ghcn-header *, .ghcn-header *::before, .ghcn-header *::after { box-sizing: border-box; }
.ghcn-header__inner { display: flex; min-height: 4.5rem; align-items: center; gap: 1.5rem; }
.ghcn-header__brand { display: inline-flex; flex: 0 0 auto; align-items: center; color: var(--foreground); font-size: 1.125rem; font-weight: 800; letter-spacing: -0.025em; text-decoration: none; }
.ghcn-header__brand img { display: block; width: auto; max-width: 11rem; max-height: 2.25rem; }
.ghcn-header__nav { min-width: 0; flex: 1; }
.ghcn-header .nav { display: flex; flex-wrap: wrap; align-items: center; gap: 1.25rem; margin: 0; padding: 0; list-style: none; }
.ghcn-header .nav a, .ghcn-header__signin { color: var(--muted-foreground); font-size: 0.875rem; font-weight: 600; text-decoration: none; }
.ghcn-header .nav a:hover, .ghcn-header .nav-current a, .ghcn-header__signin:hover { color: var(--foreground); }
.ghcn-header__actions { display: flex; align-items: center; gap: 0.75rem; }
.ghcn-header__actions .gh-search-icon { color: var(--foreground) !important; }
.ghcn-header__mobile { display: none; margin-left: auto; }
.ghcn-header__mobile summary { list-style: none; }
.ghcn-header__mobile summary::-webkit-details-marker { display: none; }
.ghcn-header__panel { position: absolute; top: calc(100% + 0.5rem); right: 1rem; left: 1rem; border: 1px solid var(--border); border-radius: min(var(--radius), 1rem); padding: 1rem; background: var(--popover); box-shadow: 0 1rem 2.5rem rgba(0,0,0,.14); }
.ghcn-header__panel .nav { align-items: stretch; flex-direction: column; gap: 0.25rem; }
.ghcn-header__panel .nav a { display: block; border-radius: var(--radius); padding: 0.625rem 0.75rem; }
.ghcn-header__panel .nav a:hover { background: var(--muted); }
.ghcn-header__mobile-actions { display: grid; grid-template-columns: auto 1fr 1fr; gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
@media (max-width: 800px) { .ghcn-header__nav, .ghcn-header__actions { display: none; } .ghcn-header__mobile { display: block; } }
`
    }
  ],
  gscan: { rules_satisfied: ['GS010-PJ-VALID'], notes: 'Uses Ghost navigation, search, member state, and Portal triggers.' }
};

const siteFooter = {
  name: 'site-footer',
  type: 'components:layout',
  description: 'Publication footer with secondary navigation, social links, and Ghost attribution.',
  dependencies: [],
  ghost_version: '>=5.0.0',
  files: [
    {
      name: 'site-footer.hbs', type: 'partial', target: 'partials/components/site-footer.hbs',
      content: `{{!-- Component: Site Footer | Usage: {{> "components/site-footer"}} --}}
<footer class="ghcn-footer">
    <div class="ghcn-footer__inner ghcn-container">
        <div class="ghcn-footer__brand">
            <a href="{{@site.url}}">{{@site.title}}</a>
            {{#if @site.description}}<p>{{@site.description}}</p>{{/if}}
        </div>
        <nav class="ghcn-footer__nav" aria-label="Footer navigation">{{navigation type="secondary"}}</nav>
        <div class="ghcn-footer__social">
            {{#if @site.facebook}}<a href="{{social_url type="facebook"}}" target="_blank" rel="noopener">Facebook</a>{{/if}}
            {{#if @site.twitter}}<a href="{{social_url type="twitter"}}" target="_blank" rel="noopener">X</a>{{/if}}
            <a href="{{@site.url}}/rss/">RSS</a>
        </div>
    </div>
    <div class="ghcn-footer__legal ghcn-container">
        <span>&copy; {{date format="YYYY"}} {{@site.title}}</span>
        <span>Published with <a href="https://ghost.org" target="_blank" rel="noopener">Ghost</a></span>
    </div>
</footer>`
    },
    {
      name: 'site-footer.css', type: 'style', target: 'assets/css/components/site-footer.css',
      content: `/* ghostcn: Site Footer */
.ghcn-footer { box-sizing: border-box; border-top: 1px solid var(--border); color: var(--foreground); background: var(--card); font-family: inherit; font-size: 16px; line-height: 1.5; isolation: isolate; }
.ghcn-footer *, .ghcn-footer *::before, .ghcn-footer *::after { box-sizing: border-box; }
.ghcn-footer__inner { display: grid; grid-template-columns: minmax(0,1.4fr) minmax(0,1fr) auto; gap: 3rem; padding-block: 3rem; }
.ghcn-footer__brand a { color: var(--foreground); font-size: 1.125rem; font-weight: 800; text-decoration: none; }
.ghcn-footer__brand p { max-width: 30rem; margin: 0.5rem 0 0; color: var(--muted-foreground); font-size: 0.875rem; }
.ghcn-footer .nav { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 0.5rem 1.5rem; margin: 0; padding: 0; list-style: none; }
.ghcn-footer a { color: var(--muted-foreground); font-size: 0.875rem; text-decoration: none; }
.ghcn-footer a:hover { color: var(--foreground); }
.ghcn-footer__social { display: flex; flex-direction: column; gap: 0.5rem; }
.ghcn-footer__legal { display: flex; justify-content: space-between; gap: 1rem; border-top: 1px solid var(--border); padding-block: 1.25rem; color: var(--muted-foreground); font-size: 0.75rem; }
@media (max-width: 720px) { .ghcn-footer__inner { grid-template-columns: 1fr; gap: 2rem; } .ghcn-footer__social { flex-direction: row; flex-wrap: wrap; } }
@media (max-width: 480px) { .ghcn-footer__legal { align-items: flex-start; flex-direction: column; } }
`
    }
  ],
  gscan: { rules_satisfied: ['GS010-PJ-VALID'], notes: 'Uses Ghost secondary navigation and site globals.' }
};

const featuredPosts = {
  name: 'featured-posts',
  type: 'components:content',
  description: 'Responsive homepage hero populated from Ghost featured posts.',
  dependencies: [], ghost_version: '>=5.0.0',
  files: [
    {
      name: 'featured-posts.hbs', type: 'partial', target: 'partials/components/featured-posts.hbs',
      content: `{{!-- Component: Featured Posts | Usage: {{> "components/featured-posts"}} --}}
{{#get "posts" filter="featured:true" limit="3" include="authors,tags"}}
{{#if posts}}
<section class="ghcn-featured ghcn-container" aria-labelledby="ghcn-featured-title">
    <div class="ghcn-featured__heading">
        <div><span class="ghcn-badge">Featured</span><h2 id="ghcn-featured-title">Editor’s picks</h2></div>
        <a href="{{@site.url}}">View all posts <span aria-hidden="true">&rarr;</span></a>
    </div>
    <div class="ghcn-featured__grid">
        {{#foreach posts}}
        <article class="ghcn-featured__card{{#has index="0"}} ghcn-featured__card--lead{{/has}}">
            <a class="ghcn-featured__image" href="{{url}}">
                {{#if feature_image}}<img src="{{img_url feature_image size="l"}}" alt="{{#if feature_image_alt}}{{feature_image_alt}}{{else}}{{title}}{{/if}}" loading="{{#has index="0"}}eager{{else}}lazy{{/has}}" />{{/if}}
            </a>
            <div class="ghcn-featured__content">
                <div class="ghcn-featured__meta">{{#if primary_tag}}<a href="{{primary_tag.url}}">{{primary_tag.name}}</a><span>&bull;</span>{{/if}}<span>{{reading_time}}</span></div>
                <h3><a href="{{url}}">{{title}}</a></h3>
                {{#has index="0"}}{{#if excerpt}}<p>{{excerpt words="30"}}</p>{{/if}}{{/has}}
            </div>
        </article>
        {{/foreach}}
    </div>
</section>
{{/if}}
{{/get}}`
    },
    {
      name: 'featured-posts.css', type: 'style', target: 'assets/css/components/featured-posts.css',
      content: `/* ghostcn: Featured Posts */
.ghcn-featured { box-sizing: border-box; margin-block: 3rem; color: var(--foreground); font-family: inherit; font-size: 16px; line-height: 1.5; isolation: isolate; }
.ghcn-featured *, .ghcn-featured *::before, .ghcn-featured *::after { box-sizing: border-box; }
.ghcn-featured__heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
.ghcn-featured__heading h2 { margin: 0.75rem 0 0; font-size: clamp(1.75rem,4vw,2.5rem); line-height: 1.05; letter-spacing: -0.04em; }
.ghcn-featured__heading > a { color: var(--muted-foreground); font-size: 0.875rem; font-weight: 600; text-decoration: none; }
.ghcn-featured__grid { display: grid; grid-template-columns: minmax(0,2fr) minmax(15rem,1fr); gap: 1rem; }
.ghcn-featured__card { position: relative; min-height: 15rem; overflow: hidden; border-radius: min(var(--radius),1.25rem); background: var(--muted); }
.ghcn-featured__card--lead { grid-row: span 2; min-height: 31rem; }
.ghcn-featured__image, .ghcn-featured__image::after { position: absolute; inset: 0; }
.ghcn-featured__image::after { content: ""; background: linear-gradient(to top,rgba(0,0,0,.82),rgba(0,0,0,.02) 70%); }
.ghcn-featured__image img { width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease; }
.ghcn-featured__card:hover img { transform: scale(1.025); }
.ghcn-featured__content { position: absolute; right: 0; bottom: 0; left: 0; z-index: 1; padding: 1.25rem; color: #fff; }
.ghcn-featured__card--lead .ghcn-featured__content { padding: 2rem; }
.ghcn-featured__meta { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; color: rgba(255,255,255,.78); font-size: 0.75rem; }
.ghcn-featured__meta a, .ghcn-featured h3 a { color: inherit; text-decoration: none; }
.ghcn-featured h3 { margin: 0; font-size: 1.25rem; line-height: 1.15; letter-spacing: -0.025em; }
.ghcn-featured__card--lead h3 { font-size: clamp(1.75rem,4vw,3rem); }
.ghcn-featured__content p { max-width: 42rem; margin: 0.75rem 0 0; color: rgba(255,255,255,.82); }
@media (max-width: 720px) { .ghcn-featured__grid { grid-template-columns: 1fr; } .ghcn-featured__card--lead { grid-row: auto; min-height: 25rem; } }
`
    }
  ],
  gscan: { rules_satisfied: ['GS010-PJ-VALID'], notes: 'Uses the Ghost get helper and featured post filter.' }
};

const pagination = {
  name: 'pagination',
  type: 'components:navigation',
  description: 'Accessible, responsive replacement for Ghost’s native pagination markup.',
  dependencies: [], ghost_version: '>=5.0.0',
  files: [
    {
      name: 'pagination.hbs', type: 'partial', target: 'partials/pagination.hbs', placement: 'theme',
      content: `<nav class="ghcn-pagination" role="navigation" aria-label="Pagination">
    <div class="ghcn-pagination__side">{{#if prev}}<a class="ghcn-button ghcn-button--outline" href="{{page_url prev}}" rel="prev"><span aria-hidden="true">&larr;</span> Newer</a>{{/if}}</div>
    <span class="ghcn-pagination__status">Page <strong>{{page}}</strong> of <strong>{{pages}}</strong></span>
    <div class="ghcn-pagination__side ghcn-pagination__side--end">{{#if next}}<a class="ghcn-button ghcn-button--outline" href="{{page_url next}}" rel="next">Older <span aria-hidden="true">&rarr;</span></a>{{/if}}</div>
</nav>`
    },
    {
      name: 'pagination.css', type: 'style', target: 'assets/css/components/pagination.css',
      content: `/* ghostcn: Pagination */
.ghcn-pagination { box-sizing: border-box; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 1rem; width: min(100% - 2rem,72rem); margin: 3rem auto; color: var(--foreground); font-family: inherit; font-size: 16px; line-height: 1.5; isolation: isolate; }
.ghcn-pagination *, .ghcn-pagination *::before, .ghcn-pagination *::after { box-sizing: border-box; }
.ghcn-pagination__side { display: flex; }
.ghcn-pagination__side--end { justify-content: flex-end; }
.ghcn-pagination__status { color: var(--muted-foreground); font-size: 0.8125rem; }
@media (max-width: 480px) { .ghcn-pagination { grid-template-columns: 1fr 1fr; } .ghcn-pagination__status { grid-column: 1 / -1; grid-row: 1; text-align: center; } }
`
    }
  ],
  gscan: { rules_satisfied: ['GS010-PJ-VALID'], notes: 'Installs as partials/pagination.hbs so the native pagination helper uses it.' }
};

const postHeader = {
  name: 'post-header',
  type: 'components:content',
  description: 'Editorial post heading with tags, author metadata, reading time, and responsive feature image.',
  dependencies: [], ghost_version: '>=5.0.0',
  files: [
    {
      name: 'post-header.hbs', type: 'partial', target: 'partials/components/post-header.hbs',
      content: `{{!-- Component: Post Header | Usage: inside {{#post}} --}}
<header class="ghcn-post-header ghcn-container">
    {{#if primary_tag}}<a class="ghcn-badge" href="{{primary_tag.url}}">{{primary_tag.name}}</a>{{/if}}
    <h1>{{title}}</h1>
    {{#if custom_excerpt}}<p class="ghcn-post-header__excerpt">{{custom_excerpt}}</p>{{/if}}
    <div class="ghcn-post-header__meta">
        {{#primary_author}}
            <a class="ghcn-post-header__author" href="{{url}}">
                {{#if profile_image}}<img class="ghcn-avatar" src="{{img_url profile_image size="xs"}}" alt="" />{{/if}}
                <span>{{name}}</span>
            </a>
        {{/primary_author}}
        <span aria-hidden="true">&bull;</span>
        <time datetime="{{date format="YYYY-MM-DD"}}">{{date format="D MMM YYYY"}}</time>
        <span aria-hidden="true">&bull;</span>
        <span>{{reading_time}}</span>
    </div>
    {{#if feature_image}}
        <figure class="ghcn-post-header__media">
            <img srcset="{{img_url feature_image size="s"}} 400w, {{img_url feature_image size="m"}} 750w, {{img_url feature_image size="l"}} 1200w, {{img_url feature_image size="xl"}} 2000w" sizes="(min-width: 1200px) 1120px, 92vw" src="{{img_url feature_image size="xl"}}" alt="{{#if feature_image_alt}}{{feature_image_alt}}{{else}}{{title}}{{/if}}" />
            {{#if feature_image_caption}}<figcaption>{{feature_image_caption}}</figcaption>{{/if}}
        </figure>
    {{/if}}
</header>`
    },
    {
      name: 'post-header.css', type: 'style', target: 'assets/css/components/post-header.css',
      content: `/* ghostcn: Post Header */
.ghcn-post-header { box-sizing: border-box; margin-block: 4rem 2.5rem; color: var(--foreground); text-align: center; font-family: inherit; font-size: 16px; line-height: 1.5; isolation: isolate; }
.ghcn-post-header *, .ghcn-post-header *::before, .ghcn-post-header *::after { box-sizing: border-box; }
.ghcn-post-header h1 { max-width: 58rem; margin: 1rem auto; font-size: clamp(2.5rem,7vw,5rem); line-height: 0.98; letter-spacing: -0.055em; text-wrap: balance; }
.ghcn-post-header__excerpt { max-width: 44rem; margin: 1.25rem auto; color: var(--muted-foreground); font-size: clamp(1.05rem,2vw,1.25rem); }
.ghcn-post-header__meta, .ghcn-post-header__author { display: flex; align-items: center; justify-content: center; gap: 0.625rem; }
.ghcn-post-header__meta { flex-wrap: wrap; color: var(--muted-foreground); font-size: 0.8125rem; }
.ghcn-post-header__author { color: var(--foreground); font-weight: 700; text-decoration: none; }
.ghcn-post-header__author .ghcn-avatar { width: 2rem; height: 2rem; }
.ghcn-post-header__media { margin: 3rem 0 0; }
.ghcn-post-header__media img { display: block; width: 100%; max-height: 44rem; border-radius: min(var(--radius),1.25rem); object-fit: cover; }
.ghcn-post-header__media figcaption { margin-top: 0.75rem; color: var(--muted-foreground); font-size: 0.75rem; }
`
    }
  ],
  gscan: { rules_satisfied: ['GS010-PJ-VALID'], notes: 'Uses native post, author, image, tag, date, and reading-time data.' }
};

const memberCta = {
  name: 'member-cta',
  type: 'components:members',
  description: 'Context-aware member CTA for visitors, free members, paid members, and protected posts.',
  dependencies: [], ghost_version: '>=5.0.0',
  files: [
    {
      name: 'member-cta.hbs', type: 'partial', target: 'partials/components/member-cta.hbs',
      content: `{{!-- Component: Member CTA | Usage: inside {{#post}} after {{content}} --}}
<aside class="ghcn-member-cta">
    {{#if access}}
        {{#if @member}}
            <span class="ghcn-badge">Member access</span>
            <h2>You’re all caught up</h2>
            <p>Manage your subscription, email preferences, and account details in Portal.</p>
            <a class="ghcn-button ghcn-button--outline" href="#/portal/account" data-portal="account">Manage account</a>
        {{else}}
            <span class="ghcn-badge">Join the publication</span>
            <h2>Enjoying this story?</h2>
            <p>Subscribe for new posts and member updates delivered directly to your inbox.</p>
            <div class="ghcn-member-cta__actions"><a class="ghcn-button" href="#/portal/signup" data-portal="signup">Subscribe</a><a class="ghcn-button ghcn-button--ghost" href="#/portal/signin" data-portal="signin">Sign in</a></div>
        {{/if}}
    {{else}}
        {{#if @member.paid}}
            <span class="ghcn-badge">Account required</span>
            <h2>This post isn’t included in your plan</h2>
            <p>Open your account to review your membership and available plans.</p>
            <a class="ghcn-button" href="#/portal/account/plans" data-portal="account/plans">View plans</a>
        {{else if @member}}
            <span class="ghcn-badge">Paid members</span>
            <h2>Upgrade to continue reading</h2>
            <p>Become a paid member to unlock this post and the complete archive.</p>
            <a class="ghcn-button" href="#/portal/account/plans" data-portal="account/plans">Upgrade membership</a>
        {{else}}
            <span class="ghcn-badge">Members only</span>
            <h2>Continue reading with a membership</h2>
            <p>Sign up to unlock this post. Already a member? Sign in to continue.</p>
            <div class="ghcn-member-cta__actions"><a class="ghcn-button" href="#/portal/signup" data-portal="signup">Become a member</a><a class="ghcn-button ghcn-button--outline" href="#/portal/signin" data-portal="signin">Sign in</a></div>
        {{/if}}
    {{/if}}
</aside>`
    },
    {
      name: 'member-cta.css', type: 'style', target: 'assets/css/components/member-cta.css',
      content: `/* ghostcn: Member CTA */
.ghcn-member-cta { box-sizing: border-box; max-width: 44rem; margin: 3rem auto; overflow: hidden; border: 1px solid var(--border); border-radius: min(var(--radius),1.25rem); padding: clamp(1.5rem,5vw,3rem); color: var(--card-foreground); background: radial-gradient(circle at top right,color-mix(in srgb,var(--primary) 18%,transparent),transparent 48%),var(--card); text-align: center; font-family: inherit; font-size: 16px; line-height: 1.5; isolation: isolate; }
.ghcn-member-cta *, .ghcn-member-cta *::before, .ghcn-member-cta *::after { box-sizing: border-box; }
.ghcn-member-cta h2 { margin: 1rem 0 0.625rem; color: var(--foreground); font-size: clamp(1.5rem,4vw,2.25rem); line-height: 1.1; letter-spacing: -0.035em; }
.ghcn-member-cta p { max-width: 34rem; margin: 0 auto 1.5rem; color: var(--muted-foreground); }
.ghcn-member-cta__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; }
`
    }
  ],
  gscan: { rules_satisfied: ['GS010-PJ-VALID'], notes: 'Uses post access, member state, paid status, and native Portal triggers.' }
};

module.exports = [siteHeader, siteFooter, featuredPosts, pagination, postHeader, memberCta];
