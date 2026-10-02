import fs from 'fs';
import { ComponentManifest, getComponent, sanitizeComponentName, DEFAULT_REGISTRY_URL } from './registry';
import { componentFiles, safeThemePath } from './component-files';
import { readHistory, revision } from './component-history';
import { GhostcnConfig } from './theme-project';

export type FileStatus = 'unchanged' | 'upstream-changed' | 'locally-modified' | 'conflict' | 'missing' | 'untracked' | 'removed-upstream';
export interface FileComparison { path: string; status: FileStatus; baseline?: string; local?: string; incoming?: string; }

export async function comparisonManifest(name: string, latest: boolean): Promise<ComponentManifest> {
  name = sanitizeComponentName(name);
  if (!latest) {
    const manifest = await getComponent(name);
    if (!manifest) throw new Error(`Component "${name}" was not found.`);
    return manifest;
  }
  // A latest comparison must never silently fall back to a stale bundled registry.
  const base = process.env.GHOST_UI_REGISTRY_URL || DEFAULT_REGISTRY_URL;
  const url = new URL(`${base.replace(/\/$/, '')}/components/${name}.json`);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid registry URL.');
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Latest registry returned HTTP ${response.status}; no files were changed.`);
  const manifest = await response.json() as ComponentManifest;
  if (manifest.name !== name || !Array.isArray(manifest.files)) throw new Error('Registry returned an invalid component manifest.');
  return manifest;
}

export function compareComponent(themeRoot: string, config: GhostcnConfig, manifest: ComponentManifest) {
  const files = componentFiles(themeRoot, config, manifest);
  const saved = readHistory(themeRoot).components[manifest.name];
  const incoming = Object.fromEntries(files.map(file => [file.relative, file.content]));
  const paths = [...new Set([...Object.keys(incoming), ...Object.keys(saved?.files || {})])].sort();
  const comparisons: FileComparison[] = paths.map(relative => {
    const target = safeThemePath(themeRoot, relative);
    const baseline = saved?.files[relative];
    const local = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : undefined;
    const next = incoming[relative];
    let status: FileStatus;
    if (next === undefined) status = 'removed-upstream';
    else if (local === undefined) status = 'missing';
    else if (local === next) status = 'unchanged';
    else if (baseline === undefined) status = 'untracked';
    else if (baseline === next) status = 'locally-modified';
    else if (baseline === local) status = 'upstream-changed';
    else status = 'conflict';
    return { path: relative, status, baseline, local, incoming: next };
  });
  return { name: manifest.name, installedRevision: saved?.revision, incomingRevision: revision(incoming), files: comparisons };
}

// Complete line diff with bounded memory. Large files remain reviewable as replacement hunks.
export function unifiedDiff(before: string | undefined, after: string | undefined, label: string): string {
  if (before === after) return '';
  const split = (value: string | undefined) => value?.replace(/\r\n/g, '\n').match(/[^\n]*\n|[^\n]+$/g) || [];
  const a = split(before);
  const b = split(after);
  const lines = [`--- ${label} (local)`, `+++ ${label} (registry)`, `@@ -${a.length ? 1 : 0},${a.length} +${b.length ? 1 : 0},${b.length} @@`];
  const emit = (prefix: string, value: string) => {
    lines.push(prefix + (value.endsWith('\n') ? value.slice(0, -1) : value));
    if (!value.endsWith('\n')) lines.push('\\ No newline at end of file');
  };
  if (a.length * b.length > 1_000_000) {
    a.forEach(value => emit('-', value)); b.forEach(value => emit('+', value));
    return lines.join('\n');
  }
  const width = b.length + 1;
  const matrix = new Uint32Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) matrix[i * width + j] = a[i] === b[j] ? 1 + matrix[(i + 1) * width + j + 1] : Math.max(matrix[(i + 1) * width + j], matrix[i * width + j + 1]);
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) emit(' ', a[i++]), j++;
    else if (i < a.length && (j === b.length || matrix[(i + 1) * width + j] >= matrix[i * width + j + 1])) emit('-', a[i++]);
    else emit('+', b[j++]);
  }
  return lines.join('\n');
}
