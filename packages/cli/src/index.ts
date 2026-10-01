#!/usr/bin/env node
import { Command } from 'commander';
import { init } from './commands/init';
import { add } from './commands/add';
import { list } from './commands/list';
import { create } from './commands/create';
import { doctor } from './commands/doctor';
import { pack } from './commands/pack';
import packageJson from '../package.json';

function main() {
  const program = new Command()
    .name('ghostcn')
    .description('The shadcn/ui for Ghost CMS themes')
    .version(packageJson.version || '1.0.0');

  program
    .command('create')
    .description('Create a complete Ghost theme with ghostcn components')
    .argument('[theme-name]', 'Directory and package name for the new theme')
    .option('-y, --yes', 'Skip prompts and use recommended defaults')
    .option('--skip-install', 'Generate the theme without installing dependencies')
    .action(create);

  program
    .command('init')
    .description('Initialize your Ghost theme and choose a component structure')
    .option('-y, --yes', 'Skip prompts and use default configuration')
    .action(init);

  program
    .command('list')
    .description('List all available components in the ghostcn registry')
    .action(list);

  program
    .command('add')
    .description('Add one or more components to your Ghost theme')
    .argument('[component]', 'The component to add (leave blank for interactive selection)')
    .option('-y, --yes', 'Overwrite existing files without prompting')
    .action(add);

  program.command('doctor').description('Check theme configuration, local assets, partials and build readiness').action(doctor);
  program.command('pack').description('Package built theme runtime files as a Ghost-uploadable ZIP').action(pack);

  program.parse();
}

main();
