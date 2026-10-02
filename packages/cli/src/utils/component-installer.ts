import fs from 'fs';
import path from 'path';
import { getComponent, sanitizeComponentName } from './registry';
import { GhostcnConfig } from './theme-project';
import { StyleSyncResult, syncGhostcnStyles, syncGhostcnScripts, safeThemePath } from './theme-files';
import { componentFiles } from './component-files';
import { readHistory, recordInstalledFiles } from './component-history';

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
  scriptSync?: StyleSyncResult;
}

export async function installComponent(options: InstallComponentOptions): Promise<InstallComponentResult> {
  const name = sanitizeComponentName(options.componentName);
  const manifest = await getComponent(name);
  if (!manifest) throw new Error(`Component "${name}" was not found in the registry.`);

  const result: InstallComponentResult = { name, installed: [], skipped: [] };
  const baseline: Record<string, string> = {};
  readHistory(options.themeRoot); // Validate before any component files are written.
  const files = componentFiles(options.themeRoot, options.config, manifest);
  // Validate managed layout/asset targets before any component writes.
  safeThemePath(options.themeRoot, 'default.hbs');
  if (manifest.files.some(file => file.type === 'style')) safeThemePath(options.themeRoot, options.config.cssFile || 'assets/css/ghostcn.css');

  for (const file of files) {
    const relativeTarget = file.relative;
    const targetPath = file.target;

    if (fs.existsSync(targetPath) && !options.overwrite) {
      const replace = options.shouldOverwrite ? await options.shouldOverwrite(relativeTarget.replace(/\\/g, '/')) : false;
      if (!replace) {
        result.skipped.push(relativeTarget);
        continue;
      }
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, file.content, 'utf8');
    baseline[relativeTarget] = file.content;
    result.installed.push(relativeTarget);
  }

  if (result.installed.length) recordInstalledFiles(options.themeRoot, name, baseline);

  if (manifest.files.some(file => file.type === 'style')) {
    result.styleSync = syncGhostcnStyles({
      themeRoot: options.themeRoot,
      cssFile: options.config.cssFile || 'assets/css/ghostcn.css',
      stylesDir: options.config.aliases?.styles || 'assets/css/components'
    });
  }

  if (manifest.files.some(file => file.type === 'js')) result.scriptSync = syncGhostcnScripts(options.themeRoot, options.config.aliases?.js || 'assets/js/components');
  return result;
}
