import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

export function themeToolPath(): string {
  const bundled = path.join(__dirname, '../templates/theme-tools.mjs');
  return fs.existsSync(bundled) ? bundled : path.join(__dirname, '../../templates/theme-tools.mjs');
}

export function runThemeTool(action: 'doctor' | 'pack', themeRoot: string): number {
  const result = spawnSync(process.execPath, [themeToolPath(), action, themeRoot], { stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  return result.status ?? 1;
}
