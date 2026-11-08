# Ghostcn

Copy Ghost-native Handlebars components and styles into a theme you own. Use Tailwind CSS or vanilla CSS.

**[Documentation](https://ghostcn.geekbits.dev)** · [Component reference](https://ghostcn.geekbits.dev/docs/components) · [Changelog](https://ghostcn.geekbits.dev/changelog)

## Start a new theme

```sh
npx ghostcn@latest create my-theme
cd my-theme
npm run dev
```

The dev command watches CSS; it does not start Ghost. Follow the [theme setup guide](https://ghostcn.geekbits.dev/docs/getting-started/create-a-theme) to activate and preview the theme in Ghost.

## Add to an existing theme

From your Ghost theme directory:

```sh
npx ghostcn@latest init
npx ghostcn@latest add newsletter-form --skip-existing
```

Call the installed partial from a Handlebars template:

```handlebars
{{> "components/newsletter-form"}}
```

See the [existing theme guide](https://ghostcn.geekbits.dev/docs/getting-started/existing-theme) for stylesheet setup. Updating the CLI does not rewrite your copied components; [review changes](https://ghostcn.geekbits.dev/docs/guides/updating-components) before replacing them.

[Source code](https://github.com/Geekbits-Org/ghost-ui) · [Report an issue](https://github.com/Geekbits-Org/ghost-ui/issues)
