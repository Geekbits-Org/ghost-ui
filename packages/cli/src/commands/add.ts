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
}

async function installSingleComponent(componentName: string, config: GhostcnConfig, options: AddOptions) {
  let sanitizedName: string;
  try {
    sanitizedName = sanitizeComponentName(componentName);
  } catch (err: any) {
    console.error(chalk.red(err.message));
    return false;
  }

  const cwd = process.cwd();
  const spinner = ora(`Fetching component "${sanitizedName}"...`).start();

  let result;
  try {
    result = await installComponent({
      themeRoot: cwd,
      componentName: sanitizedName,
      config,
      overwrite: options.yes,
      shouldOverwrite: async relativePath => {
        const response = await prompts(
          {
            type: 'confirm',
            name: 'overwrite',
            message: `File ${relativePath} already exists. Overwrite?`,
            initial: false
          },
          {
            onCancel: () => {
              console.log(chalk.yellow('\nOperation cancelled.'));
              process.exit(0);
            }
          }
        );
        return Boolean(response.overwrite);
      }
    });
  } catch (error: any) {
    spinner.fail(chalk.red(error.message));
    return false;
  }

  spinner.succeed(`Found "${sanitizedName}"!`);
  for (const installed of result.installed) console.log(chalk.green(`  ✓ Installed ${installed}`));
  for (const skipped of result.skipped) console.log(chalk.yellow(`  - Skipped ${skipped}`));

  if (result.styleSync?.status === 'missing-template') {
    console.warn(chalk.yellow('  ⚠ default.hbs was not found, so component styles could not be linked automatically.'));
  } else if (result.styleSync?.status === 'updated') {
    console.log(chalk.green('  ✓ Updated the managed stylesheet links in default.hbs'));
  }

  console.log(chalk.bold.blue(`Component "${sanitizedName}" successfully installed!`));

  return true;
}

export async function add(componentName?: string, options: AddOptions = {}) {
  const cwd = process.cwd();
  const configPath = path.join(cwd, 'components.json');

  if (!fs.existsSync(configPath)) {
    console.error(chalk.red('components.json not found. Please run "npx ghostcn init" first.'));
    process.exit(1);
  }

  let config: GhostcnConfig;
  try {
    const raw = fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '');
    config = JSON.parse(raw);
  } catch {
    console.error(chalk.red('Could not parse components.json. Ensure it contains valid JSON.'));
    process.exit(1);
  }

  // If component name is provided directly, install it
  if (componentName) {
    const ok = await installSingleComponent(componentName, config, options);
    if (!ok) process.exit(1);
    return;
  }

  // If no component specified, display interactive selection
  const spinner = ora('Loading component catalog...').start();
  const availableItems = await getRegistryIndex();
  spinner.stop();

  if (!availableItems || availableItems.length === 0) {
    console.error(chalk.red('No components found in the registry.'));
    process.exit(1);
  }

  const response = await prompts(
    {
      type: 'multiselect',
      name: 'selected',
      message: 'Which components would you like to install?',
      choices: availableItems.map(item => ({
        title: `${item.name.padEnd(18)} ${chalk.dim(item.description)}`,
        value: item.name
      })),
      hint: '- Space to select. Return to submit'
    },
    {
      onCancel: () => {
        console.log(chalk.yellow('\nCancelled.'));
        process.exit(0);
      }
    }
  );

  if (!response.selected || response.selected.length === 0) {
    console.log(chalk.yellow('No components selected. Exiting.'));
    return;
  }

  console.log(chalk.blue(`\nInstalling ${response.selected.length} component(s)...\n`));

  for (const item of response.selected) {
    await installSingleComponent(item, config, options);
    console.log('');
  }

  console.log(chalk.bold.green('All selected components have been installed!'));
}
