import fs from 'fs';
import path from 'path';

export const DEFAULT_REGISTRY_URL = 'https://raw.githubusercontent.com/Geekbits-Org/ghost-ui/main/registry';

export interface ComponentFile {
  name: string;
  type: 'partial' | 'style' | 'js';
  target: string;
  placement?: 'alias' | 'theme';
  content: string;
}

export interface ComponentManifest {
  name: string;
  type: string;
  description: string;
  dependencies?: string[];
  ghost_version?: string;
  files: ComponentFile[];
  styleSlots?: Record<string, string[]>;
  parameters?: Record<string, { description: string; options?: string[]; default?: string }>;
  gscan?: {
    rules_satisfied: string[];
    notes: string;
  };
}

export interface RegistryItem {
  name: string;
  description: string;
  category: string;
  ghost_version?: string;
  files: string[];
}

export function sanitizeComponentName(name: string): string {
  const sanitized = name.trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(sanitized)) {
    throw new Error(
      `Invalid component name "${name}". Component names must contain only lowercase letters, numbers, and hyphens.`
    );
  }
  return sanitized;
}

export async function fetchRegistryJson<T>(url: string, timeoutMs = 5000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Registry returned HTTP ${response.status}.`);
    // Keep the deadline active through the response body, not just its headers.
    return await response.json() as T;
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

function safeRegistryBase(raw: string): string {
  const url = new URL(raw.trim().replace(/\/+$/, ''));
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Invalid GHOST_UI_REGISTRY_URL.');
  }
  return url.href.replace(/\/+$/, '');
}

function isValidRegistryDir(dir: string): boolean {
  return fs.existsSync(path.join(dir, 'index.json')) && fs.statSync(path.join(dir, 'index.json')).isFile();
}

function findLocalRegistryDir(): string | null {
  const bundledCandidates = [
    path.join(__dirname, 'registry'),
    path.join(__dirname, '..', 'registry')
  ];
  for (const cand of bundledCandidates) {
    if (isValidRegistryDir(cand)) {
      return cand;
    }
  }

  const searchStarts = [__dirname, process.cwd()];
  for (const start of searchStarts) {
    let currentDir = start;
    while (currentDir !== path.parse(currentDir).root) {
      const potentialPath = path.join(currentDir, 'registry');
      if (isValidRegistryDir(potentialPath)) {
        return potentialPath;
      }
      currentDir = path.dirname(currentDir);
    }
  }
  return null;
}

export function findLocalIndex(): RegistryItem[] | null {
  const regDir = findLocalRegistryDir();
  if (!regDir) return null;
  const indexPath = path.join(regDir, 'index.json');
  if (!fs.existsSync(indexPath)) return null;

  try {
    const raw = fs.readFileSync(indexPath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw) as RegistryItem[];
  } catch {
    return null;
  }
}

export function findLocalManifest(componentName: string): ComponentManifest | null {
  const regDir = findLocalRegistryDir();
  if (!regDir) return null;
  const manifestPath = path.join(regDir, 'components', `${componentName}.json`);
  if (!fs.existsSync(manifestPath)) return null;

  try {
    const raw = fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw) as ComponentManifest;
  } catch {
    return null;
  }
}

export async function getRegistryIndex(): Promise<RegistryItem[]> {
  // If custom registry URL explicitly configured, try remote first
  if (process.env.GHOST_UI_REGISTRY_URL) {
    try {
      return await fetchRegistryJson<RegistryItem[]>(`${safeRegistryBase(process.env.GHOST_UI_REGISTRY_URL)}/index.json`);
    } catch {
      // Fallback to local
    }
  }

  // 1. Try local bundled registry first (zero-latency, offline-first)
  const localIndex = findLocalIndex();
  if (localIndex && localIndex.length > 0) {
    return localIndex;
  }

  // 2. Fallback to default remote registry
  try {
    return await fetchRegistryJson<RegistryItem[]>(`${DEFAULT_REGISTRY_URL}/index.json`);
  } catch {
    // Network or abort error
  }

  return [];
}

export async function getComponent(componentName: string): Promise<ComponentManifest | null> {
  const sanitized = sanitizeComponentName(componentName);

  // If custom registry URL explicitly configured, try remote first
  if (process.env.GHOST_UI_REGISTRY_URL) {
    try {
      return await fetchRegistryJson<ComponentManifest>(`${safeRegistryBase(process.env.GHOST_UI_REGISTRY_URL)}/components/${sanitized}.json`);
    } catch {
      // Fallback to local
    }
  }

  // 1. Try local bundled registry first (zero-latency, offline-first)
  const local = findLocalManifest(sanitized);
  if (local) return local;

  // 2. Fallback to default remote registry
  try {
    return await fetchRegistryJson<ComponentManifest>(`${DEFAULT_REGISTRY_URL}/components/${sanitized}.json`);
  } catch {
    // Network or abort error
  }

  return null;
}
