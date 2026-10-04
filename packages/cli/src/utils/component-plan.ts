import { ComponentManifest, getComponent, sanitizeComponentName } from './registry';
import { GhostcnConfig } from './theme-project';
import { componentFiles } from './component-files';

// Resolve and validate the entire dependency graph before an installer writes any files.
// The caller owns overwrite policy; this helper only supplies a dependency-first plan.
export async function componentPlan(themeRoot: string, config: GhostcnConfig, name: string,
  load: (name: string) => Promise<ComponentManifest | null> = getComponent) {
  const visiting = new Set<string>();
  const completed = new Set<string>();
  const targets = new Map<string, string>();
  const entries: { manifest: ComponentManifest; files: ReturnType<typeof componentFiles> }[] = [];
  async function visit(requested: string) {
    const key = sanitizeComponentName(requested);
    if (visiting.has(key)) throw new Error(`Component dependency cycle at "${key}".`);
    if (completed.has(key)) return;
    const manifest = await load(key);
    if (!manifest) throw new Error(`Component "${key}" was not found in the registry.`);
    if (manifest.name !== key) throw new Error(`Registry returned an unexpected component for "${key}".`);
    if (manifest.dependencies !== undefined && (!Array.isArray(manifest.dependencies) || manifest.dependencies.some(value => typeof value !== 'string'))) throw new Error(`Invalid dependencies for "${key}".`);
    visiting.add(key);
    for (const dependency of manifest.dependencies || []) await visit(dependency);
    const files = componentFiles(themeRoot, config, manifest);
    for (const file of files) {
      // Case-insensitive Windows paths must not allow graph entries to silently collide.
      const target = process.platform === 'win32' ? file.target.toLowerCase() : file.target;
      if (targets.has(target)) throw new Error(`Components "${targets.get(target)}" and "${key}" target the same file.`);
      targets.set(target, key);
    }
    entries.push({ manifest, files });
    visiting.delete(key);
    completed.add(key);
  }
  await visit(name);
  return entries;
}
