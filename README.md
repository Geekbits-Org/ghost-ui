# Ghost UI

> A `shadcn/ui`-style component distribution system designed specifically for **Ghost CMS** themes.

Ghost UI allows Ghost theme creators and developers to install production-ready, copy-pasteable Handlebars (`.hbs`) partials, stylesheets, and scripts directly into their themes without cumbersome plugins or monolithic dependencies.

---

## Features

- **Theme-Native**: Installs raw Handlebars partials and CSS directly into your Ghost theme folders.
- **Ghost Members API Ready**: Native support for Ghost attributes such as `data-members-form="subscribe"`.
- **gscan Validated**: All components strictly adhere to Ghost theme guidelines and pass official `gscan` checks.
- **Customizable**: Full ownership of the code?modify HTML, Tailwind classes, and CSS after installation.

---

## Quick Start

### 1. Initialize your Ghost Theme

Run the init command from the root of any Ghost theme (must have `engines.ghost` in its `package.json`):

```bash
npx @ghost-ui/cli init
```

Or pass `-y` to use default paths:
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

### 2. Add Components

Add any component from the registry to your theme:

```bash
npx @ghost-ui/cli add newsletter-form
```

### 3. Use in your Theme

Include the installed partial anywhere in your Handlebars templates:

```handlebars
{{> "components/newsletter-form" title="Subscribe to our Newsletter"}}
```

---

## Project Structure

```
??? packages/
?   ??? cli/                # @ghost-ui/cli (Commander, Prompts, TypeScript)
??? registry/
?   ??? components/         # Component manifests and templates
??? example-theme/          # Sample Ghost theme showing integration
```

---

## Contributing & Local Development

1. Install dependencies:
   ```bash
   cd packages/cli
   npm install
   ```

2. Build the CLI:
   ```bash
   npm run build
   ```

3. Test in local theme:
   ```bash
   cd ../../example-theme
   node ../packages/cli/dist/index.js init -y
   node ../packages/cli/dist/index.js add newsletter-form -y
   npx gscan .
   ```

---

## License

MIT
