import chalk from 'chalk';
import ora from 'ora';
import { getRegistryIndex } from '../utils/registry';

export async function list() {
  const spinner = ora('Fetching available components from Ghost UI registry...').start();

  try {
    const items = await getRegistryIndex();

    if (!items || items.length === 0) {
      spinner.warn('No components found in the registry.');
      return;
    }

    spinner.succeed(`Found ${items.length} components in Ghost UI registry:\n`);

    for (const item of items) {
      console.log(`  ${chalk.bold.cyan(item.name)}`);
      console.log(`  ${chalk.gray(item.description)}`);
      if (item.files && item.files.length > 0) {
        console.log(`  ${chalk.dim('Files:')} ${chalk.dim(item.files.join(', '))}`);
      }
      console.log('');
    }

    console.log(`Install any component using: ${chalk.green('ghost-ui add <component>')}`);
    console.log(`Or run ${chalk.green('ghost-ui add')} to select interactively.\n`);
  } catch (err: any) {
    spinner.fail(`Failed to fetch component catalog: ${err.message || err}`);
  }
}
