import path from 'path';
import { ComponentManifest } from './registry';
import { GhostcnConfig } from './theme-project';
import { safeThemePath, toGhostAssetPath } from './theme-files';
import { componentCss } from './styles';
export { safeThemePath } from './theme-files';

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
    if (file.type === 'style' || file.type === 'js') toGhostAssetPath(relative);
    if (targets.has(target)) throw new Error('Duplicate component target.');
    targets.add(target);
    return { relative: path.relative(path.resolve(themeRoot), target).replace(/\\/g, '/'), target, content: file.type === 'style' ? componentCss(file.content, config.style) : file.content };
  });
}
