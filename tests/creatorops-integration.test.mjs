import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createCreatorOpsServer } from '../creatorops/server.mjs';

async function start(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}

const sampleReport = {
  version: 1,
  creator: { display_name: 'Test Creator', primary_platform: 'YouTube', profile_url: 'https://youtube.com/@testcreator' },
  summary: 'A useful starter audit summary.',
  primary_bottleneck: { code: 'packaging', label: 'Packaging & discovery', why_it_matters: 'The promise needs to be clearer.' },
  priority_actions: [
    { rank: 1, title: 'One', reason: 'Reason', next_step: 'Next' },
    { rank: 2, title: 'Two', reason: 'Reason', next_step: 'Next' },
    { rank: 3, title: 'Three', reason: 'Reason', next_step: 'Next' }
  ],
  seven_day_plan: Array.from({ length: 7 }, (_, i) => ({ day: i + 1, action: `Day ${i + 1}` })),
  monetization_opportunity: { title: 'Opportunity', explanation: 'Explanation' },
  creatorops_can_handle: ['One', 'Two', 'Three'],
  recommended_offer: { code: 'free_audit', title: 'Use the Starter Audit first', reason: 'Reason' },
  limitations: ['This starter audit is based on the information submitted and does not yet include private connected-platform analytics.']
};

function validApplication(overrides = {}) {
  return {
    creatorName: 'Test Creator',
    email: 'test@example.com',
    primaryPlatform: 'YouTube',
    profileUrl: 'https://youtube.com/@testcreator',
    goal: 'Grow a sustainable creator business',
    bottleneck: 'My views stalled and my titles need work',
    revenue: '$0',
    interest: 'Free audit only',
    ...overrides
  };
}

test('HTTP intake creates an opaque private report and keeps raw tokens out of the gateway payload', async () => {
  const calls = [];
  let intakeCount = 0;
  const gatewayFn = async (method, payload, operation) => {
    calls.push({ method, payload, operation });
    if (operation === 'intake-with-report') return { status: 201, body: { ok: true, duplicate: intakeCount++ > 0, createdAt: new Date().toISOString() } };
    if (operation === 'public-metrics') return { status: 200, body: { ok: true, key: 'hynoe_youtube_case_study', source: 'youtube_via_windsor_verified_snapshot', asOf: '2026-10-06T21:06:30Z', verifiedAt: '2026-10-06T21:10:00Z', freshness: 'verified_snapshot', metrics: { subscribers: 544, views_30d: 2349, watch_hours_30d: 212.7, likes_30d: 122, comments_30d: 36, shares_30d: 23, subscribers_gained_30d: 8, subscribers_lost_30d: 3, net_subscribers_30d: 5 } } };
    if (operation === 'report-read') return { status: 200, body: { ok: true, report: sampleReport, expiresAt: '2026-11-05T21:10:00Z' } };
    return { status: 404, body: { error: 'not_found' } };
  };

  const app = createCreatorOpsServer({ gatewayFn, rateLimitMax: 20, rateLimitWindowMs: 60000 });
  const base = await start(app);
  try {
    const first = await fetch(`${base}/api/intake`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validApplication()) });
    assert.equal(first.status, 201);
    const firstJson = await first.json();
    assert.equal(firstJson.ok, true);
    assert.equal(firstJson.duplicate, false);
    assert.match(firstJson.report.url, /^\/creatorops\/report\/[A-Za-z0-9_-]{43,}$/);
    assert.ok(firstJson.report.expiresAt);
    assert.equal('id' in firstJson, false);
    assert.equal('email' in firstJson, false);
    assert.equal('tokenHash' in firstJson, false);

    const firstToken = firstJson.report.url.split('/').pop();
    const firstCall = calls.find((call) => call.operation === 'intake-with-report');
    assert.equal(firstCall.method, 'POST');
    assert.match(firstCall.payload.tokenHash, /^[0-9a-f]{64}$/);
    assert.equal(JSON.stringify(firstCall.payload).includes(firstToken), false);
    assert.equal(firstCall.payload.application.email, 'test@example.com');
    assert.equal(firstCall.payload.report.priority_actions.length, 3);
    assert.equal(firstCall.payload.report.seven_day_plan.length, 7);

    const second = await fetch(`${base}/api/intake`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validApplication()) });
    assert.equal(second.status, 200);
    const secondJson = await second.json();
    assert.equal(secondJson.duplicate, true);
    assert.notEqual(secondJson.report.url, firstJson.report.url, 'duplicate intake must rotate the raw report token');

    const beforeSpam = calls.length;
    const spam = await fetch(`${base}/api/intake`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validApplication({ company: 'bot company' })) });
    assert.equal(spam.status, 202);
    assert.equal(calls.length, beforeSpam, 'honeypot must not call the gateway');

    const metrics = await fetch(`${base}/api/public/metrics/hynoe-youtube`);
    assert.equal(metrics.status, 200);
    const metricsJson = await metrics.json();
    assert.equal(metricsJson.key, 'hynoe_youtube_case_study');
    assert.equal(calls.at(-1).operation, 'public-metrics');
    assert.deepEqual(calls.at(-1).payload, { key: 'hynoe_youtube_case_study' });

    const secondToken = secondJson.report.url.split('/').pop();
    const report = await fetch(`${base}/api/report/${secondToken}`);
    assert.equal(report.status, 200);
    assert.equal(report.headers.get('cache-control'), 'no-store');
    const reportJson = await report.json();
    assert.equal(reportJson.report.primary_bottleneck.code, 'packaging');
    const reportCall = calls.at(-1);
    assert.equal(reportCall.operation, 'report-read');
    assert.match(reportCall.payload.tokenHash, /^[0-9a-f]{64}$/);
    assert.equal(JSON.stringify(reportCall.payload).includes(secondToken), false);

    const reportPage = await fetch(`${base}${secondJson.report.url}`);
    assert.equal(reportPage.status, 200);
    assert.equal(reportPage.headers.get('cache-control'), 'no-store');
    assert.match(reportPage.headers.get('x-robots-tag') || '', /noindex/i);
    assert.match(await reportPage.text(), /Starter Creator Audit/i);
  } finally {
    app.close();
    await once(app, 'close');
  }
});

test('report probing and intake validation fail safely', async () => {
  const gatewayFn = async (method, payload, operation) => operation === 'report-read'
    ? { status: 404, body: { error: 'report_not_found' } }
    : { status: 500, body: { error: 'unexpected' } };
  const app = createCreatorOpsServer({ gatewayFn, rateLimitMax: 2, rateLimitWindowMs: 60000 });
  const base = await start(app);
  try {
    const wrongType = await fetch(`${base}/api/intake`, { method: 'POST', body: '{}' });
    assert.equal(wrongType.status, 415);

    const invalid = await fetch(`${base}/api/intake`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ creatorName: 'x' }) });
    assert.equal(invalid.status, 422);

    const malformed = await fetch(`${base}/api/report/not-valid!`);
    const unknown = await fetch(`${base}/api/report/${'a'.repeat(43)}`);
    assert.equal(malformed.status, 404);
    assert.equal(unknown.status, 404);
    assert.deepEqual(await malformed.json(), await unknown.json());
    assert.deepEqual(await unknown.clone?.() ?? {}, {});
  } finally {
    app.close();
    await once(app, 'close');
  }
});
