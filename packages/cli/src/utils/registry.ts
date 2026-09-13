import fs from 'fs';
import path from 'path';

export interface ComponentFile {
  name: string;
  type: 'partial' | 'style' | 'js';
  target: string;
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

export async function getComponent(componentName: string): Promise<ComponentManifest | null> {
  // In a real published CLI, this would be an HTTP fetch to:
  // https://ghost-ui.example.com/registry/components/${componentName}.json
  // For this local build, we will simulate fetching by reading from the local registry directory.
  
  // Find the registry directory relative to the CLI package when running locally
  // Assuming the CLI runs from a theme folder but we want to simulate the server:
  // For the sake of this local monorepo test, we'll look up the tree to find `registry/components`.
  
  let currentDir = process.cwd();
  let registryPath = '';
  
  // Fallback for local testing in the monorepo
  while (currentDir !== path.parse(currentDir).root) {
    const potentialPath = path.join(currentDir, 'registry', 'components', `${componentName}.json`);
    if (fs.existsSync(potentialPath)) {
      registryPath = potentialPath;
      break;
    }
    currentDir = path.dirname(currentDir);
  }

  // Also search upwards from the CLI package location itself
  if (!registryPath) {
    let cliDir = __dirname;
    while (cliDir !== path.parse(cliDir).root) {
      const potentialPath = path.join(cliDir, 'registry', 'components', `${componentName}.json`);
      if (fs.existsSync(potentialPath)) {
        registryPath = potentialPath;
        break;
      }
      cliDir = path.dirname(cliDir);
    }
  }

  if (!registryPath) {
    // If not found in monorepo fallback, assume it's missing (or we'd throw fetch error)
    return null;
  }

  try {
    const content = fs.readFileSync(registryPath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(content) as ComponentManifest;
  } catch (error) {
    return null;
  }
}
