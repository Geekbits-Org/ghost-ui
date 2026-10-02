import fs from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { safeThemePath } from './component-files';
import { sanitizeComponentName } from './registry';

export interface InstalledComponent { revision: string; files: Record<string, string>; }
export interface ComponentHistory { schema: 1; components: Record<string, InstalledComponent>; }
export function revision(files: Record<string, string>): string {
  return createHash('sha256').update(JSON.stringify(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)))).digest('hex');
}
export function readHistory(themeRoot: string): ComponentHistory {
  const target = safeThemePath(themeRoot, '.ghostcn/installed.json');
  if (!fs.existsSync(target)) return { schema: 1, components: {} };
  const state = JSON.parse(fs.readFileSync(target, 'utf8')) as ComponentHistory;
  if (state.schema !== 1 || !state.components || Array.isArray(state.components) || typeof state.components !== 'object') throw new Error('Invalid .ghostcn/installed.json; preserve it and repair before continuing.');
  for (const [name, entry] of Object.entries(state.components)) {
    sanitizeComponentName(name);
    if (!entry || typeof entry.revision !== 'string' || !entry.files || typeof entry.files !== 'object' || Array.isArray(entry.files)) throw new Error('Invalid component history.');
    for (const [relative, content] of Object.entries(entry.files)) {
      safeThemePath(themeRoot, relative);
      if (typeof content !== 'string') throw new Error('Invalid component baseline.');
    }
    if (revision(entry.files) !== entry.revision) throw new Error('Component history checksum mismatch; preserve it and repair before continuing.');
  }
  return state;
}
export function recordInstalledFiles(themeRoot: string, name: string, files: Record<string, string>): void {
  const state = readHistory(themeRoot);
  const previous = state.components[name]?.files || {};
  // Skipped files keep their prior baseline; never pretend a customization was an upstream original.
  const merged = { ...previous, ...files };
  state.components[name] = { revision: revision(merged), files: merged };
  const target = safeThemePath(themeRoot, '.ghostcn/installed.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(state, null, 2) + '\n', 'utf8');
}
