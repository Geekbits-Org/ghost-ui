import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { comparisonManifest, compareComponent, FileComparison, unifiedDiff } from '../utils/component-diff';
import { getRegistryIndex, sanitizeComponentName } from '../utils/registry';
import { readHistory } from '../utils/component-history';
import { componentFiles } from '../utils/component-files';
import { GhostcnConfig } from '../utils/theme-project';

function formatDiffText(diffText: string): string {
  if (!process.stdout.isTTY) return diffText;
  return diffText
    .split('\n')
    .map(line => {
      if (line.startsWith('+++') || line.startsWith('---')) return chalk.bold(line);
      if (line.startsWith('@@')) return chalk.cyan(line);
      if (line.startsWith('+')) return chalk.green(line);
      if (line.startsWith('-')) return chalk.red(line);
      return line;
    })
    .join('\n');
}

export async function diff(component: string | undefined, options: { latest?: boolean; summary?: boolean; json?: boolean } = {}) {
  try {
    const root = process.cwd();
    const configPath = path.join(root, 'components.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('components.json was not found. Run "npx ghostcn init" from your Ghost theme root first.');
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '')) as GhostcnConfig;
    let names: string[];
    if (component) names = [sanitizeComponentName(component)];
    else {
      const tracked = Object.keys(readHistory(root).components);
      const installed: string[] = [];
      for (const item of await getRegistryIndex()) {
        const manifest = await comparisonManifest(item.name, false);
        if (componentFiles(root, config, manifest).some(file => fs.existsSync(file.target))) installed.push(item.name);
      }
      names = [...new Set([...tracked, ...installed])];
    }
    const results = [];
    for (const name of names) {
      try {
        results.push(compareComponent(root, config, await comparisonManifest(name, !!options.latest)));
      } catch (err: any) {
        if (!component && /was not found|HTTP 404/i.test(String(err?.message || ''))) {
          const saved = readHistory(root).components[name];
          results.push({
            name,
            installedRevision: saved?.revision,
            incomingRevision: 'removed',
            files: Object.keys(saved?.files || {}).sort().map((relative): FileComparison => ({ path: relative, status: 'removed-upstream' }))
          });
          continue;
        }
        throw err;
      }
    }
    if (options.json) console.log(JSON.stringify({ source: options.latest ? 'latest-registry' : 'installed-cli-registry', components: results }, null, 2));
    else {
      console.log(`Read-only comparison against ${options.latest ? 'the latest registry (main), not necessarily the latest npm release' : 'this CLI\'s registry'}. No files are changed.`);
      if (!results.length) console.log('No installed components found.');
      for (const result of results) {
        console.log(`\n${result.name}: ${result.installedRevision?.slice(0, 12) || 'unknown baseline'} -> ${result.incomingRevision.slice(0, 12)}`);
        for (const file of result.files) {
          console.log(`  ${file.status}: ${file.path}`);
          if (!options.summary && file.local?.replace(/\r\n/g, '\n') !== file.incoming?.replace(/\r\n/g, '\n')) {
            const output = unifiedDiff(file.local, file.incoming, file.path);
            if (output) console.log(formatDiffText(output));
          }
        }
      }
      console.log('\nKeep your local files; manually merge the changes you want. Do not use add -y to review updates.');
    }
  } catch (error: any) {
    console.error(`Could not compare components: ${error.message}`);
    process.exitCode = 1;
  }
}
