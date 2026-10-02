# Changelog

## 1.4.0 — 2026-10-02 (prepared; not published by this workflow)

- Added `related-posts`, `post-navigation`, `table-of-contents`, and `tag-list`, with universal root classes and documented internal styling slots for Tailwind and vanilla CSS.
- Reading components exclude the current story, hide internal tags, omit unavailable neighbors and empty results, and support repeated differently styled instances.
- The TOC progressively enhances article H2/H3 headings, excludes editor-card UI headings, creates collision-safe anchors, and moves keyboard focus to the selected heading. Its deferred script is automatically linked in the default layout; other layouts receive manual linking instructions.
- Added read-only `ghostcn diff [component]` with summary/JSON output, explicit remote `--latest` comparisons, installed content baselines, local-edit/conflict detection, and bounded line diffs. No automatic overwrite or merge is performed.
- Installer and comparison share target resolution; unsafe and symlinked targets are rejected before writes. Skipped customizations do not become fabricated upstream baselines.
- Added registry-driven documentation and customization previews for all 14 components, with setup, integration, and safe-update guides. The review website remains owner-private.
- Added an isolated real-Ghost Chromium suite and CI job covering both styling systems, Light/Dark/Auto, desktop/mobile, Koenig cards, native comments, signed free/paid-member access, and disabled/invite-only membership. Payment/email writes are blocked; this is not live payment or codec validation.

### Migration

Updating the CLI does not replace existing component files. Commit your theme and run `ghostcn diff`; manually merge selected changes. Legacy installations without `.ghostcn/installed.json` are reported as untracked. Keep the baseline file with your theme. `add -y` remains an intentional overwrite, not a conflict-resolving update.

## 1.3.0 — 2026-10-01

- All 10 components accept per-instance root `class`, with documented slots for internal cards, grids, titles, content, inputs and theme-owned buttons where applicable.
- Styling parameters remain bound to the caller through Ghost `get`, `foreach` and author contexts. Multiple differently styled instances remain independent; class values are HTML-escaped.
- Visual defaults for newsletter, author and post cards now live in component CSS, avoiding conflicting default Tailwind utilities. No custom Ghost helper or runtime dependency is needed.
- Featured blocks no longer use a fixed heading ID, making repeated instances accessible without duplicate identifiers.
- Added registry slot metadata, usage examples for Tailwind/vanilla, and regression coverage for nested contexts, styling overrides and reinstallation preserving call-site styles.
- Existing copied components need a deliberate merge/re-add to gain parameter support. Theme-owned template/CSS customizations remain outside component overwrite targets.

## 1.2.0 — 2026-10-01

- Ordinary Tailwind utilities now override component defaults without important modifiers. Every Tailwind stylesheet declares consistent layer order, preserving defaults against preflight regardless of link order.
- Generated Tailwind themes expose semantic colors/radius and Ghost light, dark and OS-following variants. Vanilla themes remain standalone and load custom theme styles after component defaults.
- Pricing reads active public Ghost tiers, currency, monthly/yearly prices and benefits, with tier-specific Portal checkout links. No sample prices or invented benefits.
- Membership UI respects disabled, invite-only, self-signup and paid-members settings. Newsletter forms use Portal when signup terms require a checkbox.
- Newsletter success/error messages are no longer blocked by Tailwind's hidden utility. Email inputs have repeat-safe accessible labels and status announcements.
- Generated themes use one custom paywall partial for protected content, preserving Ghost's access control and public preview.
- Starter CSS keeps Ghost's native comments iframe transparent in dark mode, avoiding an opaque white canvas behind light discussion text. The compatibility rule targets comments only, in both Tailwind and vanilla starters.
- Added `ghostcn doctor` for offline configuration, asset, partial and stylesheet checks, and `ghostcn pack` for runtime-only ZIPs.
- Generated themes include `npm run zip` (build then package), clearer local Ghost activation instructions, upload steps, and customization guidance. Starters require Ghost 5.54.1+; their package metadata specifies build-time Node requirements.
- Added real Tailwind compilation, rendered membership-state and packaging regression tests, plus an isolated release preview/validator harness.

### Existing themes

Updating the npm CLI does not rewrite copied theme files. Back up your theme, compare a freshly generated theme, and merge deliberately. Rerunning init regenerates tokens; re-adding components with `-y` overwrites component customizations. Existing Tailwind themes need their own working `.hbs` build and should import the generated `ghostcn-tailwind.css` for v4 semantic utilities. Unlayered host rules can still outrank layered CSS.

### Validation scope

Validated generated Tailwind/vanilla themes and their ZIPs against Ghost 6 using gscan 6.4.2, and their folders against Ghost 5. Browser checks cover desktop/mobile, keyboard navigation, explicit/automatic dark mode, rendered membership states and newsletter states; Casper CSS was checked in vanilla mode at its 10px root font. Native comments were checked using a live public Ghost post with both starter styles in Light, Dark and preview-simulated Auto light/dark preferences. No live Stripe payment or member email was sent. The comments correction was also applied and rebuilt in the local `publish` test theme without changing Ghost settings.
