import fs from 'fs';
import { ComponentManifest, getComponent, sanitizeComponentName, DEFAULT_REGISTRY_URL, fetchRegistryJson } from './registry';
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
  const manifest = await fetchRegistryJson<ComponentManifest>(url.href, 10000);
  if (manifest.name !== name || !Array.isArray(manifest.files)) throw new Error('Registry returned an invalid component manifest.');
  return manifest;
}

const normalizeEol = (value: string | undefined) => value?.replace(/\r\n/g, '\n');

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
    const normBaseline = normalizeEol(baseline);
    const normLocal = normalizeEol(local);
    const normNext = normalizeEol(next);
    let status: FileStatus;
    if (next === undefined) status = 'removed-upstream';
    else if (local === undefined) status = 'missing';
    else if (normLocal === normNext) status = 'unchanged';
    else if (baseline === undefined) status = 'untracked';
    else if (normBaseline === normNext) status = 'locally-modified';
    else if (normBaseline === normLocal) status = 'upstream-changed';
    else status = 'conflict';
    return { path: relative, status, baseline, local, incoming: next };
  });
  return { name: manifest.name, installedRevision: saved?.revision, incomingRevision: revision(incoming), files: comparisons };
}

// Contextual line diff (3-line hunks) with bounded memory. Large files remain reviewable as replacement hunks.
export function unifiedDiff(before: string | undefined, after: string | undefined, label: string, contextLines = 3): string {
  if (normalizeEol(before) === normalizeEol(after)) return '';
  const split = (value: string | undefined) => normalizeEol(value)?.match(/[^\n]*\n|[^\n]+$/g) || [];
  const a = split(before);
  const b = split(after);
  const header = [`--- ${label} (local)`, `+++ ${label} (registry)`];
  const formatLine = (prefix: string, value: string): string[] => {
    const out = [prefix + (value.endsWith('\n') ? value.slice(0, -1) : value)];
    if (!value.endsWith('\n')) out.push('\\ No newline at end of file');
    return out;
  };
  if (a.length * b.length > 1_000_000) {
    const out = [...header, `@@ -${a.length ? 1 : 0},${a.length} +${b.length ? 1 : 0},${b.length} @@`];
    a.forEach(value => out.push(...formatLine('-', value)));
    b.forEach(value => out.push(...formatLine('+', value)));
    return out.join('\n');
  }
  const width = b.length + 1;
  const matrix = new Uint32Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) matrix[i * width + j] = a[i] === b[j] ? 1 + matrix[(i + 1) * width + j + 1] : Math.max(matrix[(i + 1) * width + j], matrix[i * width + j + 1]);
  type Op = { kind: ' ' | '-' | '+'; value: string; oldLine: number; newLine: number };
  const ops: Op[] = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) ops.push({ kind: ' ', value: a[i], oldLine: i + 1, newLine: j + 1 }), i++, j++;
    else if (i < a.length && (j === b.length || matrix[(i + 1) * width + j] >= matrix[i * width + j + 1])) ops.push({ kind: '-', value: a[i], oldLine: i + 1, newLine: j + 1 }), i++;
    else ops.push({ kind: '+', value: b[j], oldLine: i + 1, newLine: j + 1 }), j++;
  }
  const ranges: [number, number][] = [];
  ops.forEach((op, idx) => {
    if (op.kind === ' ') return;
    const start = Math.max(0, idx - contextLines);
    const end = Math.min(ops.length - 1, idx + contextLines);
    if (ranges.length && start <= ranges[ranges.length - 1][1] + 1) ranges[ranges.length - 1][1] = end;
    else ranges.push([start, end]);
  });
  const lines = [...header];
  for (const [start, end] of ranges) {
    const slice = ops.slice(start, end + 1);
    const oldCount = slice.filter(op => op.kind !== '+').length;
    const newCount = slice.filter(op => op.kind !== '-').length;
    const oldStart = oldCount ? slice.find(op => op.kind !== '+')!.oldLine : Math.max(0, slice[0].oldLine - 1);
    const newStart = newCount ? slice.find(op => op.kind !== '-')!.newLine : Math.max(0, slice[0].newLine - 1);
    lines.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`);
    for (const op of slice) lines.push(...formatLine(op.kind, op.value));
  }
  return lines.join('\n');
}
