import { runThemeTool } from '../utils/theme-tooling';

export function pack() {
  console.log('Build your theme first. This command packages existing runtime files only.');
  process.exitCode = runThemeTool('pack', process.cwd());
}
