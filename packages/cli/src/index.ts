#!/usr/bin/env node
import { Command } from 'commander';
import { init } from './commands/init';
import { add } from './commands/add';
import { list } from './commands/list';
import { create } from './commands/create';
import { doctor } from './commands/doctor';
import { pack } from './commands/pack';
import { diff } from './commands/diff';
import { playground } from './commands/playground';
import packageJson from '../package.json';

function main() {
  const program = new Command()
    .name('ghostcn')
    .description('The shadcn/ui for Ghost CMS themes')
    .version(packageJson.version || '1.0.0')
    .addHelpText('after', `\nDocumentation: ${packageJson.homepage}`);

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
    .argument('[components...]', 'Component names to add (leave blank for interactive selection)')
    .option('-y, --yes', 'Overwrite existing files without prompting')
    .option('--skip-existing', 'Keep existing files and install missing files without prompting')
    .action(add);

  program.command('doctor').description('Check theme configuration, local assets, partials and build readiness').action(doctor);
  program.command('diff').description('Review component changes without writing or overwriting any files')
    .argument('[component]', 'Compare one component, or all installed components')
    .option('--latest', 'Compare with the latest remote registry (main); fail if unavailable')
    .option('--summary', 'Show file statuses without full diffs')
    .option('--json', 'Return machine-readable comparisons with baseline, local and registry content')
    .action(diff);
  program.command('pack').description('Package built theme runtime files as a Ghost-uploadable ZIP').action(pack);
  program.command('playground').description('Preview installed components locally with synthetic content (read-only)')
    .option('--port <number>', 'Local loopback port (0 chooses an available port)', '4190').action(playground);

  program.parseAsync().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

main();
