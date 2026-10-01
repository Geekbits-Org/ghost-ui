// Isolated release smoke test. Nothing is installed into or activated on the user's Ghost site.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(repo, 'packages/cli/package.json'));
const { scaffoldTheme, REQUIRED_STARTER_COMPONENTS } = require('./dist/utils/theme-scaffold');
const { initializeThemeProject, buildGhostcnConfig } = require('./dist/utils/theme-project');
const { installComponent } = require('./dist/utils/component-installer');
const Handlebars = require('handlebars');
const args = process.argv.slice(2);
const ghostRoot = args.includes('--ghost-root') ? path.resolve(args[args.indexOf('--ghost-root') + 1]) : undefined;
// Optional live, public post for exercising Ghost's actual comments iframe.
// Only the preview HTML/styles change; no Ghost settings or post data are written.
const commentsUrl = args.includes('--comments-url') ? new URL(args[args.indexOf('--comments-url') + 1]) : undefined;
let commentsHtml;
if (commentsUrl) {
    const response = await fetch(commentsUrl);
    if (!response.ok) throw new Error(`Comments preview post returned HTTP ${response.status}`);
    commentsHtml = await response.text();
    if (!commentsHtml.includes('data-ghost-comments=')) throw new Error('Choose a public post with comments enabled.');
}
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-release-'));
const roots = {};
const components = [...REQUIRED_STARTER_COMPONENTS, 'newsletter-form', 'author-card', 'pricing-table'];
const run = (cmd, argv, cwd) => {
    const result = spawnSync(cmd, argv, { cwd, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || result.error?.message);
    if (argv.some(value => value.endsWith('gscan/bin/cli.js')) && /Your theme has.*(?:warning|error)/i.test(result.stdout)) throw new Error(result.stdout);
    console.log(result.stdout.trim());
};
for (const style of ['css', 'tailwind']) {
    const { themeRoot } = scaffoldTheme({ parentDirectory: temporary, themeName: `${style}-release`, style, colorScheme: 'Auto', packageManager: 'npm', includeNewsletter: true, includeAuthorCard: true, includePricing: true });
    roots[style] = themeRoot;
    const config = buildGhostcnConfig({ style, baseColor: 'zinc', accentColor: 'violet', radius: '0.5rem' });
    initializeThemeProject({ themeRoot, config });
    for (const componentName of components) await installComponent({ themeRoot, config, componentName });
    if (style === 'tailwind') {
        const tailwindRoot = path.dirname(require.resolve('tailwindcss/package.json'));
        fs.mkdirSync(path.join(themeRoot, 'node_modules'));
        fs.symlinkSync(tailwindRoot, path.join(themeRoot, 'node_modules/tailwindcss'), 'junction');
        fs.appendFileSync(path.join(themeRoot, 'index.hbs'), '<button class="ghcn-button bg-purple-600 hover:bg-purple-700 text-white px-8 rounded-xl dark:bg-purple-400">Override test</button>');
        run(process.execPath, [path.join(path.dirname(require.resolve('@tailwindcss/cli/package.json')), 'dist/index.mjs'), '-i', './assets/css/source.css', '-o', './assets/built/screen.css', '--minify'], themeRoot);
    } else run(process.execPath, ['./scripts/build.mjs'], themeRoot);
    run(process.execPath, ['./scripts/check.mjs'], themeRoot);
    run(process.execPath, ['./scripts/zip.mjs'], themeRoot);
    if (ghostRoot) {
        const gscan = path.join(ghostRoot, 'node_modules/gscan/bin/cli.js');
        run(process.execPath, [gscan, themeRoot, '--v6'], repo);
        run(process.execPath, [gscan, path.join(themeRoot, `dist/${style}-release-1.0.0.zip`), '-z', '--v6'], repo);
    }
}
if (ghostRoot) {
    const casperRoot = path.join(temporary, 'casper-install');
    fs.cpSync(path.join(ghostRoot, 'content/themes/casper'), casperRoot, { recursive: true, filter: source => !['node_modules', '.git'].includes(path.basename(source)) });
    const config = buildGhostcnConfig({ style: 'css', baseColor: 'zinc', accentColor: 'ghost', radius: '0.5rem' });
    initializeThemeProject({ themeRoot: casperRoot, config });
    for (const componentName of components) await installComponent({ themeRoot: casperRoot, config, componentName, overwrite: true });
    run(process.execPath, [path.join(repo, 'packages/cli/dist/index.js'), 'doctor'], casperRoot);
    run(process.execPath, [path.join(ghostRoot, 'node_modules/gscan/bin/cli.js'), casperRoot, '--v6'], repo);
}
console.log(`Isolated themes: ${temporary}`);
if (!args.includes('--serve')) {
    fs.rmSync(temporary, { recursive: true, force: true });
    process.exit(0);
}
const hbs = Handlebars.create();
const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750"><defs><linearGradient id="g"><stop stop-color="#6d28d9"/><stop offset="1" stop-color="#f97316"/></linearGradient></defs><path fill="url(#g)" d="M0 0h1200v750H0z"/><circle fill="#fff" opacity=".15" cx="900" cy="350" r="250"/></svg>');
const post = { title: 'A publication built to feel like yours', url: '/story/', access: true, feature_image: image, excerpt: 'Thoughtful stories, practical ideas, and a home for your community.', custom_excerpt: 'An editorial starter that you can shape with your own colors, spacing, and typography.', primary_tag: { name: 'Design', url: '/tag/design/' }, primary_author: { name: 'Jamie Reader', bio: 'Writing about design and technology.', url: '/author/jamie/', profile_image: image }, authors: [], html: '<p>This is a public preview of a story. Protected content stays under Ghost access control.</p>' };
const posts = [post, { ...post, title: 'Small details make the difference' }, { ...post, title: 'A clearer path from idea to publication' }];
hbs.registerHelper('foreach', function (items, options) { return items.map((item, index) => options.fn(item, { data: { ...options.data, index } })).join(''); });
hbs.registerHelper('get', function (resource, options) {
    return options.fn(resource === 'tiers' ? { tiers: [
        { id: 'free', type: 'free', name: 'Reader', benefits: ['Weekly dispatch'] },
        { id: 'premium', type: 'paid', name: 'Supporter', currency: 'EUR', monthly_price: 1234, yearly_price: 9900, benefits: ['Member essays', 'Discussion access'] }
    ] } : { posts }, { data: options.data });
});
hbs.registerHelper('match', function (value, expected, options) { return value === expected ? options.fn(this) : options.inverse(this); });
hbs.registerHelper('has', function (options) { return String(options.data?.index) === options.hash.index ? options.fn(this) : options.inverse(this); });
hbs.registerHelper('primary_author', function (options) { return options.fn(this.primary_author, { data: options.data }); });
hbs.registerHelper('img_url', value => value);
hbs.registerHelper('url', function () { return this.url; });
hbs.registerHelper('excerpt', function () { return this.excerpt; });
hbs.registerHelper('reading_time', () => '4 min read');
hbs.registerHelper('date', options => options.hash.format === 'YYYY' ? '2026' : options.hash.format === 'YYYY-MM-DD' ? '2026-10-01' : '1 Oct 2026');
hbs.registerHelper('social_url', () => '#');
hbs.registerHelper('page_url', value => `/page/${value}/`);
hbs.registerHelper('navigation', () => new hbs.SafeString('<ul class="nav"><li class="nav-current"><a href="/">Home</a></li><li><a href="/about/">About</a></li><li><a href="/archive/">Archive</a></li></ul>'));
hbs.registerHelper('search', ghostRoot ? require(path.join(ghostRoot, 'core/frontend/helpers/search.js')) : () => new hbs.SafeString('<button class="ghcn-icon-button ghcn-button--ghost" aria-label="Search">⌕</button>'));
hbs.registerHelper('price', ghostRoot ? require(path.join(ghostRoot, 'core/frontend/helpers/price.js')) : (amount, options) => new Intl.NumberFormat('en', { style: 'currency', currency: options.hash.currency }).format(amount / 100));
function render(style, state, scheme, host, formState) {
    const root = roots[style];
    for (const component of components) {
        const file = component === 'pagination' ? 'partials/pagination.hbs' : `partials/components/${component}.hbs`;
        hbs.registerPartial(`components/${component}`, fs.readFileSync(path.join(root, file), 'utf8'));
    }
    const site = { title: 'Ghostcn Journal', url: '/', description: 'Built with components you own.', members_enabled: state !== 'disabled', members_invite_only: state === 'invite', allow_self_signup: !['disabled', 'invite', 'restricted'].includes(state), paid_members_enabled: !['disabled', 'free-only'].includes(state), locale: 'en' };
    const member = ['free', 'paid'].includes(state) ? { paid: state === 'paid' } : undefined;
    const data = { site, member };
    const partial = (name, context = post) => {
        const html = hbs.compile(`{{> "components/${name}"}}`)(context, { data });
        return name === 'newsletter-form' && ['success', 'error'].includes(formState)
            ? html.replace('class="gh-newsletter-fields', `class="gh-newsletter-fields ${formState}`) : html;
    };
    const css = fs.readdirSync(path.join(root, 'assets/css/components')).map(file => `<link rel="stylesheet" href="/${style}/assets/css/components/${file}">`).join('');
    const body = partial('site-header') + partial('featured-posts') + `<section class="ghcn-post-grid">${posts.map(p => partial('post-card', p)).join('')}</section>` + partial('pagination', { page: 2, pages: 4, prev: 1, next: 3 }) + partial('post-header') + partial('member-cta', { ...post, access: false }) + partial('newsletter-form', {}) + partial('pricing-table', {}) + partial('author-card', post.primary_author) + partial('site-footer');
    return `<!doctype html><html class="${scheme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ghostcn ${style} QA</title>${host ? '<link rel="stylesheet" href="/casper.css">' : ''}<link rel="stylesheet" href="/${style}/assets/css/ghostcn.css">${css}${host ? '' : `<link rel="stylesheet" href="/${style}/assets/built/screen.css">`}</head><body>${body}<div style="padding:32px"><button id="override" class="ghcn-button bg-purple-600 hover:bg-purple-700 text-white px-8 rounded-xl dark:bg-purple-400">Purple override</button><a id="semantic" class="ghcn-button bg-primary">Semantic primary</a></div></body></html>`;
}
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/comments' && commentsHtml) {
        const style = url.searchParams.get('style') === 'css' ? 'css' : 'tailwind';
        const scheme = ['dark-mode', 'auto-color'].includes(url.searchParams.get('scheme')) ? url.searchParams.get('scheme') : '';
        const preference = ['dark', 'light'].includes(url.searchParams.get('prefers')) ? url.searchParams.get('prefers') : '';
        const css = ['assets/css/ghostcn.css', ...fs.readdirSync(path.join(roots[style], 'assets/css/components')).map(file => `assets/css/components/${file}`), 'assets/built/screen.css'];
        const links = css.map(file => `<link rel="stylesheet" href="http://127.0.0.1:4179/${style}/${file}${preference ? `?prefers=${preference}` : ''}">`).join('');
        const html = commentsHtml.replace(/<html\b[^>]*>/i, `<html lang="en" class="${scheme}">`)
            .replace(/<link\b[^>]*href="\/assets\/[^"\s]*\.css[^"\s]*"[^>]*>/gi, '')
            .replace(/<head>/i, `<head><base href="${commentsUrl.origin}/">`)
            .replace(/<\/head>/i, `${links}</head>`);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.end(html);
    }
    if (url.pathname.endsWith('.css')) {
        let file;
        if (url.pathname === '/casper.css' && ghostRoot) file = path.join(ghostRoot, 'content/themes/casper/assets/built/screen.css');
        else {
            const style = url.pathname.split('/')[1];
            if (roots[style]) {
                const candidate = path.resolve(roots[style], '.' + url.pathname.slice(style.length + 1));
                if (candidate.startsWith(roots[style] + path.sep)) file = candidate;
            }
        }
        if (!file || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
        let css = fs.readFileSync(file, 'utf8');
        // Preview-only simulation of OS preferences; never changes system settings or theme files.
        const preference = url.searchParams.get('prefers');
        if (['light', 'dark'].includes(preference)) css = css.replace(/@media\s*\(prefers-color-scheme:\s*(dark|light)\)/g, (_, mode) => `@media ${mode === preference ? 'all' : 'not all'}`);
        res.setHeader('Content-Type', 'text/css'); return res.end(css);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(render(url.searchParams.get('style') || 'tailwind', url.searchParams.get('state') || 'visitor', url.searchParams.get('scheme') || '', url.searchParams.has('casper'), url.searchParams.get('form')));
});
server.listen(4179, '127.0.0.1', () => console.log('QA preview: http://127.0.0.1:4179/?style=tailwind (state=disabled/invite/restricted/free/paid/free-only; scheme=dark-mode/auto-color; casper=1)'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(); fs.rmSync(temporary, { recursive: true, force: true }); process.exit(0); });
