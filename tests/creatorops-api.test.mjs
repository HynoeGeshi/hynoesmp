import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer as createHttpServer } from 'node:http';
import { createCreatorOpsServer } from '../creatorops/server.mjs';

async function start(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}

test('CreatorOps API validates intake and protects admin routes', async () => {
  const upstream = createHttpServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    if (req.method === 'POST') {
      assert.equal(req.headers['x-creatorops-edge-key'], 'intake-secret');
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, id: '11111111-1111-4111-8111-111111111111' }));
      return;
    }
    if (req.method === 'GET') {
      assert.equal(req.headers['x-creatorops-edge-key'], 'admin-edge-secret');
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ applications: [{ id: '1', creator_name: 'Creator', status: 'new' }] }));
      return;
    }
    res.writeHead(405).end();
  });
  const upstreamPort = await start(upstream);

  const app = createCreatorOpsServer({
    gatewayUrl: `http://127.0.0.1:${upstreamPort}`,
    intakeSecret: 'intake-secret',
    adminEdgeSecret: 'admin-edge-secret',
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
    assert.equal((await good.json()).ok, true);

    const noAuth = await fetch(`${base}/api/admin/applications`);
    assert.equal(noAuth.status, 401);
    assert.match(noAuth.headers.get('www-authenticate') || '', /Basic/i);

    const auth = Buffer.from('hynoe:admin-password').toString('base64');
    const admin = await fetch(`${base}/api/admin/applications`, {
      headers: { authorization: `Basic ${auth}` }
    });
    assert.equal(admin.status, 200);
    assert.equal((await admin.json()).applications.length, 1);

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
