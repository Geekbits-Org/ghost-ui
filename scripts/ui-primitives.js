const { applyStyleSlots } = require('./component-styling');
const { token, surface, cardTitle, focusWithin } = require('./component-defaults');

// Whitelisted native Ghost match blocks. Unknown values use the documented default.
const choice = (key, values, fallback = 'default') => values.filter(value => value !== fallback).reduceRight((otherwise, value) => `{{#match ${key} "${value}"}}${value}{{else}}${otherwise}{{/match}}`, fallback);
const variants = {
  button: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
  card: ['default', 'secondary', 'outline'],
  badge: ['default', 'secondary', 'outline', 'destructive'],
  input: ['default', 'filled'],
  alert: ['default', 'secondary', 'outline', 'destructive'],
  avatar: ['default', 'rounded', 'outline'],
  accordion: ['default', 'secondary', 'outline', 'ghost']
};
const sizes = ['sm', 'default', 'lg'];
const modifiers = name => `data-variant="${choice('variant', variants[name])}" data-size="${choice('size', sizes)}"`;
const base = selector => `${selector} { box-sizing: border-box; font-family: inherit; font-size: ${token('text-body')}; line-height: 1.5; color: var(--foreground); }
${selector}, ${selector} * { box-sizing: border-box; }
${selector}:where([data-size="sm"]) { font-size: 14px; }
${selector}:where([data-size="lg"]) { font-size: 18px; }
${focusWithin(selector)}`;
const control = `min-height: ${token('control-height')}; padding: ${token('control-padding')}; border-radius: ${token('control-radius')}; font-size: ${token('text-small')}; line-height: 1.25;`;
const controlSizes = selector => `${selector}:where([data-size="sm"]) { min-height: 34px; padding: 5px 11px; font-size: 13px; }
${selector}:where([data-size="lg"]) { min-height: 46px; padding: 10px 17px; font-size: 16px; }`;

function primitive(name, description, markup, css, slots, parameters) {
  return applyStyleSlots({
    name, type: 'components:ui', description, dependencies: [], ghost_version: '>=5.0.0',
    parameters: {
      variant: { description: 'Visual treatment; unknown values fall back to default.', options: variants[name], default: 'default' },
      size: { description: 'Component scale; unknown values fall back to default.', options: sizes, default: 'default' },
      ...parameters
    },
    files: [
      { name: `${name}.hbs`, type: 'partial', target: `partials/components/${name}.hbs`, content: markup },
      { name: `${name}.css`, type: 'style', target: `assets/css/components/${name}.css`, content: css }
    ]
  }, slots);
}

const buttonAttributes = `${modifiers('button')} {{#if ariaLabel}}aria-label="{{ariaLabel}}"{{/if}} {{#if id}}id="{{id}}"{{/if}}`;
const button = primitive('button', 'A native button or link with variants, sizes and per-instance classes.', `{{#if href}}
<a class="ghcn-ui-button" ${buttonAttributes} {{#if disabled}}role="link" aria-disabled="true" tabindex="-1"{{else}}href="{{href}}" {{#if dataPortal}}data-portal="{{dataPortal}}"{{/if}}{{/if}}>{{#if text}}{{text}}{{else}}Button{{/if}}</a>
{{else}}
<button class="ghcn-ui-button" ${buttonAttributes} type="${choice('type', ['button', 'submit', 'reset'], 'button')}" {{#if disabled}}disabled{{/if}}>{{#if text}}{{text}}{{else}}Button{{/if}}</button>
{{/if}}`, `${base('.ghcn-ui-button')}
.ghcn-ui-button { ${control} display: inline-flex; align-items: center; justify-content: center; gap: ${token('control-gap')}; border: 1px solid transparent; background: var(--primary); color: var(--primary-foreground); font-weight: 600; text-decoration: none; cursor: pointer; transition: opacity 150ms ease, background-color 150ms ease, border-color 150ms ease; }
.ghcn-ui-button:hover { opacity: .9; }
${controlSizes('.ghcn-ui-button')}
.ghcn-ui-button:where([data-variant="secondary"]) { background: var(--secondary); color: var(--secondary-foreground); }
.ghcn-ui-button:where([data-variant="outline"]) { background: transparent; color: var(--foreground); border-color: var(--border); }
.ghcn-ui-button:where([data-variant="outline"]):hover { background: var(--muted); opacity: 1; }
.ghcn-ui-button:where([data-variant="ghost"]), .ghcn-ui-button:where([data-variant="link"]) { background: transparent; color: var(--foreground); }
.ghcn-ui-button:where([data-variant="ghost"]):hover { background: var(--muted); opacity: 1; }
.ghcn-ui-button:where([data-variant="link"]) { color: var(--primary); text-decoration: underline; text-underline-offset: 3px; }
.ghcn-ui-button:where([data-variant="destructive"]) { background: var(--destructive); color: var(--destructive-foreground); }
.ghcn-ui-button:disabled, .ghcn-ui-button[aria-disabled="true"] { opacity: .5; cursor: not-allowed; }
@media (prefers-reduced-motion: reduce) { .ghcn-ui-button { transition: none; } }
`, { class: ['ghcn-ui-button'] }, {
  text: { description: 'Visible, escaped label.', default: 'Button' },
  href: { description: 'Trusted link URL. Omit to render a button.' },
  type: { description: 'Button type (ignored for links).', options: ['button', 'submit', 'reset'], default: 'button' },
  disabled: { description: 'Boolean. Disables a button or removes navigation from a link.' },
  ariaLabel: { description: 'Optional accessible name.' },
  dataPortal: { description: 'Optional native Ghost Portal action for enabled links.' }
});

const card = primitive('card', 'A composable content card with optional heading, description and footer.', `<div class="ghcn-ui-card" ${modifiers('card')}>
  {{#if heading}}<h3 class="ghcn-ui-card__title">{{heading}}</h3>{{/if}}
  {{#if description}}<p class="ghcn-ui-card__description">{{description}}</p>{{/if}}
  <div class="ghcn-ui-card__content">{{#> @partial-block}}{{body}}{{/@partial-block}}</div>
  {{#if footer}}<div class="ghcn-ui-card__footer">{{footer}}</div>{{/if}}
</div>`, `${base('.ghcn-ui-card')}
.ghcn-ui-card { ${surface} padding: ${token('panel-padding')}; }
.ghcn-ui-card:where([data-size="sm"]) { padding: 16px; }
.ghcn-ui-card:where([data-size="lg"]) { padding: 28px; }
.ghcn-ui-card:where([data-variant="secondary"]) { background: var(--secondary); color: var(--secondary-foreground); }
.ghcn-ui-card:where([data-variant="outline"]) { background: transparent; }
.ghcn-ui-card__title { ${cardTitle} margin: 0 0 8px; }
.ghcn-ui-card__description { color: inherit; font-size: ${token('text-small')}; margin: 0 0 16px; }
.ghcn-ui-card__content:empty { display: none; }
.ghcn-ui-card__footer { margin-top: 1em; padding-top: 1em; border-top: 1px solid var(--border); }
`, { class: ['ghcn-ui-card'], titleClass: ['ghcn-ui-card__title'], descriptionClass: ['ghcn-ui-card__description'], contentClass: ['ghcn-ui-card__content'], footerClass: ['ghcn-ui-card__footer'] }, {
  heading: { description: 'Optional card heading (h3).' }, description: { description: 'Optional introductory text.' },
  body: { description: 'Escaped text body when called as an ordinary partial.' },
  footer: { description: 'Optional escaped footer text.' }
});

const badge = primitive('badge', 'A small non-interactive label with variants and sizes.', `<span class="ghcn-ui-badge" ${modifiers('badge')}>{{#if text}}{{text}}{{else}}Label{{/if}}</span>`, `${base('.ghcn-ui-badge')}
.ghcn-ui-badge { display: inline-flex; align-items: center; padding: 3px 9px; border: 1px solid var(--border); border-radius: 999px; background: var(--secondary); color: var(--secondary-foreground); font-size: 12px; font-weight: 600; line-height: 1.25; }
.ghcn-ui-badge:where([data-size="sm"]) { font-size: 11px; padding: 2px 7px; }
.ghcn-ui-badge:where([data-size="lg"]) { font-size: 14px; padding: 4px 10px; }
.ghcn-ui-badge:where([data-variant="secondary"]) { background: var(--muted); color: var(--muted-foreground); border-color: transparent; }
.ghcn-ui-badge:where([data-variant="outline"]) { background: transparent; color: var(--foreground); border-color: var(--border); }
.ghcn-ui-badge:where([data-variant="destructive"]) { background: var(--destructive); color: var(--destructive-foreground); }
`, { class: ['ghcn-ui-badge'] }, { text: { description: 'Escaped badge label.', default: 'Label' } });

const input = primitive('input', 'An accessible labeled native input, with optional hint and invalid/disabled states.', `<div class="ghcn-ui-field" ${modifiers('input')}>
  <label class="ghcn-ui-field__label"><span class="ghcn-ui-field__label-text">{{#if label}}{{label}}{{else}}Input{{/if}}{{#if required}} (required){{/if}}</span>
    <input class="ghcn-ui-field__input" type="${choice('type', ['text', 'email', 'search', 'url', 'number', 'password'], 'text')}"{{#if id}} id="{{id}}"{{/if}}{{#if name}} name="{{name}}"{{/if}}{{#if value}} value="{{value}}"{{/if}}{{#if placeholder}} placeholder="{{placeholder}}"{{/if}}{{#if autocomplete}} autocomplete="{{autocomplete}}"{{/if}}{{#if required}} required{{/if}}{{#if disabled}} disabled{{/if}}{{#if invalid}} aria-invalid="true"{{/if}}{{#if hint}}{{#if hintId}} aria-describedby="{{hintId}}"{{/if}}{{/if}} />
  </label>
  {{#if hint}}<p class="ghcn-ui-field__hint"{{#if hintId}} id="{{hintId}}"{{/if}}>{{hint}}</p>{{/if}}
</div>`, `${base('.ghcn-ui-field')}
.ghcn-ui-field { width: 100%; }
.ghcn-ui-field__label { display: grid; gap: .375em; font-weight: 500; }
.ghcn-ui-field__input { ${control} width: 100%; min-width: 0; border: 1px solid var(--input); background: var(--background); color: var(--foreground); font-family: inherit; transition: border-color 150ms ease, background-color 150ms ease; }
:where(.ghcn-ui-field[data-size="sm"]) .ghcn-ui-field__input { min-height: 34px; padding: 5px 11px; font-size: 13px; }
:where(.ghcn-ui-field[data-size="lg"]) .ghcn-ui-field__input { min-height: 46px; padding: 10px 17px; font-size: 16px; }
:where(.ghcn-ui-field[data-variant="filled"]) .ghcn-ui-field__input { background: var(--muted); }
.ghcn-ui-field__input::placeholder { color: var(--muted-foreground); }
.ghcn-ui-field__input[aria-invalid="true"] { border-color: var(--destructive); }
.ghcn-ui-field__input:disabled { opacity: .5; cursor: not-allowed; }
.ghcn-ui-field__hint { color: var(--muted-foreground); font-size: .875em; margin: .5em 0 0; }
@media (prefers-reduced-motion: reduce) { .ghcn-ui-field__input { transition: none; } }
`, { class: ['ghcn-ui-field'], labelClass: ['ghcn-ui-field__label-text'], inputClass: ['ghcn-ui-field__input'], descriptionClass: ['ghcn-ui-field__hint'] }, {
  label: { description: 'Visible accessible label.', default: 'Input' },
  type: { description: 'Native input type.', options: ['text', 'email', 'search', 'url', 'number', 'password'], default: 'text' },
  id: { description: 'Optional unique input ID.' },
  name: { description: 'Form field name.' }, value: { description: 'Initial field value.' }, placeholder: { description: 'Optional placeholder (not a label).' },
  autocomplete: { description: 'Optional HTML autocomplete token (for example: email).' },
  hint: { description: 'Optional help text.' }, hintId: { description: 'Unique ID for help text; provide with hint for aria-describedby.' },
  invalid: { description: 'Boolean invalid state.' }, required: { description: 'Boolean required state.' }, disabled: { description: 'Boolean disabled state.' }
});

const alert = primitive('alert', 'An accessible status message with an optional urgent announcement.', `<div class="ghcn-ui-alert" ${modifiers('alert')} role="{{#if urgent}}alert{{else}}status{{/if}}">
  {{#if heading}}<h3 class="ghcn-ui-alert__title">{{heading}}</h3>{{/if}}
  <p class="ghcn-ui-alert__description">{{#if description}}{{description}}{{else}}An update for your readers.{{/if}}</p>
</div>`, `${base('.ghcn-ui-alert')}
.ghcn-ui-alert { ${surface} padding: 16px; }
.ghcn-ui-alert:where([data-size="sm"]) { padding: 12px; }
.ghcn-ui-alert:where([data-size="lg"]) { padding: ${token('panel-padding')}; }
.ghcn-ui-alert:where([data-variant="secondary"]) { background: var(--secondary); color: var(--secondary-foreground); }
.ghcn-ui-alert:where([data-variant="outline"]) { background: transparent; }
.ghcn-ui-alert:where([data-variant="destructive"]) { border-color: var(--destructive); color: var(--destructive); }
.ghcn-ui-alert__title { font-size: 1em; margin: 0 0 .375em; font-weight: 600; }
.ghcn-ui-alert__description { margin: 0; }
`, { class: ['ghcn-ui-alert'], titleClass: ['ghcn-ui-alert__title'], descriptionClass: ['ghcn-ui-alert__description'] }, {
  heading: { description: 'Optional status heading.' }, description: { description: 'Escaped status text.' }, urgent: { description: 'Boolean. Use role=alert for urgent, dynamically inserted errors only.' }
});

const avatarInner = `{{#if src}}<img class="ghcn-ui-avatar__image" src="{{img_url src size="xs"}}" alt="{{#unless decorative}}{{#if name}}{{name}}{{/if}}{{/unless}}" loading="lazy" />{{else if profile_image}}<img class="ghcn-ui-avatar__image" src="{{img_url profile_image size="xs"}}" alt="{{#unless decorative}}{{#if name}}{{name}}{{/if}}{{/unless}}" loading="lazy" />{{else}}<span class="ghcn-ui-avatar__fallback"{{#if decorative}} aria-hidden="true"{{else}}{{#if name}} role="img" aria-label="{{name}}"{{/if}}{{/if}}>{{#if name}}{{name.[0]}}{{else}}?{{/if}}</span>{{/if}}`;
const avatar = primitive('avatar', 'A reusable author or user avatar with image and initials fallback.', `{{#if href}}
<a class="ghcn-ui-avatar" ${modifiers('avatar')} href="{{href}}"{{#if name}} aria-label="{{name}}"{{/if}}>${avatarInner}</a>
{{else}}
<span class="ghcn-ui-avatar" ${modifiers('avatar')}>${avatarInner}</span>
{{/if}}`, `${base('.ghcn-ui-avatar')}
.ghcn-ui-avatar { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; flex: 0 0 auto; overflow: hidden; border-radius: 9999px; border: 1px solid var(--border); background: var(--muted); color: var(--foreground); text-decoration: none; vertical-align: middle; }
.ghcn-ui-avatar:where([data-size="sm"]) { width: 28px; height: 28px; font-size: 12px; }
.ghcn-ui-avatar:where([data-size="lg"]) { width: 56px; height: 56px; font-size: 20px; }
.ghcn-ui-avatar:where([data-variant="rounded"]) { border-radius: ${token('control-radius')}; }
.ghcn-ui-avatar:where([data-variant="outline"]) { border: 2px solid var(--primary); padding: 2px; background: var(--background); }
.ghcn-ui-avatar:where([data-variant="outline"]) .ghcn-ui-avatar__image, .ghcn-ui-avatar:where([data-variant="outline"]) .ghcn-ui-avatar__fallback { border-radius: inherit; }
.ghcn-ui-avatar__image { display: block; width: 100%; height: 100%; object-fit: cover; }
.ghcn-ui-avatar__fallback { display: inline-flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-weight: 700; text-transform: uppercase; user-select: none; }
`, { class: ['ghcn-ui-avatar'], imageClass: ['ghcn-ui-avatar__image', 'ghcn-ui-avatar__fallback'] }, {
  src: { description: 'Image URL; falls back to profile_image inside a Ghost author context.' },
  name: { description: 'Display name used for alt text and initials fallback.' },
  href: { description: 'Optional trusted profile URL.' },
  decorative: { description: 'Boolean. Hide avatar alt/initial from screen readers when placed next to a visible name.' }
});

const accordion = primitive('accordion', 'Zero-JS collapsible disclosure built on native details and summary elements.', `<details class="ghcn-ui-accordion" ${modifiers('accordion')}{{#if open}} open{{/if}}{{#if name}} name="{{name}}"{{/if}}>
  <summary class="ghcn-ui-accordion__trigger">
    <span class="ghcn-ui-accordion__title">{{#if heading}}{{heading}}{{else}}More details{{/if}}</span>
    <svg class="ghcn-ui-accordion__icon" aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m5 7.5 5 5 5-5"/></svg>
  </summary>
  <div class="ghcn-ui-accordion__content">{{#> @partial-block}}{{#if body}}<p>{{body}}</p>{{/if}}{{/@partial-block}}</div>
</details>`, `${base('.ghcn-ui-accordion')}
.ghcn-ui-accordion { ${surface} overflow: hidden; }
.ghcn-ui-accordion:where([data-variant="secondary"]) { background: var(--secondary); color: var(--secondary-foreground); }
.ghcn-ui-accordion:where([data-variant="outline"]) { background: transparent; }
.ghcn-ui-accordion:where([data-variant="ghost"]) { background: transparent; border-width: 0 0 1px; border-radius: 0; }
.ghcn-ui-accordion__trigger { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; padding: 14px 18px; list-style: none; cursor: pointer; font-weight: 600; color: inherit; }
.ghcn-ui-accordion__trigger::-webkit-details-marker { display: none; }
.ghcn-ui-accordion:where([data-size="sm"]) .ghcn-ui-accordion__trigger { padding: 10px 14px; font-size: 14px; }
.ghcn-ui-accordion:where([data-size="lg"]) .ghcn-ui-accordion__trigger { padding: 18px 22px; font-size: 18px; }
.ghcn-ui-accordion:where([data-variant="ghost"]) .ghcn-ui-accordion__trigger { padding-inline: 0; }
.ghcn-ui-accordion__icon { flex: 0 0 auto; color: var(--muted-foreground); transition: transform 180ms ease; }
.ghcn-ui-accordion[open] > .ghcn-ui-accordion__trigger .ghcn-ui-accordion__icon { transform: rotate(180deg); }
.ghcn-ui-accordion__content { padding: 0 18px 16px; color: var(--muted-foreground); font-size: ${token('text-small')}; }
.ghcn-ui-accordion:where([data-size="sm"]) .ghcn-ui-accordion__content { padding: 0 14px 12px; }
.ghcn-ui-accordion:where([data-size="lg"]) .ghcn-ui-accordion__content { padding: 0 22px 20px; font-size: ${token('text-body')}; }
.ghcn-ui-accordion:where([data-variant="ghost"]) .ghcn-ui-accordion__content { padding-inline: 0; }
.ghcn-ui-accordion__content > :first-child { margin-top: 0; }
.ghcn-ui-accordion__content > :last-child { margin-bottom: 0; }
@media (prefers-reduced-motion: reduce) { .ghcn-ui-accordion__icon { transition: none; } }
`, { class: ['ghcn-ui-accordion'], triggerClass: ['ghcn-ui-accordion__trigger'], contentClass: ['ghcn-ui-accordion__content'] }, {
  heading: { description: 'Visible summary heading.', default: 'More details' },
  body: { description: 'Escaped text body when called as an ordinary partial.' },
  open: { description: 'Boolean. Expand the disclosure by default.' },
  name: { description: 'Optional shared group name for native exclusive accordions.' }
});

module.exports = [button, card, badge, input, alert, avatar, accordion];
