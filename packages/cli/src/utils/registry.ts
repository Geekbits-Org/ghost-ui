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

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function findLocalRegistryDir(): string | null {
  const bundledCandidates = [
    path.join(__dirname, 'registry'),
    path.join(__dirname, '..', 'registry')
  ];
  for (const cand of bundledCandidates) {
    if (fs.existsSync(cand) && fs.statSync(cand).isDirectory()) {
      return cand;
    }
  }

  const searchStarts = [process.cwd(), __dirname];
  for (const start of searchStarts) {
    let currentDir = start;
    while (currentDir !== path.parse(currentDir).root) {
      const potentialPath = path.join(currentDir, 'registry');
      if (fs.existsSync(potentialPath) && fs.statSync(potentialPath).isDirectory()) {
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
      const res = await fetchWithTimeout(`${process.env.GHOST_UI_REGISTRY_URL}/index.json`);
      if (res.ok) {
        return (await res.json()) as RegistryItem[];
      }
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
    const res = await fetchWithTimeout(`${DEFAULT_REGISTRY_URL}/index.json`);
    if (res.ok) {
      return (await res.json()) as RegistryItem[];
    }
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
      const res = await fetchWithTimeout(`${process.env.GHOST_UI_REGISTRY_URL}/components/${sanitized}.json`);
      if (res.ok) {
        return (await res.json()) as ComponentManifest;
      }
    } catch {
      // Fallback to local
    }
  }

  // 1. Try local bundled registry first (zero-latency, offline-first)
  const local = findLocalManifest(sanitized);
  if (local) return local;

  // 2. Fallback to default remote registry
  try {
    const res = await fetchWithTimeout(`${DEFAULT_REGISTRY_URL}/components/${sanitized}.json`);
    if (res.ok) {
      return (await res.json()) as ComponentManifest;
    }
  } catch {
    // Network or abort error
  }

  return null;
}
