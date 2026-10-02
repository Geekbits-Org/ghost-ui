# Ghostcn documentation website

The editable source lives in this repository. The npm package contains only the CLI and component registry, not the documentation website.

```sh
npm run docs:build
npm run docs:check
npm run docs:browser
npm run docs:dev
```

Open the local URL printed by the server. Re-run the build and reload after edits; the static preview server does not hot-reload source files.

- `content.mjs`: getting started, existing-theme setup, styling, Ghost integration, and release notes.
- `assets/`: the documentation layout, copy/preview controls, and safe demo interactions.
- `scripts/build-docs.mjs`: static pages and real Tailwind CSS compilation.
- `scripts/component-preview.mjs`: registry-driven demo rendering and usage examples.
- `dist/`: generated output, intentionally ignored by the canonical repository.
- `.openai/hosting.json`: the exact Site identity and static output configuration.

Component pages and styling-parameter tables are generated from `registry/components/*.json`. The preview helpers use clearly identified demo posts, authors and tiers; they are not a Ghost server. Forms and navigation are intercepted so previews never collect emails, send requests, or start checkout. On an installed theme, Ghost supplies its real helpers and membership services.

The documentation Site is **private for owner review**. Do not change its audience unless the owner explicitly requests it. Do not add its private URL as the public npm homepage.

## Publishing

Build and check first. Run `node scripts/prepare-docs-site.mjs` to prepare the isolated ignored checkout at `.sites-runtime/docs-publish`. This keeps Sites source history separate without changing the Ghostcn GitHub origin. The full editable source remains in `ghost-ui`; Sites receives the generated static snapshot and the same hosting manifest.

For an existing Site, open/synchronize that checkout with the hosting workflow **before** preparing the updated snapshot. Preserve the opening result for the publishing call.

Use the Sites hosting skill's native publishing workflow with the project ID from `.openai/hosting.json`. Obtain a short-lived write credential, pass it to the bundled `site-workflow.mjs` on hidden stdin, and package the prepared checkout. Save/deploy that exact returned commit/archive using the owner-private operation. Never save credentials to files or command arguments. Confirm deployment status is `succeeded` before handing out the hosted URL.

On Windows, use the installed Git Bash rather than the Windows WSL shim. Prepend Git's `bin` directory to the publishing process's `PATH` and set `TAR_OPTIONS=--force-local` for Windows drive-letter archive paths. If an agent-created publishing checkout has a different Windows owner, trust only that exact checkout with process-scoped Git `safe.directory` configuration; do not disable ownership checks globally. These settings belong to the publishing process, not the theme or system configuration.

New builds preserve the Site identity. Future component changes should rebuild/check the docs and republish the same Site, not register a new one.
