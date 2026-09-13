import fs from 'fs';
import path from 'path';
import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import { getComponent } from '../utils/registry';

export interface AddOptions {
  yes?: boolean;
}

export async function add(componentName: string, options: AddOptions = {}) {
  const cwd = process.cwd();
  const configPath = path.join(cwd, 'components.json');

  if (!fs.existsSync(configPath)) {
    console.error(chalk.red('components.json not found. Please run npx @ghost-ui/cli init first.'));
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
  const spinner = ora(`Fetching component ${componentName}...`).start();

  const manifest = await getComponent(componentName);

  if (!manifest) {
    spinner.fail(`Component ${componentName} not found in the registry.`);
    process.exit(1);
  }

  spinner.succeed(`Found ${componentName}!`);

  for (const file of manifest.files) {
    let targetDirAlias = '';
    if (file.type === 'partial') targetDirAlias = config.aliases.partials;
    else if (file.type === 'style') targetDirAlias = config.aliases.styles;
    else if (file.type === 'js') targetDirAlias = config.aliases.js || 'assets/js/components';

    if (!targetDirAlias) continue; // Safety check

    const targetDir = path.join(cwd, targetDirAlias);
    const targetPath = path.join(targetDir, file.name);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (fs.existsSync(targetPath) && !options.yes) {
      const response = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: `File ${targetPath} already exists. Overwrite?`,
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

  console.log(chalk.blue(`\nComponent ${componentName} successfully installed!`));
  if (manifest.files.some(f => f.type === 'style')) {
    console.log(chalk.yellow('\nNote: You may need to import the installed CSS file into your main stylesheet or Gulp pipeline.'));
  }
}
