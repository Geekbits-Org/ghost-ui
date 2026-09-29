import fs from 'fs';
import path from 'path';
import { generateThemeCss, ThemeConfig } from './theme';
import { resolveWithinTheme, StyleSyncResult, syncGhostcnStyles } from './theme-files';

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
  return {
    $schema: 'https://ghostcn.com/schema.json',
    style: theme.style,
    theme: {
      baseColor: theme.baseColor,
      accentColor: theme.accentColor,
      radius: theme.radius
    },
    aliases: {
      partials: paths.partials || 'partials/components',
      styles: paths.styles || 'assets/css/components',
      js: paths.js || 'assets/js/components'
    },
    cssFile: paths.cssFile || 'assets/css/ghostcn.css'
  };
}

export function initializeThemeProject(options: InitializeThemeOptions): InitializeThemeResult {
  const configPath = resolveWithinTheme(options.themeRoot, 'components.json');
  const cssPath = resolveWithinTheme(options.themeRoot, options.config.cssFile);

  fs.mkdirSync(path.dirname(cssPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(options.config, null, 2) + '\n', 'utf8');
  fs.writeFileSync(cssPath, generateThemeCss({ style: options.config.style, ...options.config.theme }), 'utf8');

  const styleSync = syncGhostcnStyles({
    themeRoot: options.themeRoot,
    cssFile: options.config.cssFile,
    stylesDir: options.config.aliases.styles
  });

  return { configPath, cssPath, styleSync };
}
