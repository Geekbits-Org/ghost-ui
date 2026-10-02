// Create an isolated Sites publishing checkout without touching Ghostcn's Git origin.
// The canonical, editable source remains under docs/ and scripts/ in ghost-ui.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.join(repo,'.sites-runtime/docs-publish');
const manifest=JSON.parse(fs.readFileSync(path.join(repo,'docs/.openai/hosting.json'),'utf8'));
if(!manifest.project_id)throw new Error('Register the documentation Site before preparing its checkout.');
const existing=path.join(root,'.openai/hosting.json');
if(fs.existsSync(existing)&&JSON.parse(fs.readFileSync(existing,'utf8')).project_id!==manifest.project_id)throw new Error('Publishing checkout belongs to a different Site; preserve it.');
fs.mkdirSync(path.join(root,'.openai'),{recursive:true});
fs.copyFileSync(path.join(repo,'docs/.openai/hosting.json'),existing);
const output=path.join(root,'dist');
if(fs.existsSync(output)) {
  if(fs.lstatSync(output).isSymbolicLink()||fs.realpathSync(output)!==path.join(fs.realpathSync(root),'dist'))throw new Error('Unexpected publishing output target');
  fs.rmSync(output,{recursive:true,force:true});
}
fs.cpSync(path.join(repo,'docs/dist'),path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'README.md'),'# Ghostcn documentation deployment\n\nGenerated from https://github.com/Geekbits-Org/ghost-ui.\n\nCanonical sources: docs/ and scripts/build-docs.mjs. Do not hand-edit generated output; rebuild from the Ghostcn repository.\n');
console.log(JSON.stringify({checkout_path:root,project_id:manifest.project_id}));
