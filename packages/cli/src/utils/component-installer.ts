import fs from 'fs';
import path from 'path';
import { sanitizeComponentName } from './registry';
import { GhostcnConfig } from './theme-project';
import { StyleSyncResult, syncGhostcnStyles, syncGhostcnScripts, safeThemePath } from './theme-files';
import { componentPlan } from './component-plan';
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
  dependencies?: InstallComponentResult[];
}

export async function installComponent(options: InstallComponentOptions): Promise<InstallComponentResult> {
  const name = sanitizeComponentName(options.componentName);
  readHistory(options.themeRoot); // Validate before any component files are written.
  const plan = await componentPlan(options.themeRoot, options.config, name);
  // Validate managed layout/asset targets before any component writes.
  safeThemePath(options.themeRoot, 'default.hbs');
  if (plan.some(entry => entry.manifest.files.some(file => file.type === 'style'))) safeThemePath(options.themeRoot, options.config.cssFile || 'assets/css/ghostcn.css');

  const results: InstallComponentResult[] = [];
  for (const { manifest, files } of plan) {
    const isDependency = manifest.name !== name;
    const result: InstallComponentResult = { name: manifest.name, installed: [], skipped: [] };
    const baseline: Record<string, string> = {};

    for (const file of files) {
      const relativeTarget = file.relative;
      const targetPath = file.target;

      if (fs.existsSync(targetPath) && (isDependency || !options.overwrite)) {
        const replace = !isDependency && options.shouldOverwrite ? await options.shouldOverwrite(relativeTarget.replace(/\\/g, '/')) : false;
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

    if (result.installed.length) recordInstalledFiles(options.themeRoot, manifest.name, baseline);
    results.push(result);
  }

  const result = results[results.length - 1];
  result.dependencies = results.slice(0, -1);

  if (plan.some(entry => entry.manifest.files.some(file => file.type === 'style'))) {
    result.styleSync = syncGhostcnStyles({
      themeRoot: options.themeRoot,
      cssFile: options.config.cssFile || 'assets/css/ghostcn.css',
      stylesDir: options.config.aliases?.styles || 'assets/css/components'
    });
  }

  if (plan.some(entry => entry.manifest.files.some(file => file.type === 'js'))) result.scriptSync = syncGhostcnScripts(options.themeRoot, options.config.aliases?.js || 'assets/js/components');
  return result;
}
