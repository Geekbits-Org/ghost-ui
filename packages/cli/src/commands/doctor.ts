import { runThemeTool } from '../utils/theme-tooling';

export function doctor() {
  process.exitCode = runThemeTool('doctor', process.cwd());
}
