import { componentCss } from './styles';

export type BaseColor = 'zinc' | 'slate' | 'stone' | 'gray' | 'neutral';
export type AccentColor = 'ghost' | 'zinc' | 'indigo' | 'violet' | 'blue' | 'emerald' | 'rose' | 'orange';
export type Radius = '0' | '0.25rem' | '0.5rem' | '0.75rem' | '1rem' | '9999px';

export interface ThemeConfig {
  style: 'tailwind' | 'css';
  baseColor: BaseColor;
  accentColor: AccentColor;
  radius: Radius;
}

interface ColorTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

export const BASE_PALETTES: Record<BaseColor, { light: ColorTokens; dark: ColorTokens }> = {
  zinc: {
    light: {
      background: '#ffffff',
      foreground: '#09090b',
      card: '#ffffff',
      cardForeground: '#09090b',
      popover: '#ffffff',
      popoverForeground: '#09090b',
      secondary: '#f4f4f5',
      secondaryForeground: '#18181b',
      muted: '#f4f4f5',
      mutedForeground: '#71717a',
      accent: '#f4f4f5',
      accentForeground: '#18181b',
      destructive: '#ef4444',
      destructiveForeground: '#fafafa',
      border: '#e4e4e7',
      input: '#e4e4e7',
      ring: '#18181b'
    },
    dark: {
      background: '#09090b',
      foreground: '#fafafa',
      card: '#09090b',
      cardForeground: '#fafafa',
      popover: '#09090b',
      popoverForeground: '#fafafa',
      secondary: '#27272a',
      secondaryForeground: '#fafafa',
      muted: '#27272a',
      mutedForeground: '#a1a1aa',
      accent: '#27272a',
      accentForeground: '#fafafa',
      destructive: '#7f1d1d',
      destructiveForeground: '#fafafa',
      border: '#27272a',
      input: '#27272a',
      ring: '#d4d4d8'
    }
  },
  slate: {
    light: {
      background: '#ffffff',
      foreground: '#020817',
      card: '#ffffff',
      cardForeground: '#020817',
      popover: '#ffffff',
      popoverForeground: '#020817',
      secondary: '#f1f5f9',
      secondaryForeground: '#0f172a',
      muted: '#f1f5f9',
      mutedForeground: '#64748b',
      accent: '#f1f5f9',
      accentForeground: '#0f172a',
      destructive: '#ef4444',
      destructiveForeground: '#f8fafc',
      border: '#e2e8f0',
      input: '#e2e8f0',
      ring: '#0f172a'
    },
    dark: {
      background: '#020817',
      foreground: '#f8fafc',
      card: '#020817',
      cardForeground: '#f8fafc',
      popover: '#020817',
      popoverForeground: '#f8fafc',
      secondary: '#1e293b',
      secondaryForeground: '#f8fafc',
      muted: '#1e293b',
      mutedForeground: '#94a3b8',
      accent: '#1e293b',
      accentForeground: '#f8fafc',
      destructive: '#7f1d1d',
      destructiveForeground: '#f8fafc',
      border: '#1e293b',
      input: '#1e293b',
      ring: '#cbd5e1'
    }
  },
  stone: {
    light: {
      background: '#ffffff',
      foreground: '#0c0a09',
      card: '#ffffff',
      cardForeground: '#0c0a09',
      popover: '#ffffff',
      popoverForeground: '#0c0a09',
      secondary: '#f5f5f4',
      secondaryForeground: '#1c1917',
      muted: '#f5f5f4',
      mutedForeground: '#78716c',
      accent: '#f5f5f4',
      accentForeground: '#1c1917',
      destructive: '#ef4444',
      destructiveForeground: '#fafaf9',
      border: '#e7e5e4',
      input: '#e7e5e4',
      ring: '#1c1917'
    },
    dark: {
      background: '#0c0a09',
      foreground: '#fafaf9',
      card: '#0c0a09',
      cardForeground: '#fafaf9',
      popover: '#0c0a09',
      popoverForeground: '#fafaf9',
      secondary: '#292524',
      secondaryForeground: '#fafaf9',
      muted: '#292524',
      mutedForeground: '#a8a29e',
      accent: '#292524',
      accentForeground: '#fafaf9',
      destructive: '#7f1d1d',
      destructiveForeground: '#fafaf9',
      border: '#292524',
      input: '#292524',
      ring: '#d6d3d1'
    }
  },
  gray: {
    light: {
      background: '#ffffff',
      foreground: '#111827',
      card: '#ffffff',
      cardForeground: '#111827',
      popover: '#ffffff',
      popoverForeground: '#111827',
      secondary: '#f3f4f6',
      secondaryForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      accent: '#f3f4f6',
      accentForeground: '#1f2937',
      destructive: '#ef4444',
      destructiveForeground: '#f9fafb',
      border: '#e5e7eb',
      input: '#e5e7eb',
      ring: '#1f2937'
    },
    dark: {
      background: '#030712',
      foreground: '#f9fafb',
      card: '#030712',
      cardForeground: '#f9fafb',
      popover: '#030712',
      popoverForeground: '#f9fafb',
      secondary: '#1f2937',
      secondaryForeground: '#f9fafb',
      muted: '#1f2937',
      mutedForeground: '#9ca3af',
      accent: '#1f2937',
      accentForeground: '#f9fafb',
      destructive: '#7f1d1d',
      destructiveForeground: '#f9fafb',
      border: '#1f2937',
      input: '#1f2937',
      ring: '#d1d5db'
    }
  },
  neutral: {
    light: {
      background: '#ffffff',
      foreground: '#0a0a0a',
      card: '#ffffff',
      cardForeground: '#0a0a0a',
      popover: '#ffffff',
      popoverForeground: '#0a0a0a',
      secondary: '#f5f5f5',
      secondaryForeground: '#171717',
      muted: '#f5f5f5',
      mutedForeground: '#737373',
      accent: '#f5f5f5',
      accentForeground: '#171717',
      destructive: '#ef4444',
      destructiveForeground: '#fafafa',
      border: '#e5e5e5',
      input: '#e5e5e5',
      ring: '#171717'
    },
    dark: {
      background: '#0a0a0a',
      foreground: '#fafafa',
      card: '#0a0a0a',
      cardForeground: '#fafafa',
      popover: '#0a0a0a',
      popoverForeground: '#fafafa',
      secondary: '#262626',
      secondaryForeground: '#fafafa',
      muted: '#262626',
      mutedForeground: '#a3a3a3',
      accent: '#262626',
      accentForeground: '#fafafa',
      destructive: '#7f1d1d',
      destructiveForeground: '#fafafa',
      border: '#262626',
      input: '#262626',
      ring: '#d4d4d4'
    }
  }
};

export const ACCENT_COLORS: Record<
  AccentColor,
  { light: { primary: string; primaryForeground: string; ring?: string }; dark: { primary: string; primaryForeground: string; ring?: string } }
> = {
  ghost: {
    light: {
      primary: 'var(--ghost-accent-color, #18181b)',
      primaryForeground: '#ffffff',
      ring: 'var(--ghost-accent-color, #18181b)'
    },
    dark: {
      primary: 'var(--ghost-accent-color, #fafafa)',
      primaryForeground: '#09090b',
      ring: 'var(--ghost-accent-color, #d4d4d8)'
    }
  },
  zinc: {
    light: { primary: '#18181b', primaryForeground: '#fafafa', ring: '#18181b' },
    dark: { primary: '#fafafa', primaryForeground: '#18181b', ring: '#d4d4d8' }
  },
  indigo: {
    light: { primary: '#4f46e5', primaryForeground: '#ffffff', ring: '#4f46e5' },
    dark: { primary: '#6366f1', primaryForeground: '#ffffff', ring: '#6366f1' }
  },
  violet: {
    light: { primary: '#7c3aed', primaryForeground: '#ffffff', ring: '#7c3aed' },
    dark: { primary: '#8b5cf6', primaryForeground: '#ffffff', ring: '#8b5cf6' }
  },
  blue: {
    light: { primary: '#2563eb', primaryForeground: '#ffffff', ring: '#2563eb' },
    dark: { primary: '#3b82f6', primaryForeground: '#ffffff', ring: '#3b82f6' }
  },
  emerald: {
    light: { primary: '#059669', primaryForeground: '#ffffff', ring: '#059669' },
    dark: { primary: '#10b981', primaryForeground: '#ffffff', ring: '#10b981' }
  },
  rose: {
    light: { primary: '#e11d48', primaryForeground: '#ffffff', ring: '#e11d48' },
    dark: { primary: '#f43f5e', primaryForeground: '#ffffff', ring: '#f43f5e' }
  },
  orange: {
    light: { primary: '#ea580c', primaryForeground: '#ffffff', ring: '#ea580c' },
    dark: { primary: '#f97316', primaryForeground: '#ffffff', ring: '#f97316' }
  }
};

export function generateThemeCss(config: ThemeConfig): string {
  const base = BASE_PALETTES[config.baseColor] || BASE_PALETTES.zinc;
  const accent = ACCENT_COLORS[config.accentColor] || ACCENT_COLORS.ghost;
  const radius = config.radius || '0.5rem';
  const darkTokens = `
  color-scheme: dark;
  --background: ${base.dark.background};
  --foreground: ${base.dark.foreground};
  --card: ${base.dark.card};
  --card-foreground: ${base.dark.cardForeground};
  --popover: ${base.dark.popover};
  --popover-foreground: ${base.dark.popoverForeground};
  --primary: ${accent.dark.primary};
  --primary-foreground: ${accent.dark.primaryForeground};
  --secondary: ${base.dark.secondary};
  --secondary-foreground: ${base.dark.secondaryForeground};
  --muted: ${base.dark.muted};
  --muted-foreground: ${base.dark.mutedForeground};
  --accent: ${base.dark.accent};
  --accent-foreground: ${base.dark.accentForeground};
  --destructive: ${base.dark.destructive};
  --destructive-foreground: ${base.dark.destructiveForeground};
  --border: ${base.dark.border};
  --input: ${base.dark.input};
  --ring: ${accent.dark.ring || base.dark.ring};`;

  const css = `/*
  ghostcn Design Tokens & Theming System
  Base: ${config.baseColor} | Accent: ${config.accentColor} | Radius: ${radius} | System: ${config.style}
*/

:root {
  color-scheme: light;
  --background: ${base.light.background};
  --foreground: ${base.light.foreground};
  --card: ${base.light.card};
  --card-foreground: ${base.light.cardForeground};
  --popover: ${base.light.popover};
  --popover-foreground: ${base.light.popoverForeground};
  --primary: ${accent.light.primary};
  --primary-foreground: ${accent.light.primaryForeground};
  --secondary: ${base.light.secondary};
  --secondary-foreground: ${base.light.secondaryForeground};
  --muted: ${base.light.muted};
  --muted-foreground: ${base.light.mutedForeground};
  --accent: ${base.light.accent};
  --accent-foreground: ${base.light.accentForeground};
  --destructive: ${base.light.destructive};
  --destructive-foreground: ${base.light.destructiveForeground};
  --border: ${base.light.border};
  --input: ${base.light.input};
  --ring: ${accent.light.ring || base.light.ring};
  --radius: ${radius};

  /* Ghost Native Compatibility Fallbacks */
  --ghost-card-bg: var(--card);
  --ghost-border: var(--border);
  --ghost-heading-color: var(--foreground);
  --ghost-text-muted: var(--muted-foreground);
}

.dark, .dark-mode, [data-theme="dark"] {${darkTokens}
}

/* Casper and other Ghost themes use .auto-color for OS-level dark mode. */
@media (prefers-color-scheme: dark) {
  .auto-color {${darkTokens}
  }
}

/* Semantic fallbacks; Tailwind utilities can override these defaults. */
.bg-background { background-color: var(--background); }
.text-foreground { color: var(--foreground); }
.bg-card { background-color: var(--card); }
.text-card-foreground { color: var(--card-foreground); }
.bg-popover { background-color: var(--popover); }
.text-popover-foreground { color: var(--popover-foreground); }
.bg-primary { background-color: var(--primary); }
.text-primary-foreground { color: var(--primary-foreground); }
.bg-secondary { background-color: var(--secondary); }
.text-secondary-foreground { color: var(--secondary-foreground); }
.bg-muted { background-color: var(--muted); }
.text-muted-foreground { color: var(--muted-foreground); }
.bg-accent { background-color: var(--accent); }
.text-accent-foreground { color: var(--accent-foreground); }
.border-border { border-color: var(--border); }
.border-input { border-color: var(--input); }
.rounded-ghostcn { border-radius: var(--radius); }

/* Shared primitives used by ghostcn components. */
.ghcn-container {
  box-sizing: border-box;
  width: min(100% - 32px, 1152px);
  margin-inline: auto;
}
.ghcn-button,
.ghcn-icon-button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  border: 1px solid transparent;
  border-radius: var(--radius);
  padding: 10px 16px;
  color: var(--primary-foreground);
  background: var(--primary);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 150ms ease, background-color 150ms ease, border-color 150ms ease;
}
.ghcn-button:hover,
.ghcn-icon-button:hover { opacity: 0.9; }
.ghcn-button:focus-visible,
.ghcn-icon-button:focus-visible,
.ghcn-input:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.ghcn-button--outline {
  border-color: var(--border);
  color: var(--foreground);
  background: var(--background);
}
.ghcn-button--ghost {
  color: var(--foreground);
  background: transparent;
}
.ghcn-icon-button {
  width: 40px;
  padding: 0;
}
.ghcn-input {
  box-sizing: border-box;
  min-height: 40px;
  width: 100%;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  padding: 10px 14px;
  color: var(--foreground);
  background: var(--background);
  font: inherit;
  font-size: 14px;
}
.ghcn-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 4px 10px;
  color: var(--primary-foreground);
  background: var(--primary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}
.ghcn-avatar {
  display: block;
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  object-fit: cover;
}
.ghcn-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`;
  return componentCss(css, config.style);
}
