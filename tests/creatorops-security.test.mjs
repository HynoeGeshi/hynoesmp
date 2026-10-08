import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { generateKeyPairSync, verify } from 'node:crypto';
import { createCreatorOpsServer } from '../creatorops/server.mjs';

const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const privateDer = privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64');

async function start(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}

test('CreatorOps protects admin and signs backend intake requests', async () => {
  let seen = null;
  const gateway = createServer(async (req, res) => {
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
  const gatewayUrl = await start(gateway);
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

    const admin = await fetch(`${base}/admin`);
    assert.equal(admin.status, 401);
    assert.match(admin.headers.get('www-authenticate') || '', /Basic/);

    const invalid = await fetch(`${base}/api/intake`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ creatorName: 'x' })
    });
    assert.equal(invalid.status, 422);

    const valid = await fetch(`${base}/api/intake`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        creatorName: 'Test Creator', email: 'test@example.com', primaryPlatform: 'YouTube',
        profileUrl: 'https://example.com/channel', goal: 'Grow safely', bottleneck: 'Workflow',
        revenue: '$0', interest: 'Free audit only'
      })
    });
    assert.equal(valid.status, 201);
    assert.equal(seen.method, 'POST');
    assert.equal(seen.operation, 'intake-with-report');
    assert.ok(seen.signature && seen.signature.length > 40);
    assert.ok(Math.abs(Date.now() - Number(seen.ts)) < 60_000);
    const signedMessage = `${seen.ts}\n${seen.method}\n${seen.operation}\n${seen.body}`;
    const signature = Buffer.from(seen.signature, 'base64');
    assert.equal(verify(null, Buffer.from(signedMessage), publicKey, signature), true);
    assert.equal(verify(null, Buffer.from(`${signedMessage}tampered`), publicKey, signature), false, 'signature must bind the exact request body');
    const payload = JSON.parse(seen.body);
    assert.equal(payload.application.creatorName, 'Test Creator');
    assert.equal(payload.report.version, 1);
    assert.match(payload.tokenHash, /^[0-9a-f]{64}$/);
    assert.ok(!seen.body.includes('password'));

    const limited = await fetch(`${base}/api/intake`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ creatorName: 'x' })
    });
    assert.equal(limited.status, 429);
  } finally {
    app.close(); gateway.close();
  }
});
