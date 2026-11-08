const { applyStyleSlots } = require('./component-styling');
const { token, surface, cardTitle, focusWithin } = require('./component-defaults');

// Whitelisted native Ghost match blocks. Unknown values use the documented default.
const choice = (key, values, fallback = 'default') => values.filter(value => value !== fallback).reduceRight((otherwise, value) => `{{#match ${key} "${value}"}}${value}{{else}}${otherwise}{{/match}}`, fallback);
const variants = {
  button: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
  card: ['default', 'secondary', 'outline'],
  badge: ['default', 'secondary', 'outline', 'destructive'],
  input: ['default', 'filled'],
  alert: ['default', 'secondary', 'outline', 'destructive']
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
.ghcn-ui-button { ${control} display: inline-flex; align-items: center; justify-content: center; gap: ${token('control-gap')}; border: 1px solid transparent; background: var(--primary); color: var(--primary-foreground); font-weight: 600; text-decoration: none; cursor: pointer; }
.ghcn-ui-button:hover { opacity: .9; }
${controlSizes('.ghcn-ui-button')}
.ghcn-ui-button:where([data-variant="secondary"]) { background: var(--secondary); color: var(--secondary-foreground); }
.ghcn-ui-button:where([data-variant="outline"]) { background: transparent; color: var(--foreground); border-color: var(--border); }
.ghcn-ui-button:where([data-variant="ghost"]), .ghcn-ui-button:where([data-variant="link"]) { background: transparent; color: var(--foreground); }
.ghcn-ui-button:where([data-variant="link"]) { color: var(--primary); text-decoration: underline; }
.ghcn-ui-button:where([data-variant="destructive"]) { background: var(--destructive); color: var(--destructive-foreground); }
.ghcn-ui-button:disabled, .ghcn-ui-button[aria-disabled="true"] { opacity: .5; cursor: not-allowed; }
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
    <input class="ghcn-ui-field__input" type="${choice('type', ['text', 'email', 'search', 'url', 'number', 'password'], 'text')}" {{#if name}}name="{{name}}"{{/if}} value="{{value}}" placeholder="{{placeholder}}" {{#if required}}required{{/if}} {{#if disabled}}disabled{{/if}} {{#if invalid}}aria-invalid="true"{{/if}} {{#if hintId}}aria-describedby="{{hintId}}"{{/if}} />
  </label>
  {{#if hint}}<p class="ghcn-ui-field__hint" {{#if hintId}}id="{{hintId}}"{{/if}}>{{hint}}</p>{{/if}}
</div>`, `${base('.ghcn-ui-field')}
.ghcn-ui-field { width: 100%; }
.ghcn-ui-field__label { display: grid; gap: .375em; font-weight: 500; }
.ghcn-ui-field__input { ${control} width: 100%; min-width: 0; border: 1px solid var(--input); background: var(--background); color: var(--foreground); font-family: inherit; }
:where(.ghcn-ui-field[data-size="sm"]) .ghcn-ui-field__input { min-height: 34px; padding: 5px 11px; font-size: 13px; }
:where(.ghcn-ui-field[data-size="lg"]) .ghcn-ui-field__input { min-height: 46px; padding: 10px 17px; font-size: 16px; }
:where(.ghcn-ui-field[data-variant="filled"]) .ghcn-ui-field__input { background: var(--muted); }
.ghcn-ui-field__input::placeholder { color: var(--muted-foreground); }
.ghcn-ui-field__input[aria-invalid="true"] { border-color: var(--destructive); }
.ghcn-ui-field__input:disabled { opacity: .5; cursor: not-allowed; }
.ghcn-ui-field__hint { color: var(--muted-foreground); font-size: .875em; margin: .5em 0 0; }
`, { class: ['ghcn-ui-field'], labelClass: ['ghcn-ui-field__label-text'], inputClass: ['ghcn-ui-field__input'], descriptionClass: ['ghcn-ui-field__hint'] }, {
  label: { description: 'Visible accessible label.', default: 'Input' },
  type: { description: 'Native input type.', options: ['text', 'email', 'search', 'url', 'number', 'password'], default: 'text' },
  name: { description: 'Form field name.' }, value: { description: 'Initial field value.' }, placeholder: { description: 'Optional placeholder (not a label).' },
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

module.exports = [button, card, badge, input, alert];
