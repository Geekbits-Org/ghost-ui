import fs from 'fs';
import path from 'path';
import { resolveWithinTheme } from './theme-files';
import { tailwindTheme } from './styles';
import { themeToolPath } from './theme-tooling';

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
/* Ghost comments paints its own text colors inside a transparent iframe.
   Match the embedded document's native scheme so dark mode does not force a white canvas. */
iframe[title="comments-frame"] { color-scheme: normal; }
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
    {{!-- ghostcn:theme-styles --}}
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
    {{#if access}}{{> "components/member-cta"}}{{/if}}
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
        zip: 'npm run build && node ./scripts/zip.mjs',
        validate: gscanCommand[options.packageManager]
      }
    : {
        dev: 'node ./scripts/dev.mjs',
        build: 'node ./scripts/build.mjs',
        test: 'node ./scripts/check.mjs',
        zip: 'npm run build && node ./scripts/zip.mjs',
        validate: gscanCommand[options.packageManager]
      };
  const devDependencies: Record<string, string> = {};
  // Use the selected package manager for the build preceding archive creation.
  scripts.zip = `${options.packageManager} run build && node ./scripts/zip.mjs`;
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
    engines: { ghost: '>=5.54.1', node: options.style === 'tailwind' ? '>=20.0.0' : '>=18.0.0' },
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

The dev command only watches CSS. It does not start Ghost or serve this theme.
Use Node 22.13.1+ or Node 24 for official gscan validation. ${options.style === 'tailwind' ? 'The Tailwind build requires Node 20 or later.' : 'The vanilla build needs Node 18 or later.'}

## Preview in Ghost

1. Install and start a local Ghost development site using the [official guide](https://docs.ghost.org/install/local/).
2. Place this entire theme folder under that site's \`content/themes\` directory. Run the commands above from the moved folder.
3. From the Ghost installation directory, run \`ghost restart\` so Ghost discovers the new theme.
4. Open your site's \`/ghost/\` admin, go to Settings → Design → Change theme, and activate this theme.
5. Open the site's URL (usually http://localhost:2368). Keep \`${run} dev\` running and refresh the browser after edits. If Ghost is not running, use \`ghost start\` from its installation directory.

Do not edit or replace Ghost's own installation files. For remote Ghost or Ghost(Pro), upload a ZIP instead of using the local preview steps.

## Customize

You own the files in \`partials/components\` and \`assets/css/components\`. ${options.style === 'tailwind'
    ? 'Add normal Tailwind classes to the markup, for example `ghcn-button bg-purple-600 hover:bg-purple-700 text-white`. No important modifier is needed for ghostcn defaults. Semantic utilities such as `bg-primary` and `border-border` are configured in `assets/css/ghostcn-tailwind.css`. Put additional CSS in `assets/css/source.css`.'
    : 'Edit the component CSS directly, or put token and selector overrides in `assets/css/source.css`. The built stylesheet loads after ghostcn, so equal-specificity overrides win.'}

Prefer per-instance styling parameters over modifying the shared partial:

\`\`\`handlebars
{{> "components/pricing-table"
    class="${options.style === 'tailwind' ? 'mx-auto my-12 w-full max-w-md' : 'membership'}"
    cardClass="${options.style === 'tailwind' ? 'rounded-2xl bg-card p-8 shadow-lg' : 'membership-card'}"
    buttonClass="${options.style === 'tailwind' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'membership-button'}"
}}
\`\`\`

Every component accepts \`class\` for its root; named slots (such as \`buttonClass\`, \`titleClass\` and \`inputClass\`) apply to the corresponding internal elements when present. Available slots are listed in the installed partial's opening comment and in the ghostcn documentation. Pricing also accepts \`titleClass\` and \`gridClass\`. ${options.style === 'tailwind' ? 'Keep classes as complete literal strings in scanned .hbs files and keep the dev watcher running.' : 'Define your custom class selectors in assets/css/source.css, matching default specificity where needed.'} Re-adding a component can overwrite its partial/CSS but does not overwrite styling kept in calling templates or source.css. These parameters do not style Ghost-owned Portal, search or comments UI.

Membership UI follows Ghost's enabled/invite-only/paid settings. Pricing comes from public tiers configured in Ghost Admin; payments must be configured before paid plans appear. The custom \`partials/content-cta.hbs\` renders one paywall for protected posts without exposing restricted content.

## Package for upload

\`\`\`bash
${run} test
${run} validate
${run} zip
\`\`\`

The zip command builds first, then writes \`dist/${options.themeName}-1.0.0.zip\` (the filename follows package.json's version). It contains runtime templates and assets, not node_modules, scripts, lockfiles, or repository metadata. Re-running replaces that generated ZIP. Upload it in Ghost Admin → Settings → Design → Change theme → Upload theme. Offline checks do not replace gscan or testing on your target Ghost version (minimum 5.54.1).
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
    ? `@import "tailwindcss";\n@source "../../**/*.hbs";\n@import "./ghostcn-tailwind.css";\n\n@layer base {\n${css}}\n`
    : css;
  const files: Record<string, string> = {
    'package.json': packageJson({ ...options, themeName }),
    'default.hbs': defaultTemplate(options.colorScheme),
    'index.hbs': indexTemplate(options),
    'post.hbs': postTemplate(options),
    'partials/content-cta.hbs': '{{{html}}}\n{{> "components/member-cta"}}\n',
    'page.hbs': pageTemplate(),
    'tag.hbs': archiveTemplate('tag'),
    'author.hbs': archiveTemplate('author'),
    'assets/css/source.css': sourceCss,
    'assets/built/screen.css': css,
    'scripts/check.mjs': "import { fileURLToPath } from 'node:url';\nimport { reportTheme } from './theme-tools.mjs';\nif (!reportTheme(fileURLToPath(new URL('../', import.meta.url)))) process.exitCode = 1;\n",
    'scripts/zip.mjs': "import { fileURLToPath } from 'node:url';\nimport { packageTheme } from './theme-tools.mjs';\nconsole.log('Created ' + packageTheme(fileURLToPath(new URL('../', import.meta.url))).output);\n",
    'scripts/theme-tools.mjs': fs.readFileSync(themeToolPath(), 'utf8'),
    '.gitignore': 'node_modules\n*.zip\n.DS_Store\n',
    'README.md': readme(options)
  };
  if (options.style === 'css') {
    files['scripts/build.mjs'] = vanillaBuildScript;
    files['scripts/dev.mjs'] = vanillaDevScript;
  }
  if (options.style === 'tailwind') files['assets/css/ghostcn-tailwind.css'] = tailwindTheme();

  for (const [relativePath, content] of Object.entries(files)) {
    const target = resolveWithinTheme(themeRoot, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, 'utf8');
  }

  return { themeRoot, files: Object.keys(files) };
}
