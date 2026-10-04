import { test, describe } from 'node:test';
import assert from 'node:assert';
import { sanitizeComponentName, getRegistryIndex, getComponent, fetchRegistryJson } from '../utils/registry';

test('registry timeout stays active while a stalled JSON body is being read', async () => {
  const original = globalThis.fetch;
  let signal: AbortSignal;
  globalThis.fetch = (async (_url, options) => {
    signal = options!.signal!;
    return { ok: true, json: () => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('body timed out')), { once: true });
    }) } as Response;
  }) as typeof fetch;
  try {
    await assert.rejects(fetchRegistryJson('https://registry.example/index.json', 25), /body timed out/);
    assert.ok(signal!.aborted);
  } finally { globalThis.fetch = original; }
});

test('registry JSON helper rejects HTTP errors and invalid bodies', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = (async () => new Response('not found', { status: 404 })) as typeof fetch;
    await assert.rejects(fetchRegistryJson('https://registry.example/index.json'), /HTTP 404/);
    globalThis.fetch = (async () => new Response('not json')) as typeof fetch;
    await assert.rejects(fetchRegistryJson('https://registry.example/index.json'), SyntaxError);
  } finally { globalThis.fetch = original; }
});

describe('Ghost UI Registry Utils', () => {
  describe('sanitizeComponentName', () => {
    test('accepts valid kebab-case names', () => {
      assert.strictEqual(sanitizeComponentName('newsletter-form'), 'newsletter-form');
      assert.strictEqual(sanitizeComponentName('pricing-table'), 'pricing-table');
      assert.strictEqual(sanitizeComponentName('post-card-2'), 'post-card-2');
    });

    test('trims whitespace and converts uppercase to lowercase', () => {
      assert.strictEqual(sanitizeComponentName('  Newsletter-Form  '), 'newsletter-form');
    });

    test('rejects path traversal and invalid characters', () => {
      assert.throws(() => sanitizeComponentName('../secret'), /Invalid component name/);
      assert.throws(() => sanitizeComponentName('component/nested'), /Invalid component name/);
      assert.throws(() => sanitizeComponentName('name with spaces'), /Invalid component name/);
      assert.throws(() => sanitizeComponentName('hello$world'), /Invalid component name/);
    });
  });

  describe('getRegistryIndex', () => {
    test('returns list of available components', async () => {
      const items = await getRegistryIndex();
      assert.ok(Array.isArray(items));
      assert.ok(items.length >= 10, `Expected at least 10 components, got ${items.length}`);

      const names = items.map(i => i.name);
      assert.ok(names.includes('newsletter-form'));
      assert.ok(names.includes('pricing-table'));
      assert.ok(names.includes('author-card'));
      assert.ok(names.includes('post-card'));
      assert.ok(names.includes('site-header'));
      assert.ok(names.includes('site-footer'));
      assert.ok(names.includes('featured-posts'));
      assert.ok(names.includes('pagination'));
      assert.ok(names.includes('post-header'));
      assert.ok(names.includes('member-cta'));
    });
  });

  describe('getComponent', () => {
    test('retrieves newsletter-form manifest correctly', async () => {
      const manifest = await getComponent('newsletter-form');
      assert.ok(manifest !== null);
      assert.strictEqual(manifest?.name, 'newsletter-form');
      assert.ok(Array.isArray(manifest?.files));
      assert.ok(manifest?.files.length >= 2);

      const hbs = manifest?.files.find(f => f.type === 'partial');
      assert.ok(hbs !== null);
      assert.ok(hbs?.content.includes('gh-newsletter-form'));

      const css = manifest?.files.find(f => f.type === 'style');
      assert.ok(css !== null);
    });

    test('retrieves pricing-table manifest correctly', async () => {
      const manifest = await getComponent('pricing-table');
      assert.ok(manifest !== null);
      assert.strictEqual(manifest?.name, 'pricing-table');
      assert.ok(manifest?.files.some(f => f.name === 'pricing-table.hbs'));
    });

    test('returns null for non-existent component', async () => {
      const manifest = await getComponent('non-existent-xyz-123');
      assert.strictEqual(manifest, null);
    });
  });
});
