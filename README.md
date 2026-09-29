# ghostcn

<p align="center">
  <strong>The <code>shadcn/ui</code> for Ghost CMS themes.</strong><br>
  Beautiful, accessible, copy-pasteable Handlebars partials and stylesheets for modern Ghost theme development.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ghostcn"><img src="https://img.shields.io/npm/v/ghostcn?color=6366f1&style=flat-square" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/ghostcn"><img src="https://img.shields.io/npm/dm/ghostcn?color=3b82f6&style=flat-square" alt="npm downloads" /></a>
  <a href="https://ghost.org"><img src="https://img.shields.io/badge/Ghost-%3E%3D5.0.0-15171a?style=flat-square" alt="Ghost Version" /></a>
  <a href="https://gscan.ghost.org"><img src="https://img.shields.io/badge/gscan-100%25%20valid-22c55e?style=flat-square" alt="gscan validation" /></a>
  <a href="https://github.com/Geekbits-Org/ghost-ui/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" /></a>
</p>

---

## What is ghostcn?

**ghostcn** brings the modern component distribution model to **Ghost CMS**. 

Instead of installing cumbersome plugins or monolithic npm modules that lock down your markup, ghostcn injects clean, production-ready **Handlebars (`.hbs`) partials** and **CSS** directly into your theme repository. 

You own the code. You customize the classes. Zero vendor lock-in.

---

## Features

- 📦 **Theme-Native**: Directly installs raw Handlebars partials and CSS into your theme folders.
- ⚡ **Zero Latency**: Bundled offline registry ensures blazing fast installation even without internet.
- 🎯 **Interactive Multi-Select**: Run `npx ghostcn add` without arguments to select and batch-install multiple components interactively.
- 🎨 **Tailwind & Vanilla CSS**: Pre-styled with utility classes and full Vanilla CSS stylesheets with Ghost CSS custom properties.
- 🔑 **Ghost Members API**: Native support for Ghost attributes (`data-members-form="subscribe"`, Portal checkout triggers).
- 🛡️ **100% gscan Validated**: All components strictly adhere to Ghost theme guidelines and pass official `gscan` checks with 0 errors.

---

## Available Components

| Component | Description | Files |
| :--- | :--- | :--- |
| **`newsletter-form`** | Native Ghost members subscription form with success/error states | `newsletter-form.hbs`, `newsletter-form.css` |
| **`pricing-table`** | Membership tiers (Free, Monthly, Annual) with native Portal checkout triggers | `pricing-table.hbs`, `pricing-table.css` |
| **`author-card`** | Author bio box with avatar, biography, social links, and post counts | `author-card.hbs`, `author-card.css` |
| **`post-card`** | Post loop preview card with feature image, tags, excerpt, and reading time | `post-card.hbs`, `post-card.css` |
| **`site-header`** | Responsive navigation with search, mobile menu, sign-in, and subscribe actions | `site-header.hbs`, `site-header.css` |
| **`site-footer`** | Secondary navigation, publication information, social links, and attribution | `site-footer.hbs`, `site-footer.css` |
| **`featured-posts`** | Homepage hero grid backed by Ghost featured posts | `featured-posts.hbs`, `featured-posts.css` |
| **`pagination`** | Accessible replacement for Ghost’s native pagination partial | `partials/pagination.hbs`, `pagination.css` |
| **`post-header`** | Editorial post heading, author metadata, reading time, and responsive image | `post-header.hbs`, `post-header.css` |
| **`member-cta`** | Context-aware calls to action for visitors, free members, and paid members | `member-cta.hbs`, `member-cta.css` |

---

## Quick Start

### Create a complete Ghost theme

Start a new, production-ready theme with an interactive setup:

```bash
npx ghostcn create my-theme
```

The wizard configures Tailwind CSS or vanilla CSS, design tokens, color mode, package manager, optional components, and dependency installation. The generated theme includes Ghost templates for the home page, posts, pages, tags, and authors; responsive navigation; member flows; build scripts; and gscan validation.

Use recommended defaults without installing dependencies:

```bash
npx ghostcn create my-theme -y --skip-install
```

Tailwind themes include a complete Tailwind CLI build and watch pipeline. Vanilla themes include a zero-dependency CSS copy/watch pipeline. In both cases:

```bash
cd my-theme
npm run dev
```

Generated themes also include `npm test` for offline scaffold checks and `npm run validate` for official, pinned gscan validation. The validator is downloaded only when requested, keeping validator-only dependencies out of the day-to-day theme install.

### 1. Initialize your Ghost Theme

Run the `init` command from the root of any Ghost theme (must have `engines.ghost` in its `package.json`):

```bash
npx ghostcn init
```

Or pass `-y` to use default paths non-interactively:
```bash
npx ghostcn init -y
```

This prompts you to choose your styling system (`tailwind` or `css`), base color palette (`zinc`, `slate`, `stone`, `gray`, `neutral`), accent color (`ghost` native dynamic accent, `indigo`, `violet`, etc.), and border radius (`none`, `sm`, `md`, `lg`, `full`).

It generates `assets/css/ghostcn.css` with semantic design tokens, creates `components.json`, and adds a managed stylesheet block to `default.hbs`:
```json
{
  "$schema": "https://ghostcn.com/schema.json",
  "style": "tailwind",
  "theme": {
    "baseColor": "zinc",
    "accentColor": "ghost",
    "radius": "0.5rem"
  },
  "aliases": {
    "partials": "partials/components",
    "styles": "assets/css/components"
  },
  "cssFile": "assets/css/ghostcn.css"
}
```

The CLI keeps the token stylesheet and every installed component stylesheet linked automatically:
```handlebars
{{!-- ghostcn:styles:start --}}
<link rel="stylesheet" href="{{asset "css/ghostcn.css"}}" />
{{!-- Component styles are added here by `ghostcn add` --}}
{{!-- ghostcn:styles:end --}}
```

If a theme uses a layout other than `default.hbs`, the CLI leaves the layout untouched and prints the link you need to add manually.

### 2. Browse Components

List all available components in the registry:

```bash
npx ghostcn list
```

### 3. Add Components

Add a specific component:
```bash
npx ghostcn add newsletter-form
```

Or run `add` without arguments to pick interactively from a checklist:
```bash
npx ghostcn add
```

To overwrite existing files without prompts:
```bash
npx ghostcn add pricing-table -y
```

### 4. Use in your Templates

Include the installed partial anywhere in your Handlebars templates:

```handlebars
{{!-- Newsletter Form --}}
{{> "components/newsletter-form" title="Subscribe to our Newsletter"}}

{{!-- Pricing & Membership Table --}}
{{> "components/pricing-table" title="Choose your membership plan"}}

{{!-- Author Card --}}
{{#primary_author}}
    {{> "components/author-card"}}
{{/primary_author}}

{{!-- Post Loop --}}
{{#foreach posts}}
    {{> "components/post-card"}}
{{/foreach}}
```

---

## Project Structure

```text
ghostcn/
├── packages/
│   └── cli/                # ghostcn CLI (Commander, Prompts, TypeScript, tests)
├── registry/
│   ├── index.json          # Registry catalog index
│   └── components/         # Component manifests and templates
├── example-theme/          # Sample Ghost theme showing integration
└── .github/workflows/      # Automated CI pipeline
```

---

## Development & Testing

```bash
# Install dependencies
npm install

# Build CLI and bundle registry
npm run build

# Run automated tests
npm test

# Verify theme compatibility with Ghost validator
cd example-theme
npx gscan .
```

---

## Troubleshooting

### Clearing npx cache
If you've previously run an older version of `ghostcn`, npx may cache it locally. To always run the latest version:
```bash
npx ghostcn@latest <command>
```

---

## License

MIT © [Geekbits Org](https://github.com/Geekbits-Org)
