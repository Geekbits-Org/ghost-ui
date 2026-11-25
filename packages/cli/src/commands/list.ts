import chalk from 'chalk';
import ora from 'ora';
import { getRegistryIndex } from '../utils/registry';

export async function list() {
  const spinner = ora('Fetching available components from ghostcn registry...').start();

  try {
    const items = await getRegistryIndex();

    if (!items || items.length === 0) {
      spinner.warn('No components found in the registry.');
      process.exitCode = 1;
      return;
    }

    spinner.succeed(`Found ${items.length} components in ghostcn registry:\n`);

    const labels: Record<string, string> = {
      'components:ui': 'Primitives & UI',
      'components:content': 'Publishing & Content',
      'components:members': 'Membership',
      'components:layout': 'Layout',
      'components:navigation': 'Navigation'
    };
    const grouped = new Map<string, typeof items>();
    for (const item of items) {
      const group = labels[item.category] || item.category || 'Components';
      const bucket = grouped.get(group) || [];
      bucket.push(item);
      grouped.set(group, bucket);
    }

    for (const [group, groupItems] of grouped.entries()) {
      console.log(chalk.bold.white(`  ${group}`));
      for (const item of groupItems) {
        console.log(`    ${chalk.bold.cyan(item.name)} — ${chalk.gray(item.description)}`);
        if (item.files && item.files.length > 0) {
          console.log(`    ${chalk.dim('Files:')} ${chalk.dim(item.files.join(', '))}`);
        }
      }
      console.log('');
    }

    console.log(`Install any component using: ${chalk.green('npx ghostcn add <component>')}`);
    console.log(`Or run ${chalk.green('npx ghostcn add')} to select interactively.\n`);
  } catch (err: any) {
    spinner.fail(`Failed to fetch component catalog: ${err.message || err}`);
    process.exitCode = 1;
  }
}
