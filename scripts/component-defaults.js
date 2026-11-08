const defaults = require('../packages/cli/src/utils/design-defaults.json');

// Keep copied component CSS self-contained: older themes can use the new
// defaults without rerunning init or regenerating their chosen tokens.
function token(name) {
  if (!Object.hasOwn(defaults, name)) throw new Error(`Unknown Ghostcn design token: ${name}`);
  return `var(--ghcn-${name}, ${defaults[name]})`;
}

const section = `box-sizing: border-box; min-width: 0; margin-block: ${token('section-space')}; font-family: inherit; font-size: ${token('text-body')}; line-height: 1.5; color: var(--foreground);`;
const wideSection = 'width: min(100% - 32px, 1152px); margin-inline: auto;';
const sectionTitle = `font-size: ${token('title-section')}; font-weight: 700; line-height: 1.18; letter-spacing: -.035em; text-wrap: balance;`;
const displayTitle = `font-size: ${token('title-display')}; font-weight: 700; line-height: 1.08; letter-spacing: -.045em; text-wrap: balance; overflow-wrap: anywhere;`;
const surface = `box-sizing: border-box; min-width: 0; overflow-wrap: anywhere; border: 1px solid var(--border, #e4e4e7); border-radius: ${token('panel-radius')}; background: var(--card, #fff); color: var(--card-foreground, #09090b);`;
const cardTitle = `font-size: ${token('title-card')}; font-weight: 650; line-height: 1.3; letter-spacing: -.025em; color: inherit;`;
const focus = 'outline: 2px solid var(--ring, currentColor); outline-offset: 2px;';
const focusWithin = selector => `${selector}:focus-visible, :where(${selector}) :focus-visible { ${focus} }`;
const grid = (minimum = 280) => `display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, ${minimum}px), 1fr)); gap: ${token('grid-gap')};`;

module.exports = { token, section, wideSection, sectionTitle, displayTitle, surface, cardTitle, focus, focusWithin, grid };
