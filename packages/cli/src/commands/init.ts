import path from 'path';
import fs from 'fs';
import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import { BaseColor, AccentColor, Radius, ThemeConfig } from '../utils/theme';
import { buildGhostcnConfig, initializeThemeProject } from '../utils/theme-project';

export interface InitOptions {
  yes?: boolean;
}

export async function init(options: InitOptions = {}) {
  console.log(chalk.bold.blue('\n✨ Initializing ghostcn theming system...\n'));

  const cwd = process.cwd();

  // Verify it's a ghost theme
  const packageJsonPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red('No package.json found. Please run this command from the root of a Ghost theme.'));
    process.exit(1);
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8').replace(/^\uFEFF/, ''));
    if (!packageJson.engines || (!packageJson.engines.ghost && !packageJson.engines['ghost-api'])) {
      console.warn(
        chalk.yellow('⚠️  Warning: No "ghost" engine found in package.json. Continuing anyway, but ensure this is a Ghost theme.')
      );
    }
  } catch {
    console.error(chalk.red('Error reading package.json. Ensure it is valid JSON.'));
    process.exit(1);
  }

  let style: 'tailwind' | 'css' = 'tailwind';
  let baseColor: BaseColor = 'zinc';
  let accentColor: AccentColor = 'ghost';
  let radius: Radius = '0.5rem';
  let partialsAlias = 'partials/components';
  let stylesAlias = 'assets/css/components';
  let cssFile = 'assets/css/ghostcn.css';

  if (!options.yes) {
    const response = await prompts(
      [
        {
          type: 'select',
          name: 'style',
          message: 'Which styling system are you using?',
          choices: [
            { title: 'Tailwind CSS', value: 'tailwind', description: 'Utility-first CSS' },
            { title: 'Vanilla CSS', value: 'css', description: 'Raw Ghost CSS with Custom Properties' }
          ],
          initial: 0
        },
        {
          type: 'select',
          name: 'baseColor',
          message: 'Which base color palette would you like to use?',
          choices: [
            { title: 'Zinc', value: 'zinc', description: 'Modern neutral with cool undertones' },
            { title: 'Slate', value: 'slate', description: 'Cool gray with subtle blue tones' },
            { title: 'Stone', value: 'stone', description: 'Warm, earthy neutral' },
            { title: 'Gray', value: 'gray', description: 'Clean, balanced neutral gray' },
            { title: 'Neutral', value: 'neutral', description: 'Pure monochromatic neutral' }
          ],
          initial: 0
        },
        {
          type: 'select',
          name: 'accentColor',
          message: 'Which accent / primary color would you like to use?',
          choices: [
            {
              title: 'Ghost Accent (Recommended)',
              value: 'ghost',
              description: 'Dynamically connects to Ghost Admin brand color (@site.accent_color)'
            },
            { title: 'Indigo', value: 'indigo', description: 'Deep tech indigo' },
            { title: 'Violet', value: 'violet', description: 'Vibrant modern violet' },
            { title: 'Blue', value: 'blue', description: 'Classic editorial blue' },
            { title: 'Emerald', value: 'emerald', description: 'Lush natural green' },
            { title: 'Rose', value: 'rose', description: 'Warm crimson rose' },
            { title: 'Orange', value: 'orange', description: 'Energetic warm orange' },
            { title: 'Zinc / Monochrome', value: 'zinc', description: 'Minimalist black/white' }
          ],
          initial: 0
        },
        {
          type: 'select',
          name: 'radius',
          message: 'Which border radius style would you like?',
          choices: [
            { title: 'Medium (0.5rem)', value: '0.5rem' },
            { title: 'Small (0.25rem)', value: '0.25rem' },
            { title: 'Large (0.75rem)', value: '0.75rem' },
            { title: 'Extra Large (1.0rem)', value: '1rem' },
            { title: 'None (0px)', value: '0' },
            { title: 'Full (Pill / 9999px)', value: '9999px' }
          ],
          initial: 0
        },
        {
          type: 'text',
          name: 'cssFile',
          message: 'Where should the theme CSS tokens file be written?',
          initial: 'assets/css/ghostcn.css'
        },
        {
          type: 'text',
          name: 'partialsAlias',
          message: 'Where should Handlebars partials be installed?',
          initial: 'partials/components'
        },
        {
          type: 'text',
          name: 'stylesAlias',
          message: 'Where should component CSS stylesheets be installed?',
          initial: 'assets/css/components'
        }
      ],
      {
        onCancel: () => {
          console.log(chalk.red('\nInitialization cancelled.'));
          process.exit(1);
        }
      }
    );

    style = response.style || style;
    baseColor = response.baseColor || baseColor;
    accentColor = response.accentColor || accentColor;
    radius = response.radius || radius;
    cssFile = response.cssFile || cssFile;
    partialsAlias = response.partialsAlias || partialsAlias;
    stylesAlias = response.stylesAlias || stylesAlias;
  }

  const themeConfig: ThemeConfig = {
    style,
    baseColor,
    accentColor,
    radius
  };

  const config = buildGhostcnConfig(themeConfig, {
    partials: partialsAlias,
    styles: stylesAlias,
    cssFile
  });

  const spinner = ora('Setting up theme configuration & design tokens...').start();

  let styleSync;
  try {
    styleSync = initializeThemeProject({ themeRoot: cwd, config }).styleSync;
  } catch (error: any) {
    spinner.fail(chalk.red(error.message));
    process.exit(1);
  }

  spinner.succeed(chalk.green('Configuration & design tokens successfully initialized!'));

  console.log('\n' + chalk.bold('Summary:'));
  console.log(`  • Style:         ${chalk.cyan(style)}`);
  console.log(`  • Base Palette:  ${chalk.cyan(baseColor)}`);
  console.log(`  • Accent Color:  ${chalk.cyan(accentColor)}`);
  console.log(`  • Border Radius: ${chalk.cyan(radius)}`);
  console.log(`  • Theme Tokens:  ${chalk.cyan(cssFile)}`);
  console.log(`  • Partials:      ${chalk.cyan(partialsAlias)}`);
  console.log(`  • Styles:        ${chalk.cyan(stylesAlias)}`);
  console.log(
    `  • Template:      ${
      styleSync.status === 'missing-template'
        ? chalk.yellow('default.hbs not found; stylesheet link not added')
        : chalk.cyan('default.hbs (managed automatically)')
    }`
  );

  console.log('\n' + chalk.bold.green('Next Steps:'));
  if (styleSync.status === 'missing-template') {
    console.log(`  1. Add this stylesheet to your layout's <head>:`);
    console.log(`     ${chalk.dim('<link rel="stylesheet" href="{{asset "' + cssFile.replace('assets/', '') + '"}}">')}`);
    console.log(`  2. Add components to your theme:`);
  } else {
    console.log(`  1. Add components to your theme:`);
  }
  console.log(`     ${chalk.cyan('npx ghostcn add')}`);
  console.log(`     ${chalk.cyan('npx ghostcn add newsletter-form')}\n`);
}
