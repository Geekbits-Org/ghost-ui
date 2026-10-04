import fs from 'fs';
import path from 'path';
import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import { getRegistryIndex, sanitizeComponentName } from '../utils/registry';
import { installComponent } from '../utils/component-installer';
import { GhostcnConfig } from '../utils/theme-project';

export interface AddOptions {
  yes?: boolean;
  skipExisting?: boolean;
}

class AddCancelled extends Error {}
type Outcome = 'installed' | 'kept' | 'failed' | 'cancelled';

// One decision per requested component, never a spinner competing with a prompt.
// Installer mechanics and dependency preservation remain in the shared installer.
export function createOverwriteDecision(name: string, spinner: { stop(): unknown; start(): unknown },
  interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY)) {
  let decision: boolean | undefined;
  return async (relativePath: string) => {
    if (decision !== undefined) return decision;
    spinner.stop();
    if (!interactive) return decision = false;
    console.log(chalk.yellow(`Component "${name}" already has files, including ${relativePath}.`));
    console.log(`Press Enter / N to keep existing files and continue; Y replaces this component's files.`);
    console.log(`Review first: ghostcn diff ${name}. Cancel with Ctrl+C. Dependencies are preserved.`);
    let cancelled = false;
    const response = await prompts({
      type: 'confirm', name: 'overwrite', message: `Replace existing files for "${name}"?`, initial: false
    }, { onCancel: () => { cancelled = true; } });
    if (cancelled) throw new AddCancelled('Cancelled. Existing files were kept; earlier installs were not rolled back.');
    decision = Boolean(response.overwrite);
    spinner.start();
    return decision;
  };
}

async function installSingleComponent(name: string, config: GhostcnConfig, options: AddOptions): Promise<Outcome> {
  const spinner = ora(`Installing component "${name}" (registry requests time out after 5 seconds)...`).start();
  let result;
  try {
    result = await installComponent({
      themeRoot: process.cwd(), componentName: name, config, overwrite: options.yes,
      shouldOverwrite: options.skipExisting ? async () => false : createOverwriteDecision(name, spinner)
    });
  } catch (error: any) {
    if (error instanceof AddCancelled) {
      spinner.stop();
      console.log(chalk.yellow(error.message));
      return 'cancelled';
    }
    spinner.fail(chalk.red(error.message));
    console.error(`Check the component name and registry connection, then retry: ghostcn add ${name}`);
    return 'failed';
  }

  const outcome = result.installed.length ? 'installed' : 'kept';
  spinner.succeed(outcome === 'installed' ? `Installed "${name}".` : `Kept existing "${name}" files.`);
  for (const dependency of result.dependencies || []) {
    for (const file of dependency.installed) console.log(chalk.green(`  ✓ Dependency ${dependency.name}: installed ${file}`));
    for (const file of dependency.skipped) console.log(chalk.yellow(`  - Dependency ${dependency.name}: preserved ${file}`));
  }
  for (const file of result.installed) console.log(chalk.green(`  ✓ Installed ${file}`));
  for (const file of result.skipped) console.log(chalk.yellow(`  - Preserved ${file}`));
  if (result.skipped.length) {
    console.log(`Review changes: ghostcn diff ${name}`);
    console.log(`To replace deliberately (back up first): ghostcn add ${name} --yes`);
  }
  if (result.styleSync?.status === 'missing-template') {
    console.warn(chalk.yellow('  ⚠ default.hbs was not found, so component styles could not be linked automatically.'));
  } else if (result.styleSync?.status === 'updated') {
    console.log(chalk.green('  ✓ Updated the managed stylesheet links in default.hbs'));
  }
  if (result.scriptSync?.status === 'updated') console.log(chalk.green('  ✓ Updated managed component script links in default.hbs'));
  if (result.scriptSync?.status === 'missing-template') {
    console.warn(chalk.yellow('  ⚠ Add these script links before </body> in your layout:'));
    for (const asset of result.scriptSync.assetPaths) console.log(`<script defer src="{{asset "${asset}"}}"></script>`);
  }
  return outcome;
}

export async function add(componentNames: string[] | string = [], options: AddOptions = {}) {
  if (options.yes && options.skipExisting) {
    console.error('Choose either --yes (replace) or --skip-existing (preserve), not both.');
    process.exitCode = 1;
    return;
  }
  const configPath = path.join(process.cwd(), 'components.json');
  if (!fs.existsSync(configPath)) {
    console.error(chalk.red('components.json not found. Run "ghostcn init" from your theme directory first.'));
    process.exitCode = 1;
    return;
  }
  let config: GhostcnConfig;
  let names: string[];
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
    names = [...new Set((typeof componentNames === 'string' ? [componentNames] : componentNames).map(sanitizeComponentName))];
  } catch (error: any) {
    console.error(chalk.red(error instanceof SyntaxError ? 'Could not parse components.json. Ensure it contains valid JSON.' : error.message));
    process.exitCode = 1;
    return;
  }

  if (!names.length) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      console.error('Interactive selection requires a terminal. Specify names: ghostcn add button card --skip-existing');
      process.exitCode = 1;
      return;
    }
    const spinner = ora('Loading component catalog (registry requests time out after 5 seconds)...').start();
    let availableItems;
    try { availableItems = await getRegistryIndex(); }
    finally { spinner.stop(); }
    if (!availableItems.length) {
      console.error('No components found. Check your registry connection and retry "ghostcn list".');
      process.exitCode = 1;
      return;
    }
    let cancelled = false;
    const response = await prompts({
      type: 'multiselect', name: 'selected', message: 'Which components would you like to install?',
      choices: availableItems.map(item => ({ title: `${item.name.padEnd(18)} ${chalk.dim(item.description)}`, value: item.name })),
      hint: '- Space to select. Return to submit. Ctrl+C to cancel.'
    }, { onCancel: () => { cancelled = true; } });
    if (cancelled) { console.log('Cancelled. No components were installed.'); return; }
    names = response.selected || [];
    if (!names.length) { console.log('No components selected. Exiting.'); return; }
  }

  console.log(chalk.blue(`Installing ${names.length} component(s)...`));
  const counts = { installed: 0, kept: 0, failed: 0 };
  for (const name of names) {
    const outcome = await installSingleComponent(name, config, options);
    if (outcome === 'cancelled') return;
    counts[outcome]++;
  }
  console.log(`Finished: ${counts.installed} installed, ${counts.kept} kept existing, ${counts.failed} failed.`);
  if (counts.failed) process.exitCode = 1;
}
