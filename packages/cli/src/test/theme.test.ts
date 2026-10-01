import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generateThemeCss, BASE_PALETTES, ACCENT_COLORS } from '../utils/theme';

process.env.NODE_ENV = 'test';

describe('ghostcn Theming System', () => {
  describe('generateThemeCss', () => {
    test('generates valid CSS with default zinc and ghost accent', () => {
      const css = generateThemeCss({
        style: 'tailwind',
        baseColor: 'zinc',
        accentColor: 'ghost',
        radius: '0.5rem'
      });

      assert.ok(css.includes(':root'));
      assert.ok(css.includes('.dark, .dark-mode, [data-theme="dark"]'));
      assert.ok(css.includes('@media (prefers-color-scheme: dark)'));
      assert.ok(css.includes('.auto-color {'));
      assert.ok(css.includes('--background: #ffffff;'));
      assert.ok(css.includes('--foreground: #09090b;'));
      assert.ok(css.includes('--primary: var(--ghost-accent-color, #18181b);'));
      assert.ok(css.includes('--radius: 0.5rem;'));
      assert.ok(css.includes('--ghost-card-bg: var(--card);'));
      assert.ok(css.includes('.bg-card { background-color: var(--card); }'));
      assert.ok(css.includes('.rounded-ghostcn { border-radius: var(--radius); }'));
      assert.ok(css.includes('.ghcn-button'));
      assert.ok(css.includes('.ghcn-container'));
    });

    test('supports custom accent colors such as indigo and emerald', () => {
      const indigoCss = generateThemeCss({
        style: 'tailwind',
        baseColor: 'zinc',
        accentColor: 'indigo',
        radius: '0.25rem'
      });
      assert.ok(indigoCss.includes('--primary: #4f46e5;'));
      assert.ok(indigoCss.includes('--radius: 0.25rem;'));

      const emeraldCss = generateThemeCss({
        style: 'css',
        baseColor: 'neutral',
        accentColor: 'emerald',
        radius: '0.75rem'
      });
      assert.ok(emeraldCss.includes('--primary: #059669;'));
      assert.ok(emeraldCss.includes('--radius: 0.75rem;'));
    });

    test('supports all base palettes', () => {
      const palettes = ['zinc', 'slate', 'stone', 'gray', 'neutral'] as const;
      for (const palette of palettes) {
        const css = generateThemeCss({
          style: 'tailwind',
          baseColor: palette,
          accentColor: 'ghost',
          radius: '0.5rem'
        });
        const lightBg = BASE_PALETTES[palette].light.foreground;
        assert.ok(css.includes(`--foreground: ${lightBg};`));
      }
    });

    test('supports zero and pill border radius', () => {
      const noneCss = generateThemeCss({
        style: 'tailwind',
        baseColor: 'zinc',
        accentColor: 'ghost',
        radius: '0'
      });
      assert.ok(noneCss.includes('--radius: 0;'));

      const pillCss = generateThemeCss({
        style: 'tailwind',
        baseColor: 'zinc',
        accentColor: 'ghost',
        radius: '9999px'
      });
      assert.ok(pillCss.includes('--radius: 9999px;'));
    });
  });

  describe('Component Manifest Theme Compliance', () => {
    test('newsletter-form uses semantic tokens', async () => {
      const { getComponent } = await import('../utils/registry');
      const manifest = await getComponent('newsletter-form');
      assert.ok(manifest !== null);
      const hbs = manifest?.files.find(f => f.type === 'partial')?.content || '';
      assert.ok(hbs.includes('rounded-ghostcn'), 'newsletter-form should use rounded-ghostcn');
      assert.ok(hbs.includes('bg-card'), 'newsletter-form should use bg-card');
      assert.ok(hbs.includes('text-foreground') || hbs.includes('text-card-foreground'), 'newsletter-form should use semantic text tokens');
      assert.ok(hbs.includes('bg-primary'), 'newsletter-form button should use bg-primary');
      const css = manifest?.files.find(f => f.type === 'style')?.content || '';
      assert.ok(css.includes('font-size: 16px'), 'component should establish a host-independent type scale');
      assert.ok(css.includes('.gh-newsletter-form .sr-only'), 'newsletter label should be visually hidden');
      assert.ok(css.includes('display: none'), 'newsletter status messages should be hidden by default');
      assert.ok(!css.includes('rem;'), 'component spacing should not depend on the host root font size');
    });

    test('pricing-table uses semantic tokens and Ghost portal triggers', async () => {
      const { getComponent } = await import('../utils/registry');
      const manifest = await getComponent('pricing-table');
      assert.ok(manifest !== null);
      const hbs = manifest?.files.find(f => f.type === 'partial')?.content || '';
      assert.ok(hbs.includes('gh-pricing-card'));
      assert.ok(hbs.includes('{{price monthly_price currency=currency}}'));
      assert.ok(hbs.includes('visibility:public'));
      assert.ok(hbs.includes('data-portal="signup/{{id}}/monthly"'));
      assert.ok(hbs.includes('data-portal="signup/free"'));
    });

    test('author-card uses semantic tokens and Ghost author helpers', async () => {
      const { getComponent } = await import('../utils/registry');
      const manifest = await getComponent('author-card');
      assert.ok(manifest !== null);
      const hbs = manifest?.files.find(f => f.type === 'partial')?.content || '';
      assert.ok(hbs.includes('rounded-ghostcn'));
      assert.ok(hbs.includes('profile_image'));
      assert.ok(hbs.includes('hover:text-primary'));
    });

    test('post-card uses semantic tokens and Ghost post helpers', async () => {
      const { getComponent } = await import('../utils/registry');
      const manifest = await getComponent('post-card');
      assert.ok(manifest !== null);
      const hbs = manifest?.files.find(f => f.type === 'partial')?.content || '';
      assert.ok(hbs.includes('rounded-ghostcn'));
      assert.ok(hbs.includes('{{url}}'));
      assert.ok(hbs.includes('{{title}}'));
      assert.ok(hbs.includes('text-primary'));
    });

    test('starter foundation components use native Ghost integration points', async () => {
      const { getComponent } = await import('../utils/registry');
      const header = await getComponent('site-header');
      const featured = await getComponent('featured-posts');
      const pagination = await getComponent('pagination');
      const postHeader = await getComponent('post-header');
      const memberCta = await getComponent('member-cta');

      assert.ok(header?.files.some(file => file.content.includes('{{navigation}}') && file.content.includes('{{search}}')));
      assert.ok(featured?.files.some(file => file.content.includes('filter="featured:true"')));
      assert.ok(pagination?.files.some(file => file.placement === 'theme' && file.target === 'partials/pagination.hbs'));
      assert.ok(postHeader?.files.some(file => file.content.includes('{{reading_time}}')));
      assert.ok(memberCta?.files.some(file => file.content.includes('data-portal="signup"') && file.content.includes('{{#if access}}')));
    });
  });
});
