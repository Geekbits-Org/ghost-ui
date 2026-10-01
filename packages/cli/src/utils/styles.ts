/** Tailwind utilities must outrank portable component defaults, regardless of link order. */
export function componentCss(content: string, style: 'tailwind' | 'css'): string {
  return style === 'tailwind' ? `@layer theme, base, components, utilities;\n@layer components {\n${content}\n}\n` : content;
}

export function tailwindTheme(): string {
  const colors = ['background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
    'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input', 'ring'];
  return `@theme inline {\n${colors.map(color => `  --color-${color}: var(--${color});`).join('\n')}\n  --radius-ghostcn: var(--radius);\n}\n
@custom-variant dark {
  &:where(.dark, .dark *, .dark-mode, .dark-mode *, [data-theme="dark"], [data-theme="dark"] *) { @slot; }
  @media (prefers-color-scheme: dark) {
    &:where(.auto-color, .auto-color *) { @slot; }
  }
}\n`;
}
