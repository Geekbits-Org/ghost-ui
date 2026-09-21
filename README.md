# Ghost UI

> A `shadcn/ui`-style component distribution system designed specifically for **Ghost CMS** themes.

Ghost UI allows Ghost theme creators and developers to install production-ready, copy-pasteable Handlebars (`.hbs`) partials, stylesheets (`.css`), and scripts directly into their themes without cumbersome plugins or monolithic dependencies.

---

## Features

- **Theme-Native Distribution**: Injects raw Handlebars partials and CSS directly into your Ghost theme folders.
- **Remote CDN Registry**: Fetches live component manifests over HTTPS directly from the official registry.
- **Interactive Multi-Select**: Run `ghost-ui add` without arguments to select and batch-install multiple components interactively.
- **Styling Parity**: Complete Vanilla CSS stylesheets provided alongside modern Tailwind CSS utility classes.
- **Ghost Members API Native**: Built-in support for Ghost attributes like `data-members-form="subscribe"` and Portal checkout links.
- **100% gscan Validated**: All components strictly adhere to Ghost theme guidelines and pass official `gscan` checks with 0 errors.

---

## Available Components

| Component | Description | Files |
| :--- | :--- | :--- |
| **`newsletter-form`** | Native Ghost members subscription form with success/error states | `.hbs`, `.css` |
| **`pricing-table`** | Membership tiers (Free, Monthly, Annual) with Portal checkout links | `.hbs`, `.css` |
| **`author-card`** | Author bio box with avatar, biography, social links, and post counts | `.hbs`, `.css` |
| **`post-card`** | Post loop preview card with feature image, tags, excerpt, and reading time | `.hbs`, `.css` |

---

## Quick Start

### 1. Initialize your Ghost Theme

Run the `init` command from the root of any Ghost theme (must have `engines.ghost` in its `package.json`):

```bash
npx @ghost-ui/cli init
```

Or pass `-y` to use default paths non-interactively:
```bash
npx @ghost-ui/cli init -y
```

This creates a `components.json` configuration file:
```json
{
  "style": "tailwind",
  "aliases": {
    "partials": "partials/components",
    "styles": "assets/css/components"
  }
}
```

### 2. Browse Components

List all available components in the Ghost UI registry:

```bash
npx @ghost-ui/cli list
```

### 3. Add Components

Add a specific component:
```bash
npx @ghost-ui/cli add newsletter-form
```

Or run `add` without arguments to pick interactively from a multi-select list:
```bash
npx @ghost-ui/cli add
```

To overwrite existing files without prompts:
```bash
npx @ghost-ui/cli add newsletter-form -y
```

### 4. Use in your Theme

Include the installed partial anywhere in your Handlebars templates:

```handlebars
{{!-- Newsletter Form --}}
{{> "components/newsletter-form" title="Subscribe to our Newsletter"}}

{{!-- Pricing Table --}}
{{> "components/pricing-table" title="Choose your membership"}}

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
??? packages/
?   ??? cli/                # @ghost-ui/cli (Commander, Prompts, TypeScript, tests)
??? registry/
?   ??? index.json          # Registry catalog index
?   ??? components/         # Component manifests and templates
??? example-theme/          # Sample Ghost theme showing integration
??? .github/workflows/      # Automated CI pipeline
```

---

## Development & Testing

1. **Install Dependencies**:
   ```bash
   cd packages/cli
   npm install
   ```

2. **Build TypeScript**:
   ```bash
   npm run build
   ```

3. **Run Unit Tests**:
   ```bash
   npm test
   ```

4. **Verify with Ghost Validator (`gscan`)**:
   ```bash
   cd ../../example-theme
   npx gscan .
   ```

---

## License

MIT
