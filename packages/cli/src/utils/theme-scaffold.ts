import fs from 'fs';
import path from 'path';
import { resolveWithinTheme } from './theme-files';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';
export type ColorScheme = 'Light' | 'Dark' | 'Auto';

export interface ScaffoldThemeOptions {
  parentDirectory: string;
  themeName: string;
  style: 'tailwind' | 'css';
  colorScheme: ColorScheme;
  packageManager: PackageManager;
  authorName?: string;
  authorEmail?: string;
  includeNewsletter?: boolean;
  includeAuthorCard?: boolean;
  includePricing?: boolean;
}

export interface ScaffoldThemeResult {
  themeRoot: string;
  files: string[];
}

export const REQUIRED_STARTER_COMPONENTS = [
  'site-header',
  'site-footer',
  'featured-posts',
  'pagination',
  'post-header',
  'member-cta',
  'post-card'
] as const;

export function sanitizeThemeName(value: string): string {
  const name = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name) || name.endsWith('-') || name.includes('--')) {
    throw new Error('Theme names must use lowercase letters, numbers, and single hyphens (for example: my-theme).');
  }
  return name;
}

function baseThemeCss(): string {
  return `/* Theme-level styles. ghostcn components keep their own portable stylesheets. */
*, *::before, *::after { box-sizing: border-box; }
html { font-size: 100%; }
body {
  min-height: 100vh;
  margin: 0;
  color: var(--foreground, #09090b);
  background: var(--background, #fff);
  font-family: var(--gh-font-body, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: 1rem;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
img { max-width: 100%; }
h1, h2, h3, h4, h5, h6 { font-family: var(--gh-font-heading, inherit); }
.ghcn-main { min-height: 65vh; }
.ghcn-page-heading { width: min(100% - 2rem, 72rem); margin: 4rem auto 2rem; }
.ghcn-page-heading h1 { margin: 0; font-size: clamp(2.25rem, 6vw, 4rem); line-height: 1; letter-spacing: -0.05em; }
.ghcn-page-heading p { max-width: 42rem; margin: 1rem 0 0; color: var(--muted-foreground); font-size: 1.125rem; }
.ghcn-post-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; width: min(100% - 2rem, 72rem); margin: 2rem auto 4rem; }
.ghcn-article { width: min(100% - 2rem, 46rem); margin: 0 auto 4rem; }
.ghcn-article-content { color: var(--foreground); font-family: ui-serif, Georgia, Cambria, "Times New Roman", serif; font-size: clamp(1.0625rem, 2vw, 1.1875rem); }
.ghcn-article-content > * { margin-block: 0 1.5em; }
.ghcn-article-content h2, .ghcn-article-content h3 { margin-top: 2em; line-height: 1.15; letter-spacing: -0.025em; }
.ghcn-article-content a { color: var(--primary); }
.ghcn-article-content img, .ghcn-article-content .kg-card { max-width: 100%; }
.ghcn-article-content .kg-width-wide { width: min(72rem, 100vw - 2rem); max-width: none; margin-left: 50%; transform: translateX(-50%); }
.ghcn-article-content .kg-width-full { width: 100vw; max-width: none; margin-left: 50%; transform: translateX(-50%); }
.ghcn-empty { width: min(100% - 2rem, 42rem); margin: 4rem auto; padding: 3rem; border: 1px dashed var(--border); border-radius: min(var(--radius), 1rem); color: var(--muted-foreground); text-align: center; }
@media (max-width: 900px) { .ghcn-post-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
@media (max-width: 620px) { .ghcn-post-grid { grid-template-columns: 1fr; } }
`;
}

function defaultTemplate(_colorScheme: ColorScheme): string {
  return `<!DOCTYPE html>
<html lang="{{@site.locale}}"{{#match @custom.color_scheme "Dark"}} class="dark-mode"{{else match @custom.color_scheme "Auto"}} class="auto-color"{{/match}}>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{meta_title}}</title>
    <link rel="stylesheet" href="{{asset "built/screen.css"}}" />
    {{ghost_head}}
</head>
<body class="{{body_class}}">
    {{> "components/site-header"}}
    <main class="ghcn-main">{{{body}}}</main>
    {{> "components/site-footer"}}
    {{ghost_foot}}
</body>
</html>
`;
}

function indexTemplate(options: ScaffoldThemeOptions): string {
  const extras = [
    options.includeNewsletter ? '{{> "components/newsletter-form" title="Never miss a story"}}' : '',
    options.includePricing ? '{{> "components/pricing-table" title="Support this publication"}}' : ''
  ].filter(Boolean).join('\n\n');
  return `{{!< default}}

{{#is "home"}}{{> "components/featured-posts"}}{{/is}}

<header class="ghcn-page-heading">
    <h1>{{@site.title}}</h1>
    {{#if @site.description}}<p>{{@site.description}}</p>{{/if}}
</header>

{{#if posts}}
<section class="ghcn-post-grid" aria-label="Latest posts">
    {{#foreach posts}}{{> "components/post-card"}}{{/foreach}}
</section>
{{else}}
<div class="ghcn-empty">Publish your first post in Ghost Admin to see it here.</div>
{{/if}}

{{pagination}}
${extras ? `\n${extras}\n` : ''}`;
}

function postTemplate(options: ScaffoldThemeOptions): string {
  const author = options.includeAuthorCard
    ? '\n    {{#primary_author}}{{> "components/author-card"}}{{/primary_author}}\n'
    : '';
  return `{{!< default}}

{{#post}}
    {{> "components/post-header"}}
    <article class="ghcn-article {{post_class}}">
        <div class="ghcn-article-content">{{content}}</div>
    </article>
    {{> "components/member-cta"}}
${author}    {{comments}}
{{/post}}
`;
}

function pageTemplate(): string {
  return `{{!< default}}

{{#post}}
    {{#match @page.show_title_and_feature_image}}
        {{> "components/post-header"}}
    {{/match}}
    <article class="ghcn-article {{post_class}}">
        <div class="ghcn-article-content">{{content}}</div>
    </article>
{{/post}}
`;
}

function archiveTemplate(kind: 'tag' | 'author'): string {
  const header = kind === 'tag'
    ? `{{#tag}}<header class="ghcn-page-heading"><h1>{{name}}</h1>{{#if description}}<p>{{description}}</p>{{/if}}</header>{{/tag}}`
    : `{{#author}}<header class="ghcn-page-heading"><h1>{{name}}</h1>{{#if bio}}<p>{{bio}}</p>{{/if}}</header>{{/author}}`;
  return `{{!< default}}

${header}
<section class="ghcn-post-grid" aria-label="Posts">
    {{#foreach posts}}{{> "components/post-card"}}{{/foreach}}
</section>
{{pagination}}
`;
}

function packageJson(options: ScaffoldThemeOptions): string {
  const gscanCommand: Record<PackageManager, string> = {
    npm: 'npx --yes gscan@6.4.2 .',
    pnpm: 'pnpm dlx gscan@6.4.2 .',
    yarn: 'yarn dlx gscan@6.4.2 .',
    bun: 'bunx gscan@6.4.2 .'
  };
  const scripts = options.style === 'tailwind'
    ? {
        dev: 'tailwindcss -i ./assets/css/source.css -o ./assets/built/screen.css --watch',
        build: 'tailwindcss -i ./assets/css/source.css -o ./assets/built/screen.css --minify',
        test: 'node ./scripts/check.mjs',
        validate: gscanCommand[options.packageManager]
      }
    : {
        dev: 'node ./scripts/dev.mjs',
        build: 'node ./scripts/build.mjs',
        test: 'node ./scripts/check.mjs',
        validate: gscanCommand[options.packageManager]
      };
  const devDependencies: Record<string, string> = {};
  if (options.style === 'tailwind') {
    devDependencies.tailwindcss = '^4.1.0';
    devDependencies['@tailwindcss/cli'] = '^4.1.0';
  }
  return JSON.stringify({
    name: options.themeName,
    description: `A Ghost theme created with ghostcn`,
    version: '1.0.0',
    private: true,
    author: {
      name: options.authorName || 'Theme Author',
      email: options.authorEmail || 'hello@example.com'
    },
    engines: { ghost: '>=5.0.0' },
    license: 'MIT',
    keywords: ['ghost-theme', 'ghost', 'ghostcn'],
    scripts,
    devDependencies,
    config: {
      posts_per_page: 9,
      card_assets: true,
      image_sizes: { xs: { width: 160 }, s: { width: 400 }, m: { width: 750 }, l: { width: 1200 }, xl: { width: 2000 } },
      custom: {
        color_scheme: { type: 'select', options: ['Light', 'Dark', 'Auto'], default: options.colorScheme }
      }
    }
  }, null, 2) + '\n';
}

function readme(options: ScaffoldThemeOptions): string {
  const run = options.packageManager === 'npm' ? 'npm run' : `${options.packageManager} run`;
  return `# ${options.themeName}

A Ghost theme generated by [ghostcn](https://www.npmjs.com/package/ghostcn).

## Development

\`\`\`bash
${options.packageManager} install
${run} dev
\`\`\`

Use \`${run} build\` for a production stylesheet, \`${run} test\` for offline scaffold checks, and \`${run} validate\` for official gscan validation (downloads the pinned validator on demand).

Components are copied into \`partials/components\` and \`assets/css/components\`, so you own and can customize every file. Put durable overrides in \`assets/css/source.css\`.
`;
}

const vanillaBuildScript = `import { copyFileSync, mkdirSync } from 'node:fs';
mkdirSync(new URL('../assets/built/', import.meta.url), { recursive: true });
copyFileSync(new URL('../assets/css/source.css', import.meta.url), new URL('../assets/built/screen.css', import.meta.url));
console.log('Built assets/built/screen.css');
`;

const vanillaDevScript = `import { watch } from 'node:fs';
import './build.mjs';
const source = new URL('../assets/css/source.css', import.meta.url);
let timer;
console.log('Watching assets/css/source.css — press Ctrl+C to stop.');
watch(source, () => {
  clearTimeout(timer);
  timer = setTimeout(() => import('./build.mjs?' + Date.now()), 50);
});
`;

const checkScript = `import { existsSync, readFileSync } from 'node:fs';
const required = ['package.json', 'default.hbs', 'index.hbs', 'post.hbs', 'page.hbs', 'assets/css/ghostcn.css', 'assets/built/screen.css'];
const missing = required.filter(file => !existsSync(new URL('../' + file, import.meta.url)));
if (missing.length) {
  console.error('Missing required theme files:', missing.join(', '));
  process.exit(1);
}
const layout = readFileSync(new URL('../default.hbs', import.meta.url), 'utf8');
if (!layout.includes('{{ghost_head}}') || !layout.includes('{{ghost_foot}}')) {
  console.error('default.hbs must include {{ghost_head}} and {{ghost_foot}}.');
  process.exit(1);
}
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
if (!pkg.engines?.ghost || !pkg.author?.email) {
  console.error('package.json must define engines.ghost and author.email.');
  process.exit(1);
}
console.log('Theme scaffold checks passed.');
`;

export function scaffoldTheme(options: ScaffoldThemeOptions): ScaffoldThemeResult {
  const themeName = sanitizeThemeName(options.themeName);
  const parent = path.resolve(options.parentDirectory);
  const themeRoot = path.resolve(parent, themeName);
  if (themeRoot === parent || !themeRoot.startsWith(`${parent}${path.sep}`)) {
    throw new Error('The generated theme must stay inside the selected parent directory.');
  }
  if (fs.existsSync(themeRoot) && fs.readdirSync(themeRoot).length > 0) {
    throw new Error(`Cannot create "${themeName}" because that directory is not empty.`);
  }
  fs.mkdirSync(themeRoot, { recursive: true });

  const css = baseThemeCss();
  const sourceCss = options.style === 'tailwind'
    ? `@import "tailwindcss";\n@source "../../**/*.hbs";\n\n${css}`
    : css;
  const files: Record<string, string> = {
    'package.json': packageJson({ ...options, themeName }),
    'default.hbs': defaultTemplate(options.colorScheme),
    'index.hbs': indexTemplate(options),
    'post.hbs': postTemplate(options),
    'page.hbs': pageTemplate(),
    'tag.hbs': archiveTemplate('tag'),
    'author.hbs': archiveTemplate('author'),
    'assets/css/source.css': sourceCss,
    'assets/built/screen.css': css,
    'scripts/check.mjs': checkScript,
    '.gitignore': 'node_modules\n*.zip\n.DS_Store\n',
    'README.md': readme(options)
  };
  if (options.style === 'css') {
    files['scripts/build.mjs'] = vanillaBuildScript;
    files['scripts/dev.mjs'] = vanillaDevScript;
  }

  for (const [relativePath, content] of Object.entries(files)) {
    const target = resolveWithinTheme(themeRoot, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, 'utf8');
  }

  return { themeRoot, files: Object.keys(files) };
}
