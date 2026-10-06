import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const moduleUrl = new URL('../creatorops/audit-engine.mjs', import.meta.url);
const modulePath = fileURLToPath(moduleUrl);

async function engine() {
  assert.ok(fs.existsSync(modulePath), 'creatorops/audit-engine.mjs must exist');
  const mod = await import(`${moduleUrl.href}?v=${Date.now()}-${Math.random()}`);
  assert.equal(typeof mod.generateStarterAudit, 'function', 'generateStarterAudit must be exported');
  return mod.generateStarterAudit;
}

const base = {
  creatorName: 'Test Creator',
  primaryPlatform: 'YouTube',
  profileUrl: 'https://youtube.com/@testcreator',
  goal: 'Build a stronger creator business over the next 90 days',
  bottleneck: 'I need a clearer direction',
  revenue: '$0',
  interest: 'Free audit only'
};

async function reportFor(overrides = {}) {
  const generateStarterAudit = await engine();
  return generateStarterAudit({ ...base, ...overrides });
}

test('starter audit selects packaging for click/title/view bottlenecks', async () => {
  const report = await reportFor({ bottleneck: 'My views stalled and my titles and thumbnails are not getting clicks' });
  assert.equal(report.primary_bottleneck.code, 'packaging');
});

test('starter audit selects operations for overwhelm and admin bottlenecks', async () => {
  const report = await reportFor({ bottleneck: 'I am overwhelmed by admin, workflow, and too many creator tasks' });
  assert.equal(report.primary_bottleneck.code, 'operations');
});

test('starter audit selects monetization for revenue and sponsor bottlenecks', async () => {
  const report = await reportFor({ bottleneck: 'I get attention but I am not making money, finding sponsors, or building revenue' });
  assert.equal(report.primary_bottleneck.code, 'monetization');
});

test('starter audit selects consistency for schedule and burnout bottlenecks', async () => {
  const report = await reportFor({ bottleneck: 'I cannot stay consistent with my schedule and I burn out between uploads' });
  assert.equal(report.primary_bottleneck.code, 'consistency');
});

test('starter audit falls back to positioning for unclear input', async () => {
  const report = await reportFor({ goal: 'Make progress', bottleneck: 'I am unsure what is wrong' });
  assert.equal(report.primary_bottleneck.code, 'positioning');
});

test('starter audit is deterministic and has the exact report shape', async () => {
  const generateStarterAudit = await engine();
  const input = { ...base, bottleneck: 'My views stalled and titles need work' };
  const first = generateStarterAudit(input);
  const second = generateStarterAudit(input);
  assert.deepEqual(first, second);
  assert.equal(first.version, 1);
  assert.equal(first.priority_actions.length, 3);
  assert.equal(first.seven_day_plan.length, 7);
  assert.ok(first.summary);
  assert.ok(first.monetization_opportunity?.title);
  assert.ok(Array.isArray(first.creatorops_can_handle));
  assert.ok(first.recommended_offer?.code);
  assert.ok(first.limitations.some((item) => /does not yet include private connected-platform analytics/i.test(item)));
});

test('starter audit does not fabricate analytics or guarantees', async () => {
  const report = await reportFor({ bottleneck: 'I need more views and revenue' });
  const copy = JSON.stringify(report).toLowerCase();
  assert.doesNotMatch(copy, /guaranteed|guarantee you|we analyzed your private|your ctr is|your retention is|competitor data shows/);
});
