import fs from 'fs';
import path from 'path';
import { getComponent, sanitizeComponentName } from './registry';
import { GhostcnConfig } from './theme-project';
import { resolveWithinTheme, StyleSyncResult, syncGhostcnStyles } from './theme-files';
import { componentCss } from './styles';

export interface InstallComponentOptions {
  themeRoot: string;
  componentName: string;
  config: GhostcnConfig;
  overwrite?: boolean;
  shouldOverwrite?: (relativePath: string) => Promise<boolean>;
}

export interface InstallComponentResult {
  name: string;
  installed: string[];
  skipped: string[];
  styleSync?: StyleSyncResult;
}

function aliasedTarget(config: GhostcnConfig, file: { name: string; type: string; target?: string; placement?: string }): string {
  if (file.placement === 'theme') {
    if (!file.target) throw new Error(`Registry file "${file.name}" is missing its theme target.`);
    return file.target;
  }

  let alias = '';
  if (file.type === 'partial') alias = config.aliases?.partials || 'partials/components';
  if (file.type === 'style') alias = config.aliases?.styles || 'assets/css/components';
  if (file.type === 'js') alias = config.aliases?.js || 'assets/js/components';
  if (!alias) throw new Error(`Unsupported registry file type "${file.type}".`);
  return path.join(alias, file.name);
}

export async function installComponent(options: InstallComponentOptions): Promise<InstallComponentResult> {
  const name = sanitizeComponentName(options.componentName);
  const manifest = await getComponent(name);
  if (!manifest) throw new Error(`Component "${name}" was not found in the registry.`);

  const result: InstallComponentResult = { name, installed: [], skipped: [] };

  for (const file of manifest.files) {
    if (path.basename(file.name) !== file.name) {
      throw new Error(`Registry returned an unsafe file name for "${name}".`);
    }

    const relativeTarget = aliasedTarget(options.config, file);
    const targetPath = resolveWithinTheme(options.themeRoot, relativeTarget);

    if (fs.existsSync(targetPath) && !options.overwrite) {
      const replace = options.shouldOverwrite ? await options.shouldOverwrite(relativeTarget.replace(/\\/g, '/')) : false;
      if (!replace) {
        result.skipped.push(relativeTarget);
        continue;
      }
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, file.type === 'style' ? componentCss(file.content, options.config.style) : file.content, 'utf8');
    result.installed.push(relativeTarget);
  }

  if (manifest.files.some(file => file.type === 'style')) {
    result.styleSync = syncGhostcnStyles({
      themeRoot: options.themeRoot,
      cssFile: options.config.cssFile || 'assets/css/ghostcn.css',
      stylesDir: options.config.aliases?.styles || 'assets/css/components'
    });
  }

  return result;
}
