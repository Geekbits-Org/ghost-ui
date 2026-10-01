import fs from 'fs';
import path from 'path';

const STYLES_START = '{{!-- ghostcn:styles:start --}}';
const STYLES_END = '{{!-- ghostcn:styles:end --}}';

export interface StyleSyncOptions {
  themeRoot: string;
  cssFile: string;
  stylesDir: string;
}

export interface StyleSyncResult {
  status: 'updated' | 'unchanged' | 'missing-template';
  templatePath: string;
  assetPaths: string[];
}

function normalizeRelativePath(relativePath: string): string {
  return relativePath.trim().replace(/\\/g, '/').replace(/^\.\//, '');
}

export function resolveWithinTheme(themeRoot: string, relativePath: string): string {
  const normalized = normalizeRelativePath(relativePath);
  if (!normalized || path.isAbsolute(normalized)) {
    throw new Error(`Path must be relative to the Ghost theme: ${relativePath}`);
  }

  const root = path.resolve(themeRoot);
  const target = path.resolve(root, normalized);
  if (target === root || !target.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Path must stay inside the Ghost theme: ${relativePath}`);
  }

  return target;
}

export function toGhostAssetPath(themeRelativePath: string): string {
  const normalized = normalizeRelativePath(themeRelativePath);
  if (!normalized.startsWith('assets/')) {
    throw new Error(`Stylesheets must be stored inside assets/: ${themeRelativePath}`);
  }

  const assetPath = normalized.slice('assets/'.length);
  if (!assetPath) {
    throw new Error(`Stylesheet path must include a file name: ${themeRelativePath}`);
  }

  return assetPath;
}

function stylesheetBlock(assetPaths: string[], newline: string): string {
  return [
    STYLES_START,
    ...assetPaths.map(assetPath => `<link rel="stylesheet" href="{{asset "${assetPath}"}}" />`),
    STYLES_END
  ].join(newline);
}

function indentBlock(block: string, indent: string, newline: string): string {
  return block
    .split(newline)
    .map(line => `${indent}${line}`)
    .join(newline);
}

function removeOwnedStylesheetLinks(template: string, assetPaths: string[]): string {
  const owned = new Set(assetPaths);
  return template.replace(/^[ \t]*<link\b[^\r\n>]*>[ \t]*(?:\r?\n)?/gim, tag => {
    if (!/rel=["']stylesheet["']/i.test(tag)) return tag;
    const assetMatch = tag.match(/\{\{asset\s+["']([^"']+)["']\}\}/i);
    return assetMatch && owned.has(assetMatch[1]) ? '' : tag;
  });
}

export function syncGhostcnStyles(options: StyleSyncOptions): StyleSyncResult {
  const templatePath = resolveWithinTheme(options.themeRoot, 'default.hbs');
  const cssPath = resolveWithinTheme(options.themeRoot, options.cssFile);
  const stylesDirPath = resolveWithinTheme(options.themeRoot, options.stylesDir);

  const assetPaths = [toGhostAssetPath(options.cssFile)];
  if (fs.existsSync(stylesDirPath)) {
    const componentStyles = fs
      .readdirSync(stylesDirPath, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.css'))
      .map(entry => toGhostAssetPath(path.relative(options.themeRoot, path.join(stylesDirPath, entry.name))))
      .sort((a, b) => a.localeCompare(b));
    assetPaths.push(...componentStyles);
  }

  if (!fs.existsSync(templatePath)) {
    return { status: 'missing-template', templatePath, assetPaths };
  }

  if (!fs.existsSync(cssPath)) {
    throw new Error(`Theme tokens file does not exist: ${options.cssFile}`);
  }

  const original = fs.readFileSync(templatePath, 'utf8');
  const newline = original.includes('\r\n') ? '\r\n' : '\n';
  const block = stylesheetBlock(assetPaths, newline);
  const managedBlockPattern = new RegExp(
    `^[ \\t]*${STYLES_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${STYLES_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[ \\t]*(?:\\r?\\n)?`,
    'm'
  );

  const withoutManagedBlock = original.replace(managedBlockPattern, '');
  const withoutOwnedLinks = removeOwnedStylesheetLinks(withoutManagedBlock, assetPaths);
  const ghostHeadPattern = /^([ \t]*)\{\{ghost_head\}\}/m;
  const overrideAnchor = /^([ \t]*)\{\{!-- ghostcn:theme-styles --\}\}/m;

  let updated: string;
  if (overrideAnchor.test(withoutOwnedLinks)) {
    updated = withoutOwnedLinks.replace(overrideAnchor, (match, indent: string) => `${indentBlock(block, indent, newline)}${newline}${match}`);
  } else if (ghostHeadPattern.test(withoutOwnedLinks)) {
    updated = withoutOwnedLinks.replace(ghostHeadPattern, (_match, indent: string) => {
      return `${indentBlock(block, indent, newline)}${newline}${indent}{{ghost_head}}`;
    });
  } else if (/<\/head>/i.test(withoutOwnedLinks)) {
    updated = withoutOwnedLinks.replace(/<\/head>/i, `${block}${newline}</head>`);
  } else {
    return { status: 'missing-template', templatePath, assetPaths };
  }

  if (updated === original) {
    return { status: 'unchanged', templatePath, assetPaths };
  }

  fs.writeFileSync(templatePath, updated, 'utf8');
  return { status: 'updated', templatePath, assetPaths };
}
