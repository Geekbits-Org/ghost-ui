import fs from 'fs';
import path from 'path';
import { generateThemeCss, ThemeConfig } from './theme';
import { safeThemePath, StyleSyncResult, syncGhostcnStyles } from './theme-files';
import { tailwindTheme } from './styles';

export interface GhostcnConfig {
  $schema: string;
  style: ThemeConfig['style'];
  theme: Pick<ThemeConfig, 'baseColor' | 'accentColor' | 'radius'>;
  aliases: {
    partials: string;
    styles: string;
    js?: string;
  };
  cssFile: string;
}

export interface InitializeThemeOptions {
  themeRoot: string;
  config: GhostcnConfig;
}

export interface InitializeThemeResult {
  configPath: string;
  cssPath: string;
  styleSync: StyleSyncResult;
}

export function buildGhostcnConfig(
  theme: ThemeConfig,
  paths: {
    partials?: string;
    styles?: string;
    js?: string;
    cssFile?: string;
  } = {}
): GhostcnConfig {
  const normalized = (value: string | undefined, fallback: string) => value?.trim().replace(/\\/g, '/') || fallback;
  return {
    $schema: 'https://ghostcn.geekbits.dev/schema.json',
    style: theme.style,
    theme: {
      baseColor: theme.baseColor,
      accentColor: theme.accentColor,
      radius: theme.radius
    },
    aliases: {
      partials: normalized(paths.partials, 'partials/components'),
      styles: normalized(paths.styles, 'assets/css/components'),
      js: normalized(paths.js, 'assets/js/components')
    },
    cssFile: normalized(paths.cssFile, 'assets/css/ghostcn.css')
  };
}

export function initializeThemeProject(options: InitializeThemeOptions): InitializeThemeResult {
  const configPath = safeThemePath(options.themeRoot, 'components.json');
  const cssPath = safeThemePath(options.themeRoot, options.config.cssFile);

  fs.mkdirSync(path.dirname(cssPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(options.config, null, 2) + '\n', 'utf8');
  fs.writeFileSync(cssPath, generateThemeCss({ style: options.config.style, ...options.config.theme }), 'utf8');
  if (options.config.style === 'tailwind') {
    const tailwindRelative = path.posix.join(path.posix.dirname(options.config.cssFile.replace(/\\/g, '/')), 'ghostcn-tailwind.css');
    const tailwindPath = safeThemePath(options.themeRoot, tailwindRelative);
    fs.writeFileSync(tailwindPath, tailwindTheme(), 'utf8');
  }

  const styleSync = syncGhostcnStyles({
    themeRoot: options.themeRoot,
    cssFile: options.config.cssFile,
    stylesDir: options.config.aliases.styles
  });

  return { configPath, cssPath, styleSync };
}
