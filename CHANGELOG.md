# Changelog

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
