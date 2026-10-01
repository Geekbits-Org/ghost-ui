# ghostcn

<p align="center">
  <strong>The <code>shadcn/ui</code> for Ghost CMS themes.</strong><br>
  Beautiful, accessible, copy-pasteable Handlebars partials and stylesheets for modern Ghost theme development.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ghostcn"><img src="https://img.shields.io/npm/v/ghostcn?color=6366f1&style=flat-square" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/ghostcn"><img src="https://img.shields.io/npm/dm/ghostcn?color=3b82f6&style=flat-square" alt="npm downloads" /></a>
  <a href="https://ghost.org"><img src="https://img.shields.io/badge/Ghost-%3E%3D5.0.0-15171a?style=flat-square" alt="Ghost Version" /></a>
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
- 🛡️ **Theme validation**: Generated themes include offline diagnostics and official gscan validation. Validate your customized theme against your target Ghost version before shipping.

---

## Available Components

| Component | Description | Files |
| :--- | :--- | :--- |
| **`newsletter-form`** | Native Ghost members subscription form with success/error states | `newsletter-form.hbs`, `newsletter-form.css` |
| **`pricing-table`** | Public Ghost tiers with live prices, currencies, benefits and tier-specific Portal checkout | `pricing-table.hbs`, `pricing-table.css` |
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

`npm run dev` watches CSS; it does **not** start Ghost. To preview, place the theme folder under a local Ghost installation's `content/themes`, restart Ghost from its installation directory, activate the theme in Ghost Admin → Settings → Design → Change theme, then visit your site's URL. Follow the [local Ghost setup guide](https://docs.ghost.org/install/local/) if you do not have an installation yet. Generated starters require Ghost 5.54.1+; use Node 22.13.1+ or Node 24 for gscan (Tailwind builds need Node 20+).

Build, validate and package for a remote site:

```bash
npm test
npm run validate
npm run zip
```

The ZIP is written to `dist/<theme-name>-<version>.zip`, with runtime templates and assets at its root. It excludes dependencies, scripts, lockfiles and repository metadata. Upload it in Ghost Admin's theme picker. Re-running replaces the generated ZIP.

For an existing theme, run `npx ghostcn doctor` to check configuration, linked assets, partials and Ghost hooks. After running **your theme's build**, `npx ghostcn pack` packages it without invoking or changing its build system. Doctor is an offline diagnostic, not a replacement for gscan or browser testing.

### Styling components

For a generated Tailwind theme, customize the markup with ordinary utilities:

```handlebars
<a class="ghcn-button bg-purple-600 hover:bg-purple-700 text-white" href="#/portal/signup" data-portal="signup">Subscribe</a>
```

No `!` modifier is required to override ghostcn defaults. Component styles and primitives use Tailwind's `components` layer; utilities take precedence, even if a component stylesheet loads later. Semantic colors (`bg-primary`, `text-muted-foreground`, `border-border`, `ring-ring`) and `rounded-ghostcn` are mapped by `assets/css/ghostcn-tailwind.css`. Ghost's explicit and automatic dark modes are supported.

For **existing Tailwind v4 themes**, import the generated `ghostcn-tailwind.css` into your Tailwind source and make sure the build scans `.hbs` files. For example, when using `assets/css/source.css`:

```css
@import "tailwindcss";
@import "./ghostcn-tailwind.css";
@source "../../**/*.hbs";
```

`init` and `add` do not replace an existing theme's build pipeline. Unlayered host CSS can still override layered styles; place such host rules in an appropriate lower layer or adjust your theme deliberately. Older Tailwind builds must configure their own semantic token mappings.

Vanilla themes ship standalone CSS: edit component files or put token and selector overrides in `assets/css/source.css`. The generated build stylesheet loads after ghostcn defaults. On an existing theme, link your override stylesheet after the managed ghostcn block.

Membership components respect disabled, invite-only and self-signup settings. Paid pricing is shown only when Ghost enables paid membership, using active public tiers configured in Ghost Admin—not sample amounts or invented benefits. The starter uses `partials/content-cta.hbs` for one custom paywall; adding `member-cta` below native `{{content}}` on an existing protected post can otherwise duplicate Ghost's paywall. Follow the starter pattern rather than rendering both.

### Updating an existing ghostcn theme

Your copied files are yours; an npm update does not silently rewrite them. Back up or commit your theme first. Compare the new components in a fresh throwaway theme, then merge the changes you want. To replace unmodified files directly, run `ghostcn init` with your existing palette/paths and re-add the relevant components. Initialization regenerates tokens; `add -y` overwrites component customizations, so use it only deliberately. Existing Tailwind styles from older ghostcn releases are unlayered and need the new token/component CSS for ordinary utility overrides to work.

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

### 5. Style each instance without changing the shared component

Every component accepts `class` for its root element. Optional named slots style specific parts **inside** a component: `buttonClass` styles its theme-owned buttons, while `cardClass` styles nested pricing/featured cards. These are ordinary class strings, not new CSS syntax, and work with Tailwind or your own vanilla CSS.

```handlebars
{{> "components/pricing-table"
    class="mx-auto my-12 w-full max-w-md"
    cardClass="rounded-2xl bg-card p-8 shadow-lg"
    buttonClass="bg-purple-600 hover:bg-purple-700 text-white"
}}

{{!-- Another independent instance; the shared partial stays unchanged --}}
{{> "components/pricing-table"
    class="mx-auto max-w-6xl"
    cardClass="rounded-lg p-4 shadow-none"
    buttonClass="bg-emerald-600 hover:bg-emerald-700 text-white"
}}

{{> "components/newsletter-form"
    class="max-w-lg p-4 shadow-none"
    inputClass="rounded-xl"
    buttonClass="rounded-xl bg-purple-600 text-white"
}}

{{#foreach posts}}
    {{> "components/post-card" class="rounded-xl shadow-none" titleClass="text-2xl"}}
{{/foreach}}
```

All components keep their semantic identity classes and default CSS. Defaults live in the component layer for Tailwind, so normal utilities override them without `!` modifiers or a class-merging helper. Keep `npm run dev` running; classes must appear as complete literal strings in scanned `.hbs` files (do not construct `bg-{{color}}-600`). If you pass classes from runtime data, include their complete names in a scanned source or explicitly safelist them with Tailwind's `@source inline()`.

| Component | Root | Additional styling parameters |
| --- | --- | --- |
| `pricing-table` | `class` | `titleClass`, `gridClass`, `cardClass`, `buttonClass` |
| `newsletter-form` | `class` | `titleClass`, `descriptionClass`, `formClass`, `inputClass`, `buttonClass` |
| `post-card` | `class` | `imageClass`, `contentClass`, `titleClass`, `descriptionClass`, `metaClass`, `footerClass` |
| `author-card` | `class` | `avatarClass`, `contentClass`, `titleClass`, `descriptionClass`, `metaClass` |
| `site-header` | `class` | `innerClass`, `navClass`, `buttonClass` |
| `site-footer` | `class` | `innerClass`, `navClass`, `socialClass` |
| `featured-posts` | `class` | `titleClass`, `gridClass`, `cardClass`, `contentClass` |
| `pagination` | `class` | `buttonClass`, `statusClass` |
| `post-header` | `class` | `titleClass`, `descriptionClass`, `metaClass`, `imageClass` |
| `member-cta` | `class` | `titleClass`, `descriptionClass`, `buttonClass` |

Slots only affect elements that render for the current content/member state. `buttonClass` applies to all theme-owned buttons in that component, not individual monthly/yearly actions and not Ghost-generated search/Portal/comments UI. Use scoped descendant selectors for more granular targeting. Root `class` does not automatically recolor children that have their own colors; use the corresponding slot. To customize pagination at the call site, use `{{> "pagination" pagination class="my-pagination"}}`; the native `{{pagination}}` helper retains its default appearance.

For vanilla CSS, pass custom class names and define them in your theme-owned `assets/css/source.css`:

```handlebars
{{> "components/pricing-table" class="membership" cardClass="membership-card" buttonClass="membership-button"}}
```

```css
.membership { max-width: 40rem; }
.membership .membership-card { border-radius: 1.5rem; box-shadow: 0 8px 24px #0002; }
.membership .membership-button { background: #7c3aed; color: white; }
```

Load custom CSS after component styles and match selector specificity where needed. Re-adding a component with `-y` still overwrites its copied partial/CSS, but **not** the calling page template or `source.css`. Back up first when upgrading old customized partials. Existing installations must merge or re-add the new partials to gain these parameters; updating the CLI alone does not rewrite your theme. A future component release may still require migration if it changes or removes a documented slot.

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
