import fs from 'fs';
import path from 'path';
import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import { getComponent, getRegistryIndex, sanitizeComponentName } from '../utils/registry';

export interface AddOptions {
  yes?: boolean;
}

async function installSingleComponent(componentName: string, config: any, options: AddOptions) {
  let sanitizedName: string;
  try {
    sanitizedName = sanitizeComponentName(componentName);
  } catch (err: any) {
    console.error(chalk.red(err.message));
    return false;
  }

  const cwd = process.cwd();
  const spinner = ora(`Fetching component "${sanitizedName}"...`).start();

  const manifest = await getComponent(sanitizedName);

  if (!manifest) {
    spinner.fail(`Component "${sanitizedName}" not found in the registry.`);
    return false;
  }

  spinner.succeed(`Found "${sanitizedName}"!`);

  for (const file of manifest.files) {
    let targetDirAlias = '';
    if (file.type === 'partial') targetDirAlias = config.aliases?.partials || 'partials/components';
    else if (file.type === 'style') targetDirAlias = config.aliases?.styles || 'assets/css/components';
    else if (file.type === 'js') targetDirAlias = config.aliases?.js || 'assets/js/components';

    if (!targetDirAlias) continue;

    const targetDir = path.join(cwd, targetDirAlias);
    const targetPath = path.join(targetDir, file.name);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (fs.existsSync(targetPath) && !options.yes) {
      const response = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: `File ${targetDirAlias}/${file.name} already exists. Overwrite?`,
        initial: false
      });

      if (!response.overwrite) {
        console.log(chalk.yellow(`Skipped ${file.name}.`));
        continue;
      }
    }

    fs.writeFileSync(targetPath, file.content, 'utf8');
    console.log(chalk.green(`Installed ${file.name} to ${targetDirAlias}/${file.name}`));
  }

  console.log(chalk.blue(`Component "${sanitizedName}" successfully installed!`));

  if (manifest.files.some(f => f.type === 'style')) {
    console.log(chalk.yellow(`Note: Import ${config.aliases?.styles || 'assets/css/components'}/<style>.css into your main stylesheet if using Vanilla CSS.`));
  }

  return true;
}

export async function add(componentName?: string, options: AddOptions = {}) {
  const cwd = process.cwd();
  const configPath = path.join(cwd, 'components.json');

  if (!fs.existsSync(configPath)) {
    console.error(chalk.red('components.json not found. Please run "ghostui init" first.'));
    process.exit(1);
  }

  let config: any;
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

  const response = await prompts({
    type: 'multiselect',
    name: 'selected',
    message: 'Which components would you like to install?',
    choices: availableItems.map(item => ({
      title: `${item.name.padEnd(18)} ${chalk.dim(item.description)}`,
      value: item.name
    })),
    hint: '- Space to select. Return to submit'
  });

  if (!response.selected || response.selected.length === 0) {
    console.log(chalk.yellow('No components selected. Exiting.'));
    return;
  }

  console.log(chalk.blue(`\nInstalling ${response.selected.length} component(s)...\n`));

  for (const item of response.selected) {
    await installSingleComponent(item, config, options);
    console.log('');
  }

  console.log(chalk.green('All selected components have been installed!'));
}
