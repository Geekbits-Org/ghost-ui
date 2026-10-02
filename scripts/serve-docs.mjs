import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs/dist');
if (!fs.existsSync(path.join(root,'index.html'))) throw new Error('Run npm run docs:build first.');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.json':'application/json' };
const server = http.createServer((req,res) => {
  let url;
  try { url = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400); return res.end('Invalid URL'); }
  const file = path.resolve(root, `.${url.endsWith('/') ? `${url}index.html` : url}`);
  if (!file.startsWith(root+path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'}); return res.end(fs.readFileSync(path.join(root,'404.html'))); }
  res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control','no-store');
  res.end(fs.readFileSync(file));
});
server.listen(4180,'127.0.0.1',()=>console.log('Ghostcn docs: http://127.0.0.1:4180/'));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>process.exit(0)));
