import path from 'path';
import fs from 'fs';
import { ComponentManifest } from './registry';
import { GhostcnConfig } from './theme-project';
import { safeThemePath, toGhostAssetPath } from './theme-files';
import { componentCss } from './styles';
export { safeThemePath } from './theme-files';

export function componentPartialName(config: GhostcnConfig, name: string) {
  const directory = path.posix.normalize((config.aliases?.partials || 'partials/components').replace(/\\/g, '/'));
  if (directory !== 'partials' && !directory.startsWith('partials/')) throw new Error('Component partials must live under partials/ for Ghost to load them.');
  return [directory.slice('partials'.length).replace(/^\//, ''), name].filter(Boolean).join('/');
}

function aliasedPartial(content: string, config: GhostcnConfig) {
  // Rewrite only static component invocations, including partial blocks and their closing tags.
  // Shared by diff and install: incoming content and saved baselines use identical aliasing.
  return content.replace(/(\{\{(?:#>|>|\/)\s*)(["']?)components\/([a-z0-9-]+)(\2)(?=[\s}])/g,
    (_all, prefix: string, quote: string, name: string) => `${prefix}${quote}${componentPartialName(config, name)}${quote}`);
}

// Shared by installation and read-only comparisons so aliases and CSS layers cannot drift.
export function componentFiles(themeRoot: string, config: GhostcnConfig, manifest: ComponentManifest) {
  const targets = new Set<string>();
  return manifest.files.map(file => {
    if (path.basename(file.name) !== file.name || /[\\/]/.test(file.name)) throw new Error('Unsafe component file name.');
    const aliases = { partial: config.aliases?.partials || 'partials/components', style: config.aliases?.styles || 'assets/css/components', js: config.aliases?.js || 'assets/js/components' };
    if (!['partial', 'style', 'js'].includes(file.type) || typeof file.content !== 'string') throw new Error('Invalid component file.');
    const relative = file.placement === 'theme' ? file.target : path.join(aliases[file.type], file.name);
    if (!relative) throw new Error('Missing component target.');
    const target = safeThemePath(themeRoot, relative);
    if (fs.existsSync(target) && !fs.statSync(target).isFile()) throw new Error('Component target must be a file, not a directory.');
    if (file.type === 'style' || file.type === 'js') toGhostAssetPath(relative);
    const key = process.platform === 'win32' ? target.toLowerCase() : target;
    if (targets.has(key)) throw new Error('Duplicate component target.');
    targets.add(key);
    return { relative: path.relative(path.resolve(themeRoot), target).replace(/\\/g, '/'), target, content: file.type === 'style' ? componentCss(file.content, config.style) : file.type === 'partial' ? aliasedPartial(file.content, config) : file.content };
  });
}
