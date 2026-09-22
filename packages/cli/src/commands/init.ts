import fs from 'fs';
import path from 'path';
import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';

export interface InitOptions {
  yes?: boolean;
}

export async function init(options: InitOptions = {}) {
  console.log(chalk.blue('Initializing ghostcn component system...'));

  const cwd = process.cwd();
  
  // Verify it's a ghost theme
  const packageJsonPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red('No package.json found. Please run this command from the root of a Ghost theme.'));
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8').replace(/^\uFEFF/, ''));
  if (!packageJson.engines || (!packageJson.engines.ghost && !packageJson.engines['ghost-api'])) {
    console.warn(chalk.yellow('Warning: No "ghost" engine found in package.json. Continuing anyway, but ensure this is a Ghost theme.'));
  }

  let style = 'tailwind';
  let partialsAlias = 'partials/components';
  let stylesAlias = 'assets/css/components';

  if (!options.yes) {
    const response = await prompts([
      {
        type: 'select',
        name: 'style',
        message: 'Which styling system are you using?',
        choices: [
          { title: 'Tailwind CSS', value: 'tailwind' },
          { title: 'Vanilla CSS', value: 'css' }
        ]
      },
      {
        type: 'text',
        name: 'partialsAlias',
        message: 'Where should partials be installed?',
        initial: 'partials/components'
      },
      {
        type: 'text',
        name: 'stylesAlias',
        message: 'Where should styles be installed?',
        initial: 'assets/css/components'
      }
    ]);

    if (!response.partialsAlias || !response.stylesAlias) {
      console.log(chalk.red('Initialization aborted.'));
      process.exit(1);
    }

    style = response.style || style;
    partialsAlias = response.partialsAlias;
    stylesAlias = response.stylesAlias;
  }

  const config = {
    style,
    aliases: {
      partials: partialsAlias,
      styles: stylesAlias
    }
  };

  const configPath = path.join(cwd, 'components.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(chalk.green('\nSuccess! Configuration written to components.json.'));
  console.log(`You can now add components using ${chalk.cyan('npx ghostcn add <component>')}`);
}
