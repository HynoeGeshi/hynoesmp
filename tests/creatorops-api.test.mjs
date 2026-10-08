import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer as createHttpServer } from 'node:http';
import { createHash, generateKeyPairSync, verify } from 'node:crypto';
import { createCreatorOpsServer } from '../creatorops/server.mjs';

async function start(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}

test('CreatorOps API validates intake and protects admin routes', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const calls = [];
  const upstream = createHttpServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    calls.push({ method: req.method, headers: req.headers, body });
    if (req.method === 'POST' && req.headers['x-creatorops-operation'] === 'intake-with-report') {
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, id: '11111111-1111-4111-8111-111111111111' }));
      return;
    }
    if (req.method === 'GET' && req.headers['x-creatorops-operation'] === 'admin-list') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ applications: [{ id: '1', creator_name: 'Creator', status: 'new' }] }));
      return;
    }
    res.writeHead(405).end();
  });
  const upstreamPort = await start(upstream);

  const app = createCreatorOpsServer({
    gatewayUrl: `http://127.0.0.1:${upstreamPort}`,
    signingKeyB64: privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64'),
    adminUser: 'hynoe',
    adminPassword: 'admin-password',
    rateLimitMax: 3,
    rateLimitWindowMs: 60_000,
  });
  const appPort = await start(app);
  const base = `http://127.0.0.1:${appPort}`;

  try {
    const bad = await fetch(`${base}/api/intake`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ creatorName: 'x' })
    });
    assert.equal(bad.status, 422);
    assert.equal(calls.length, 0, 'invalid intake must not reach the gateway');

    const goodPayload = {
      creatorName: 'Creator',
      email: 'creator@example.com',
      primaryPlatform: 'YouTube',
      profileUrl: 'https://example.com/channel',
      goal: 'Grow consistently',
      bottleneck: 'Packaging',
      revenue: '$0',
      interest: 'Free audit only',
      company: ''
    };
    const good = await fetch(`${base}/api/intake`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'creator-test' },
      body: JSON.stringify(goodPayload)
    });
    assert.equal(good.status, 201);
    const result = await good.json();
    assert.equal(result.ok, true);
    assert.match(result.report.url, /^\/creatorops\/report\/[A-Za-z0-9_-]{43}$/);
    const token = result.report.url.split('/').pop();
    const intake = JSON.parse(calls[0].body);
    assert.equal(intake.application.email, goodPayload.email);
    assert.equal(intake.report.version, 1);
    assert.equal(intake.report.priority_actions.length, 3);
    assert.equal(intake.report.seven_day_plan.length, 7);
    assert.equal(intake.tokenHash, createHash('sha256').update(token).digest('hex'));
    assert.equal(calls[0].body.includes(token), false, 'raw report token must not leave the web service');

    const noAuth = await fetch(`${base}/api/admin/applications`);
    assert.equal(noAuth.status, 401);
    assert.match(noAuth.headers.get('www-authenticate') || '', /Basic/i);
    assert.equal(calls.length, 1, 'unauthenticated admin request must not reach the gateway');

    const auth = Buffer.from('hynoe:admin-password').toString('base64');
    const admin = await fetch(`${base}/api/admin/applications`, {
      headers: { authorization: `Basic ${auth}` }
    });
    assert.equal(admin.status, 200);
    assert.equal((await admin.json()).applications.length, 1);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].headers['x-creatorops-operation'], 'intake-with-report');
    assert.equal(calls[1].headers['x-creatorops-operation'], 'admin-list');
    assert.equal(calls[1].body, '');
    for (const call of calls) {
      const ts = call.headers['x-creatorops-ts'];
      assert.ok(Math.abs(Date.now() - Number(ts)) < 60_000);
      const message = `${ts}\n${call.method}\n${call.headers['x-creatorops-operation']}\n${call.body}`;
      assert.equal(verify(null, Buffer.from(message), publicKey, Buffer.from(call.headers['x-creatorops-signature'], 'base64')), true);
      assert.equal(call.headers['x-creatorops-edge-key'], undefined);
      assert.equal(call.headers.authorization, undefined, 'admin credentials must not be forwarded');
    }

    const adminPage = await fetch(`${base}/admin`, {
      headers: { authorization: `Basic ${auth}` }
    });
    assert.equal(adminPage.status, 200);
    assert.match(await adminPage.text(), /CreatorOps Admin/i);
  } finally {
    app.close();
    upstream.close();
    await Promise.all([once(app, 'close'), once(upstream, 'close')]);
  }
});
