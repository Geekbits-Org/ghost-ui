import fs from 'fs';
import path from 'path';
import http from 'http';
import crypto from 'crypto';
import { GhostcnConfig } from './theme-project';
import { ComponentManifest, getComponent, getRegistryIndex } from './registry';
import { componentPlan } from './component-plan';
import { componentPartialName, componentFiles } from './component-files';
import { safeThemePath } from './theme-files';
import { demoAuthor, demoParameters, previewDemoContext, previewInvocation, previewStates, renderPreviewTemplate } from './preview-renderer';

const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
const mime: Record<string, string> = { '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const templatesRoot = path.resolve(__dirname, '../templates/playground');

function collectThemeFiles(themeRoot: string, directory: string, extension?: string) {
  const start = safeThemePath(themeRoot, directory);
  const results: string[] = [];
  function walk(target: string) {
    if (!fs.existsSync(target)) return;
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink()) throw new Error('Playground refuses symlinked theme files.');
    if (stat.isDirectory()) for (const item of fs.readdirSync(target)) {
      if (results.length > 10000) throw new Error('Too many playground theme files.');
      walk(safeThemePath(themeRoot, path.relative(themeRoot, path.join(target, item))));
    } else if (stat.isFile() && (!extension || target.endsWith(extension))) results.push(target);
  }
  walk(start);
  return results;
}

function themeStyles(themeRoot: string, config: GhostcnConfig) {
  const layout = safeThemePath(themeRoot, 'default.hbs');
  const source = fs.existsSync(layout) ? fs.readFileSync(layout, 'utf8') : '';
  const links: string[] = [];
  for (const link of source.match(/<link\b[^>]*>/g) || []) {
    if (!/rel=["']stylesheet["']/.test(link)) continue;
    const asset = link.match(/\{\{asset\s+["']([^"']+\.css)["']\s*\}\}/)?.[1] || link.match(/href=["']\/assets\/([^"']+\.css)["']/)?.[1];
    if (asset && !links.includes(asset)) { safeThemePath(themeRoot, `assets/${asset}`); links.push(asset); }
  }
  if (!links.length) {
    const fallback = [config.cssFile, ...collectThemeFiles(themeRoot, config.aliases.styles, '.css').map(file => path.relative(themeRoot, file).replace(/\\/g, '/')), 'assets/built/screen.css'];
    for (const relative of fallback) if (fs.existsSync(safeThemePath(themeRoot, relative))) links.push(relative.replace(/^assets\//, ''));
  }
  return links;
}

export async function startPlayground(options: { themeRoot: string; port?: number }) {
  const themeRoot = fs.realpathSync(options.themeRoot);
  const config = JSON.parse(fs.readFileSync(safeThemePath(themeRoot, 'components.json'), 'utf8').replace(/^\uFEFF/, '')) as GhostcnConfig;
  if (!['css', 'tailwind'].includes(config.style) || !config.aliases) throw new Error('Invalid components.json. Run ghostcn doctor.');
  componentPartialName(config, 'button');
  const port = options.port ?? 4190;
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Port must be an integer between 0 and 65535.');
  const catalog: ComponentManifest[] = [];
  for (const item of await getRegistryIndex()) {
    const manifest = await getComponent(item.name);
    if (manifest) catalog.push(manifest);
  }
  const plans = new Map<string, Awaited<ReturnType<typeof componentPlan>>>();
  for (const manifest of catalog) plans.set(manifest.name, await componentPlan(themeRoot, config, manifest.name,
    async name => catalog.find(item => item.name === name) || null));
  const installed = () => catalog.filter(manifest => {
    const file = componentFiles(themeRoot, config, manifest).find(file => file.relative.endsWith('.hbs'));
    return file && fs.existsSync(file.target);
  });
  const revision = () => {
    const files = [safeThemePath(themeRoot, 'default.hbs'), ...collectThemeFiles(themeRoot, 'partials', '.hbs'), ...collectThemeFiles(themeRoot, 'assets')];
    const hash = crypto.createHash('sha256');
    for (const file of files.sort()) if (fs.existsSync(file)) { const stat = fs.statSync(file); hash.update(`${file}:${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}`); }
    return hash.digest('hex');
  };
  let actualPort = port;
  const server = http.createServer((request, response) => {
    const send = (status: number, body: string | Buffer, type = 'text/html') => {
      response.writeHead(status, {
        'Content-Type': `${type}${type.startsWith('text/') || type === 'application/json' ? '; charset=utf-8' : ''}`,
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
        'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'"
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    if (!['GET', 'HEAD'].includes(request.method || '')) { send(405, 'Read-only playground.', 'text/plain'); return; }
    if (![`127.0.0.1:${actualPort}`, `localhost:${actualPort}`].includes(request.headers.host || '')) { send(403, 'Localhost access only.', 'text/plain'); return; }
    try {
      const url = new URL(request.url || '/', `http://127.0.0.1:${actualPort}`);
      if (url.pathname === '/') { send(200, fs.readFileSync(path.join(templatesRoot, 'index.html'))); return; }
      if (url.pathname === '/catalog') {
        send(200, JSON.stringify({ style: config.style, components: installed().map(manifest => ({ name: manifest.name, description: manifest.description, parameters: manifest.parameters || {}, styleSlots: manifest.styleSlots || {}, partial: manifest.name === 'pagination' ? 'pagination' : componentPartialName(config, manifest.name), defaults: demoParameters[manifest.name] || {} })) }), 'application/json'); return;
      }
      if (url.pathname === '/revision') { send(200, JSON.stringify({ revision: revision() }), 'application/json'); return; }
      if (url.pathname === '/playground.css' || url.pathname === '/playground.js' || url.pathname === '/preview.js' || url.pathname === '/preview.css') {
        send(200, fs.readFileSync(path.join(templatesRoot, path.basename(url.pathname))), mime[path.extname(url.pathname)]); return;
      }
      if (url.pathname.startsWith('/theme-assets/')) {
        const relative = decodeURIComponent(url.pathname.slice('/theme-assets/'.length));
        if (!mime[path.extname(relative).toLowerCase()] || /(^|[\\/])\.\.?([\\/]|$)/.test(relative)) { send(403, 'Unsupported asset.', 'text/plain'); return; }
        const asset = safeThemePath(themeRoot, `assets/${relative}`);
        if (!fs.existsSync(asset) || !fs.statSync(asset).isFile()) { send(404, 'Asset not found. Run your theme build.', 'text/plain'); return; }
        send(200, fs.readFileSync(asset), mime[path.extname(relative).toLowerCase()]); return;
      }
      if (url.pathname.startsWith('/preview/')) {
        const name = url.pathname.slice('/preview/'.length);
        const manifest = installed().find(item => item.name === name);
        if (!manifest) { send(404, 'Component is not installed. Run ghostcn add first.', 'text/plain'); return; }
        const partials: Record<string, string> = {};
        for (const dependency of plans.get(name) || []) for (const file of dependency.files.filter(file => file.relative.endsWith('.hbs'))) {
          // Partial blocks have fallback content, so missing dependencies can otherwise
          // appear to render successfully while silently dropping the card wrapper.
          if (!fs.existsSync(safeThemePath(themeRoot, file.relative))) throw new Error(`Missing component dependency partial: ${file.relative}. Run ghostcn add ${name}.`);
        }
        for (const file of collectThemeFiles(themeRoot, 'partials', '.hbs')) partials[path.relative(path.join(themeRoot, 'partials'), file).replace(/\\/g, '/').replace(/\.hbs$/, '')] = fs.readFileSync(file, 'utf8');
        const parameters: Record<string, unknown> = { ...(demoParameters[name] || {}) };
        const keys = new Set([...Object.keys(manifest.parameters || {}), ...Object.keys(manifest.styleSlots || {})]);
        for (const key of keys) if (url.searchParams.has(key)) parameters[key] = ['disabled', 'required', 'invalid', 'urgent'].includes(key) ? url.searchParams.get(key) === 'true' : url.searchParams.get(key)!;
        const state = previewStates.includes(url.searchParams.get('state') || '') ? url.searchParams.get('state')! : 'visitor';
        const scheme = url.searchParams.get('scheme');
        const nameInTheme = name === 'pagination' ? 'pagination' : componentPartialName(config, name);
        const context: Record<string, unknown> = { ...(name === 'author-card' ? demoAuthor : previewDemoContext), ...parameters };
        let source = previewInvocation(nameInTheme, parameters);
        if (name === 'pagination') source = `{{> "pagination" pagination ${Object.keys(parameters).map(key => `${key}=${key}`).join(' ')}}}`;
        let html = renderPreviewTemplate(partials, source, { state, context });
        if (name === 'table-of-contents') html += '<article class="ghcn-article-content"><h2>Start with your story</h2><p>Demo article.</p><h3>Make room for readers</h3><p>A subsection.</p><h2>Keep it yours</h2><p>Your theme, your style.</p></article>';
        const scripts = manifest.files.filter(file => file.type === 'js').map(file => componentFiles(themeRoot, config, manifest).find(target => target.relative.endsWith(`/${file.name}`))!).filter(Boolean);
        const styles = themeStyles(themeRoot, config).map(asset => `<link rel="stylesheet" href="/theme-assets/${escape(asset)}">`).join('');
        const scriptTags = scripts.map(file => `<script defer src="/theme-assets/${escape(file.relative.replace(/^assets\//, ''))}"></script>`).join('');
        send(200, `<!doctype html><html lang="en" class="${scheme === 'dark' ? 'dark-mode dark' : scheme === 'auto' ? 'auto-color' : ''}" data-theme="${scheme === 'dark' ? 'dark' : 'light'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(name)} preview</title>${styles}<link rel="stylesheet" href="/preview.css"></head><body><main class="playground-preview">${html.trim() || '<p>This component is hidden for the selected settings.</p>'}<p id="preview-feedback" role="status"></p></main>${scriptTags}<script defer src="/preview.js"></script></body></html>`); return;
      }
      send(404, 'Not found.', 'text/plain');
    } catch (error) { send(400, `<!doctype html><html lang="en"><head><title>Preview error</title></head><body><h1>Cannot render preview</h1><p>${escape((error as Error).message)}</p><p>Check missing partials, run your theme build, or use Ghost to test helpers not supported by this synthetic preview.</p></body></html>`); }
  });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', () => { server.removeListener('error', reject); actualPort = (server.address() as { port: number }).port; resolve(); }); });
  return { server, url: `http://127.0.0.1:${actualPort}`, close: () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())) };
}
