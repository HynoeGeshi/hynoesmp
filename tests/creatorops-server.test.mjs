import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { generateKeyPairSync } from 'node:crypto';
import { createCreatorOpsServer } from '../creatorops/server.mjs';

async function start(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}

// Static/render contract.
{
  const server = createCreatorOpsServer();
  const base = await start(server);
  try {
    const home = await fetch(`${base}/`);
    assert.equal(home.status, 200);
    assert.match(await home.text(), /Hynoe CreatorOps/);

    const creatorops = await fetch(`${base}/creatorops`);
    assert.equal(creatorops.status, 200);
    assert.match(await creatorops.text(), /Free Creator Audit/);

    const css = await fetch(`${base}/creatorops/creatorops.css`);
    assert.equal(css.status, 200);
    assert.match(css.headers.get('content-type') || '', /text\/css/);

    const js = await fetch(`${base}/creatorops/creatorops.js`);
    assert.equal(js.status, 200);
    assert.match(js.headers.get('content-type') || '', /javascript/);

    const admin = await fetch(`${base}/admin`);
    assert.equal(admin.status, 401);
    assert.match(admin.headers.get('www-authenticate') || '', /Basic/);

    const missing = await fetch(`${base}/does-not-exist`);
    assert.equal(missing.status, 404);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

// Signed gateway + validation + rate-limit contract.
{
  const { privateKey } = generateKeyPairSync('ed25519');
  const privateDer = privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64');
  let seen = null;
  const gatewayServer = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    seen = {
      method: req.method,
      operation: req.headers['x-creatorops-operation'],
      signature: req.headers['x-creatorops-signature'],
      ts: req.headers['x-creatorops-ts'],
      body
    };
    res.writeHead(201, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, id: '00000000-0000-0000-0000-000000000001' }));
  });
  const gatewayUrl = await start(gatewayServer);
  const app = createCreatorOpsServer({
    gatewayUrl,
    signingKeyB64: privateDer,
    adminUser: 'hynoe',
    adminPassword: 'test-admin-password',
    rateLimitMax: 2,
    rateLimitWindowMs: 60000
  });
  const base = await start(app);

  try {
    const health = await fetch(`${base}/healthz`);
    const healthJson = await health.json();
    assert.equal(healthJson.gatewayConfigured, true);
    assert.equal(healthJson.adminConfigured, true);

    const invalid = await fetch(`${base}/api/intake`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ creatorName: 'x' })
    });
    assert.equal(invalid.status, 422);

    const valid = await fetch(`${base}/api/intake`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        creatorName: 'Test Creator',
        email: 'test@example.com',
        primaryPlatform: 'YouTube',
        profileUrl: 'https://example.com/channel',
        goal: 'Grow safely',
        bottleneck: 'Workflow',
        revenue: '$0',
        interest: 'Free audit only'
      })
    });
    assert.equal(valid.status, 201);
    assert.equal(seen.method, 'POST');
    assert.equal(seen.operation, 'intake');
    assert.ok(seen.signature && seen.signature.length > 40);
    assert.ok(Number(seen.ts) > 0);
    assert.ok(!seen.body.includes('password'));

    const limited = await fetch(`${base}/api/intake`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ creatorName: 'x' })
    });
    assert.equal(limited.status, 429);
  } finally {
    app.close();
    gatewayServer.close();
    await Promise.all([once(app, 'close'), once(gatewayServer, 'close')]);
  }
}

console.log('creatorops Render + security contract passed');
