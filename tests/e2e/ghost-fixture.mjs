import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderEditorFixture } from './editor-fixture.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cli = createRequire(path.join(repo, 'packages/cli/package.json'));
const { scaffoldTheme } = cli('./dist/utils/theme-scaffold');
const { buildGhostcnConfig, initializeThemeProject } = cli('./dist/utils/theme-project');
const { installComponent } = cli('./dist/utils/component-installer');
const registry = JSON.parse(fs.readFileSync(path.join(repo, 'registry/index.json'), 'utf8'));
const id = () => randomBytes(12).toString('hex');
const run = (args, cwd) => { const r = spawnSync(process.execPath, args, { cwd, encoding: 'utf8' }); if (r.status !== 0) throw new Error(r.stderr || r.error?.message || r.stdout); };

export async function createGhostFixture(ghostRoot) {
  if (!ghostRoot) throw new Error('Set GHOST_E2E_ROOT to an installed Ghost 6 directory (with index.js and node_modules).');
  ghostRoot = fs.realpathSync(ghostRoot);
  const pkg = JSON.parse(fs.readFileSync(path.join(ghostRoot, 'package.json'), 'utf8'));
  if (!pkg.version.startsWith('6.')) throw new Error('The regression fixture currently supports Ghost 6.');
  const ghostRequire = createRequire(path.join(ghostRoot, 'package.json'));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostcn-live-e2e-'));
  // Ghost's version utility reads the process-root package, independently of its code path.
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'ghost', version: pkg.version, private: true }));
  const content = path.join(root, 'content');
  for (const directory of ['data', 'themes', 'images', 'media', 'settings', 'logs']) fs.mkdirSync(path.join(content, directory), { recursive: true });
  // A tiny valid local PCM file exercises media controls without downloads or playback.
  const wave = Buffer.alloc(44 + 8000 * 2); wave.write('RIFF'); wave.writeUInt32LE(wave.length - 8, 4); wave.write('WAVEfmt ', 8); wave.writeUInt32LE(16, 16); wave.writeUInt16LE(1, 20); wave.writeUInt16LE(1, 22); wave.writeUInt32LE(8000, 24); wave.writeUInt32LE(16000, 28); wave.writeUInt16LE(2, 32); wave.writeUInt16LE(16, 34); wave.write('data', 36); wave.writeUInt32LE(wave.length - 44, 40);
  fs.writeFileSync(path.join(content, 'media/e2e.wav'), wave);
  const editor = await renderEditorFixture(ghostRequire);
  await ghostRequire('sharp')({ create: { width: 640, height: 360, channels: 3, background: '#a78bfa' } }).png().toFile(path.join(content, 'images/e2e.png'));
  const themes = [];
  for (const style of ['css', 'tailwind']) for (const scheme of ['Light', 'Dark', 'Auto']) {
    const name = `e2e-${style}-${scheme.toLowerCase()}`;
    const { themeRoot } = scaffoldTheme({ parentDirectory: path.join(content, 'themes'), themeName: name, style, colorScheme: scheme, packageManager: 'npm', includeNewsletter: true, includeAuthorCard: true, includePricing: true });
    const config = buildGhostcnConfig({ style, baseColor: 'zinc', accentColor: 'violet', radius: '0.5rem' });
    initializeThemeProject({ themeRoot, config });
    for (const item of registry) await installComponent({ themeRoot, config, componentName: item.name });
    const postPath = path.join(themeRoot, 'post.hbs');
    let post = fs.readFileSync(postPath, 'utf8');
    post = post.replace('<div class="ghcn-article-content">', '{{> "components/table-of-contents" class="toc-test" linkClass="toc-first-link"}}\n        {{> "components/table-of-contents" class="toc-second" linkClass="toc-second-link"}}\n        <div class="ghcn-article-content">');
    post = post.replace('    {{comments}}', '    <div class="ghcn-article">{{> "components/tag-list"}}{{> "components/post-navigation"}}{{> "components/related-posts"}}</div>\n    {{comments}}');
    fs.writeFileSync(postPath, post);
    fs.appendFileSync(path.join(themeRoot, 'index.hbs'), '\n{{> "components/pricing-table" class="pricing-test" cardClass="rounded-2xl p-8 custom-card" buttonClass="bg-purple-600 text-white custom-button"}}\n');
    if (style === 'css') fs.appendFileSync(path.join(themeRoot, 'assets/css/source.css'), '\n.pricing-test .custom-card { padding: 2rem; border-radius: 1rem; }\n.pricing-test .custom-button { background: #9333ea; color: white; }\n');
    if (style === 'tailwind') {
      fs.mkdirSync(path.join(themeRoot, 'node_modules'));
      fs.symlinkSync(path.dirname(cli.resolve('tailwindcss/package.json')), path.join(themeRoot, 'node_modules/tailwindcss'), 'junction');
      run([path.join(path.dirname(cli.resolve('@tailwindcss/cli/package.json')), 'dist/index.mjs'), '-i', 'assets/css/source.css', '-o', 'assets/built/screen.css', '--minify'], themeRoot);
    } else run(['scripts/build.mjs'], themeRoot);
    themes.push({ name, style, scheme, root: themeRoot });
  }
  // Never reuse the developer's database, settings, content or port.
  const port = await new Promise(resolve => { const server = net.createServer(); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)); }); });
  const url = `http://127.0.0.1:${port}`;
  const database = path.join(content, 'data/e2e.db');
  const knex = ghostRequire('knex')({ client: 'better-sqlite3', connection: { filename: database }, useNullAsDefault: true });
  let child, log = '', secret, activeTheme, activeSignup;
  const stop = async () => {
    if (!child || child.exitCode !== null) return;
    const active = child;
    await new Promise(resolve => { active.once('close', resolve); active.kill('SIGTERM'); });
    child = undefined;
  };
  const start = async () => {
    log = '';
    child = spawn(process.execPath, [path.join(ghostRoot, 'index.js')], { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: {
      ...process.env, NODE_ENV: 'development', url, server__host: '127.0.0.1', server__port: String(port), database__client: 'better-sqlite3', database__connection__filename: database,
      paths__contentPath: content, logging__transports: '["stdout"]', mail__transport: 'Direct', privacy__useUpdateCheck: 'false', privacy__useGravatar: 'false', privacy__useRpcPing: 'false'
    } });
    child.stdout.on('data', data => { log += data; }); child.stderr.on('data', data => { log += data; });
    child.once('error', error => { log += error.message; });
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`Isolated Ghost exited ${child.exitCode}:\n${log.slice(-10000)}`);
      try { const response = await fetch(`${url}/ghost/api/admin/site/`, { signal: AbortSignal.timeout(1000) }); if (response.status === 200) return; } catch {}
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    throw new Error(`Isolated Ghost did not become ready:\n${log.slice(-10000)}`);
  };
  const setting = async (key, value) => {
    const updated = await knex('settings').where({ key }).update({ value: typeof value === 'string' ? value : JSON.stringify(value) });
    if (!updated) throw new Error(`Fixture setting ${key} is not present in Ghost ${pkg.version}.`);
  };
  try {
    await start(); await stop();
    console.log(`Initialized isolated Ghost ${pkg.version}: ${root}`);
    const now = '2026-01-01 12:00:00';
    const author = await knex('users').first();
    await knex('users').where({ id: author.id }).update({ name: 'Ghostcn Test Author', slug: 'test-author', status: 'active' });
    await setting('title', 'Ghostcn Regression Publication');
    await setting('members_signup_access', 'all');
    await setting('comments_enabled', 'all');
    // The fresh database's sample post is outside our fixed navigation/image fixture.
    await knex('posts').where({ status: 'published' }).update({ status: 'draft' });
    const tagId = id(), internalId = id();
    await knex('tags').insert([{ id: tagId, name: 'Reading', slug: 'reading', visibility: 'public', created_at: now }, { id: internalId, name: '#test-internal', slug: 'hash-test-internal', visibility: 'internal', created_at: now }]);
    const postIds = {};
    for (const [index, slug] of ['first-story', 'editor-cards', 'last-story', 'members-story', 'paid-story', 'untagged-story', 'empty-headings'].entries()) {
      const postId = id(); postIds[slug] = postId;
      await knex('posts').insert({ id: postId, uuid: randomUUID(), title: slug.replace(/-/g, ' '), slug, type: 'post', status: 'published', visibility: slug === 'members-story' ? 'members' : slug === 'paid-story' ? 'paid' : 'public', featured: index === 1, html: slug === 'editor-cards' ? editor.html : slug === 'empty-headings' ? '<p>No headings in this post.</p>' : slug === 'untagged-story' ? '<h2>Repeated heading</h2><p>Untagged content.</p><h3>Repeated heading</h3>' : `<h2>Private text sentinel ${slug}</h2><p>Fixture story ${slug}</p>`, lexical: slug === 'editor-cards' ? editor.lexical : null, plaintext: `Fixture story ${slug}`, feature_image: '/content/images/e2e.png', email_recipient_filter: 'all', created_at: now, updated_at: now, published_at: `2026-01-${String(index + 1).padStart(2, '0')} 12:00:00`, published_by: author.id, comment_id: postId });
      await knex('posts_authors').insert({ id: id(), post_id: postId, author_id: author.id, sort_order: 0 });
      if (!['untagged-story', 'empty-headings'].includes(slug)) await knex('posts_tags').insert([{ id: id(), post_id: postId, tag_id: tagId, sort_order: 0 }, { id: id(), post_id: postId, tag_id: internalId, sort_order: 1 }]);
    }
    const paidTier = await knex('products').where({ type: 'paid' }).first();
    if (!paidTier) throw new Error('Expected Ghost default paid tier.');
    await knex('products').where({ id: paidTier.id }).update({ visibility: 'public', name: 'Test Supporter', currency: 'USD', monthly_price: 500, yearly_price: 5000 });
    const members = {};
    for (const status of ['free', 'comped']) {
      const memberId = id(), transient = randomUUID();
      await knex('members').insert({ id: memberId, uuid: randomUUID(), transient_id: transient, email: `${status}@ghostcn-test.example`, name: `Test ${status}`, status, created_at: now });
      if (status === 'comped') await knex('members_products').insert({ id: id(), member_id: memberId, product_id: paidTier.id, sort_order: 0 });
      members[status === 'comped' ? 'paid' : 'free'] = transient;
    }
    secret = (await knex('settings').where({ key: 'theme_session_secret' }).first()).value;
    const Keygrip = createRequire(ghostRequire.resolve('cookies'))('keygrip');
    const cookies = status => {
      const transient = members[status]; if (!transient) return [];
      const name = 'ghost-members-ssr';
      return [{ name, value: transient, url, httpOnly: true, sameSite: 'Lax' }, { name: `${name}.sig`, value: new Keygrip([secret]).sign(`${name}=${transient}`), url, httpOnly: true, sameSite: 'Lax' }];
    };
    return { root, url, themes, postIds, cookies, version: pkg.version,
      async activate(theme, signup = 'all') {
        if (child?.exitCode === null && activeTheme === theme.name && activeSignup === signup) return;
        await stop(); await setting('active_theme', theme.name); await setting('members_signup_access', signup); await start();
        activeTheme = theme.name; activeSignup = signup;
      },
      log: () => log,
      async close() { await stop(); await knex.destroy(); const realRoot = fs.realpathSync(root); if (realRoot === root && path.dirname(root) === os.tmpdir() && path.basename(root).startsWith('ghostcn-live-e2e-')) fs.rmSync(root, { recursive: true, force: true }); }
    };
  } catch (error) { await stop(); await knex.destroy(); console.error(`Failed fixture retained for diagnosis: ${root}`); throw error; }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fixture = await createGhostFixture(process.env.GHOST_E2E_ROOT);
  try { await fixture.activate(fixture.themes[0]); const result = await fetch(`${fixture.url}/editor-cards/`); console.log(`Live Ghost preflight: HTTP ${result.status}, ${(await result.text()).length} bytes`); }
  finally { await fixture.close(); }
}
