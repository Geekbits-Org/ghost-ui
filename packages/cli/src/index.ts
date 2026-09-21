#!/usr/bin/env node
import { Command } from 'commander';
import { init } from './commands/init';
import { add } from './commands/add';
import { list } from './commands/list';
import packageJson from '../package.json';

function main() {
  const program = new Command()
    .name('ghost-ui')
    .description('Component distribution system for Ghost CMS themes')
    .version(packageJson.version || '1.0.0');

  program
    .command('init')
    .description('Initialize your Ghost theme and choose a component structure')
    .option('-y, --yes', 'Skip prompts and use default configuration')
    .action(init);

  program
    .command('list')
    .description('List all available components in the Ghost UI registry')
    .action(list);

  program
    .command('add')
    .description('Add one or more components to your Ghost theme')
    .argument('[component]', 'The component to add (leave blank for interactive selection)')
    .option('-y, --yes', 'Overwrite existing files without prompting')
    .action(add);

  program.parse();
}

main();
