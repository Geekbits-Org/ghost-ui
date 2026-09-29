import { spawnSync } from 'child_process';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { AccentColor, BaseColor, Radius, ThemeConfig } from '../utils/theme';
import { installComponent } from '../utils/component-installer';
import { buildGhostcnConfig, initializeThemeProject } from '../utils/theme-project';
import {
  ColorScheme,
  PackageManager,
  REQUIRED_STARTER_COMPONENTS,
  sanitizeThemeName,
  scaffoldTheme
} from '../utils/theme-scaffold';

export interface CreateOptions {
  yes?: boolean;
  skipInstall?: boolean;
}

export async function create(themeNameArgument?: string, options: CreateOptions = {}) {
  let themeName = themeNameArgument || '';
  let style: 'tailwind' | 'css' = 'tailwind';
  let baseColor: BaseColor = 'zinc';
  let accentColor: AccentColor = 'ghost';
  let radius: Radius = '0.5rem';
  let colorScheme: ColorScheme = 'Auto';
  let packageManager: PackageManager = 'npm';
  let authorName = 'Theme Author';
  let authorEmail = 'hello@example.com';
  let optionalComponents = ['newsletter-form', 'author-card'];
  let installDependencies = !options.skipInstall;

  if (!options.yes) {
    const response = await prompts([
      ...(!themeName ? [{ type: 'text' as const, name: 'themeName', message: 'What should the theme be called?', initial: 'my-ghost-theme' }] : []),
      { type: 'select', name: 'style', message: 'Which styling system?', choices: [{ title: 'Tailwind CSS', value: 'tailwind' }, { title: 'Vanilla CSS', value: 'css' }], initial: 0 },
      { type: 'select', name: 'baseColor', message: 'Choose a base palette', choices: ['zinc', 'slate', 'stone', 'gray', 'neutral'].map(value => ({ title: value[0].toUpperCase() + value.slice(1), value })), initial: 0 },
      { type: 'select', name: 'accentColor', message: 'Choose an accent color', choices: ['ghost', 'indigo', 'violet', 'blue', 'emerald', 'rose', 'orange', 'zinc'].map(value => ({ title: value === 'ghost' ? 'Ghost accent (Recommended)' : value[0].toUpperCase() + value.slice(1), value })), initial: 0 },
      { type: 'select', name: 'radius', message: 'Choose a border radius', choices: [{ title: 'Medium', value: '0.5rem' }, { title: 'Small', value: '0.25rem' }, { title: 'Large', value: '0.75rem' }, { title: 'Extra large', value: '1rem' }, { title: 'None', value: '0' }, { title: 'Pill', value: '9999px' }], initial: 0 },
      { type: 'select', name: 'colorScheme', message: 'Choose the initial color scheme', choices: ['Auto', 'Light', 'Dark'].map(value => ({ title: value, value })), initial: 0 },
      { type: 'multiselect', name: 'optionalComponents', message: 'Add optional starter components', choices: [{ title: 'Newsletter form', value: 'newsletter-form', selected: true }, { title: 'Author card', value: 'author-card', selected: true }, { title: 'Pricing table', value: 'pricing-table', selected: false }], hint: '- Space to select. Return to submit' },
      { type: 'select', name: 'packageManager', message: 'Choose a package manager', choices: ['npm', 'pnpm', 'yarn', 'bun'].map(value => ({ title: value, value })), initial: 0 },
      { type: 'text', name: 'authorName', message: 'Theme author name', initial: 'Theme Author' },
      { type: 'text', name: 'authorEmail', message: 'Theme author email', initial: 'hello@example.com', validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? true : 'Enter a valid email address' },
      ...(!options.skipInstall ? [{ type: 'confirm' as const, name: 'installDependencies', message: 'Install dependencies now?', initial: true }] : [])
    ], {
      onCancel: () => {
        console.log(chalk.yellow('\nTheme creation cancelled.'));
        process.exit(0);
      }
    });
    themeName = response.themeName || themeName;
    style = response.style || style;
    baseColor = response.baseColor || baseColor;
    accentColor = response.accentColor || accentColor;
    radius = response.radius || radius;
    colorScheme = response.colorScheme || colorScheme;
    optionalComponents = response.optionalComponents || [];
    packageManager = response.packageManager || packageManager;
    authorName = response.authorName || authorName;
    authorEmail = response.authorEmail || authorEmail;
    if (typeof response.installDependencies === 'boolean') installDependencies = response.installDependencies;
  }

  try {
    themeName = sanitizeThemeName(themeName);
  } catch (error: any) {
    console.error(chalk.red(error.message));
    process.exitCode = 1;
    return;
  }

  const spinner = ora(`Creating Ghost theme "${themeName}"...`).start();
  try {
    const includeNewsletter = optionalComponents.includes('newsletter-form');
    const includeAuthorCard = optionalComponents.includes('author-card');
    const includePricing = optionalComponents.includes('pricing-table');
    const scaffold = scaffoldTheme({
      parentDirectory: process.cwd(), themeName, style, colorScheme, packageManager,
      authorName, authorEmail,
      includeNewsletter, includeAuthorCard, includePricing
    });
    const themeConfig: ThemeConfig = { style, baseColor, accentColor, radius };
    const config = buildGhostcnConfig(themeConfig);
    initializeThemeProject({ themeRoot: scaffold.themeRoot, config });

    const components = [...REQUIRED_STARTER_COMPONENTS, ...optionalComponents];
    for (const componentName of components) {
      await installComponent({ themeRoot: scaffold.themeRoot, componentName, config, overwrite: true });
    }
    spinner.succeed(chalk.green(`Created ${themeName} with ${components.length} components.`));

    if (installDependencies) {
      const installSpinner = ora(`Installing dependencies with ${packageManager}...`).start();
      installSpinner.stop();
      const installed = spawnSync(packageManager, ['install'], {
        cwd: scaffold.themeRoot,
        stdio: 'inherit',
        shell: process.platform === 'win32'
      });
      if (installed.status !== 0) {
        console.warn(chalk.yellow(`Dependency installation did not finish. The generated theme is intact; run "${packageManager} install" inside it.`));
      }
    }

    const run = packageManager === 'npm' ? 'npm run' : `${packageManager} run`;
    console.log(`\n${chalk.bold.green('Your Ghost theme is ready.')}`);
    console.log(`  ${chalk.cyan(`cd ${path.basename(scaffold.themeRoot)}`)}`);
    if (!installDependencies) console.log(`  ${chalk.cyan(`${packageManager} install`)}`);
    console.log(`  ${chalk.cyan(`${run} dev`)}\n`);
  } catch (error: any) {
    spinner.fail(chalk.red(error.message));
    process.exitCode = 1;
  }
}
