import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import Handlebars from 'handlebars';
import { getComponent } from '../utils/registry';

const tiers = [
  { id: 'free-tier', type: 'free', name: 'Reader', benefits: ['Weekly dispatch'], visibility: 'public', active: true },
  { id: 'premium-tier', type: 'paid', name: 'Supporter', description: '<Real benefits>', currency: 'EUR', monthly_price: 1234, yearly_price: 9900, benefits: ['Member essays'], visibility: 'public', active: true }
];

async function render(name: string, site: Record<string, unknown>, member?: Record<string, unknown>, context = {}) {
  const hbs = Handlebars.create();
  hbs.registerHelper('foreach', function (items, options) { return items.map((item: unknown) => options.fn(item)).join(''); });
  hbs.registerHelper('match', function (this: unknown, value, expected, options) { return value === expected ? options.fn(this) : options.inverse(this); });
  hbs.registerHelper('get', function (resource, options) {
    assert.equal(resource, 'tiers');
    assert.equal(options.hash.filter, 'visibility:public+active:true');
    return options.fn({ tiers }, { data: options.data });
  });
  hbs.registerHelper('price', (amount, options) => new Intl.NumberFormat('en', { style: 'currency', currency: options.hash.currency }).format(amount / 100));
  hbs.registerHelper('navigation', () => new hbs.SafeString('<ul class="nav"><li><a href="/">Home</a></li></ul>'));
  hbs.registerHelper('search', () => new hbs.SafeString('<button aria-label="Search">Search</button>'));
  const manifest = await getComponent(name);
  const source = manifest!.files.find(file => file.type === 'partial')!.content;
  return hbs.compile(source)(context, { data: { site: { title: 'Test publication', url: '/', allow_self_signup: site.members_enabled && !site.members_invite_only, ...site }, member } });
}

describe('rendered membership states', () => {
  test('disabled membership removes signup, account, newsletter and pricing UI while keeping navigation', async () => {
    const site = { members_enabled: false };
    const header = await render('site-header', site);
    assert.ok(header.includes('Home'));
    assert.ok(!header.includes('data-portal='));
    for (const component of ['pricing-table', 'newsletter-form', 'member-cta']) {
      assert.ok(!(await render(component, site)).includes('<section'));
      assert.ok(!(await render(component, site)).includes('<aside'));
    }
  });
  test('invite-only sites retain sign-in but have no public signup or upgrade offers', async () => {
    const site = { members_enabled: true, members_invite_only: true, paid_members_enabled: true };
    for (const component of ['site-header', 'member-cta']) {
      const output = await render(component, site, undefined, { access: false });
      assert.ok(output.includes('data-portal="signin"'));
      assert.ok(!output.includes('data-portal="signup'));
    }
    assert.ok(!(await render('pricing-table', site)).includes('gh-pricing-card'));
    assert.ok(!(await render('newsletter-form', site)).includes('data-members-form'));
    assert.ok(!(await render('member-cta', site, { paid: false }, { access: false })).includes('account/plans'));
  });
  test('pricing uses configured tier names, currency, fractional prices, benefits and tier-specific checkout', async () => {
    const output = await render('pricing-table', { members_enabled: true, paid_members_enabled: true });
    for (const value of ['Supporter', '€12.34', '€99.00', 'Member essays', 'signup/premium-tier/monthly', 'signup/premium-tier/yearly', '&lt;Real benefits&gt;']) assert.ok(output.includes(value), value);
    assert.ok(!output.includes('$5'));
    assert.ok(!output.includes('VIP priority support'));
  });
  test('free-only sites offer only the free tier; signed-in readers manage their account', async () => {
    const site = { members_enabled: true, paid_members_enabled: false };
    const output = await render('pricing-table', site);
    assert.ok(output.includes('Reader'));
    assert.ok(!output.includes('Supporter'));
    const memberOutput = await render('pricing-table', site, { paid: false });
    assert.ok(memberOutput.includes('data-portal="account"'));
    assert.ok(!memberOutput.includes('data-portal="signup'));
  });
  test('restricted self-signup hides new membership and newsletter offers', async () => {
    const site = { members_enabled: true, members_invite_only: false, allow_self_signup: false, paid_members_enabled: true };
    for (const component of ['site-header', 'member-cta', 'newsletter-form', 'pricing-table']) {
      const output = await render(component, site, undefined, { access: false });
      assert.ok(!output.includes('data-portal="signup'), component);
      assert.ok(!output.includes('data-members-form'), component);
    }
  });
  test('paid and free members get account/upgrade actions, not a new checkout', async () => {
    const site = { members_enabled: true, paid_members_enabled: true };
    for (const paid of [false, true]) {
      const output = await render('pricing-table', site, { paid });
      assert.ok(output.includes('account/plans'));
      assert.ok(!output.includes('data-portal="signup'));
    }
    assert.ok(!(await render('member-cta', site, { paid: true }, { access: false })).includes('Upgrade membership'));
  });
  test('newsletter is accessible, repeat-safe and has no Tailwind hidden class fighting Ghost states', async () => {
    const site = { members_enabled: true };
    const output = await render('newsletter-form', site);
    assert.ok(output.includes('aria-label="Email address"'));
    assert.ok(output.includes('role="status"'));
    assert.ok(output.includes('role="alert"'));
    assert.ok(!output.includes('id="gh-email"'));
    assert.ok(!/class="[^"]*\bhidden\b/.test(output));
    assert.ok(!(await render('newsletter-form', site, { paid: false })).includes('data-members-form'));
  });
  test('required signup terms use Portal rather than a native form that omits consent', async () => {
    const output = await render('newsletter-form', { members_enabled: true, portal_signup_checkbox_required: true });
    assert.ok(!output.includes('data-members-form'));
    assert.ok(output.includes('data-portal="signup"'));
  });
});
