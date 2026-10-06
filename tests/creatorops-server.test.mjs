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

    const rootCss = await fetch(`${base}/creatorops.css`);
    assert.equal(rootCss.status, 200);
    assert.match(rootCss.headers.get('content-type') || '', /text\/css/);

    const rootJs = await fetch(`${base}/creatorops.js`);
    assert.equal(rootJs.status, 200);
    assert.match(rootJs.headers.get('content-type') || '', /javascript/);

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

// Premium operator dashboard remains protected and exposes audit status metadata without report secrets.
{
  const server = createCreatorOpsServer({ adminUser: 'hynoe', adminPassword: 'visual-test-password' });
  const base = await start(server);
  try {
    const auth = `Basic ${Buffer.from('hynoe:visual-test-password').toString('base64')}`;
    const admin = await fetch(`${base}/admin`, { headers: { authorization: auth } });
    assert.equal(admin.status, 200);
    const html = await admin.text();
    assert.match(html, /operator-shell/i);
    assert.match(html, /Operations overview/i);
    assert.match(html, /Applications/i);
    assert.match(html, /Payment activity/i);

    const css = await fetch(`${base}/creatorops/admin.css`);
    const cssText = await css.text();
    assert.match(cssText, /admin-overview/i);
    assert.match(cssText, /admin-panel/i);
    assert.match(cssText, /admin-kpi/i);

    const adminJs = await fetch(`${base}/creatorops/admin.js`);
    const adminJsText = await adminJs.text();
    assert.match(adminJsText, /audit_status/);
    assert.match(adminJsText, /audit_expires_at/);
    assert.match(adminJsText, /Starter audit/i);
    assert.doesNotMatch(adminJsText, /token_hash|report_token|raw token/i);
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
    res.end(JSON.stringify({ ok: true, duplicate: false, createdAt: new Date().toISOString() }));
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
    const validJson = await valid.json();
    assert.equal(validJson.ok, true);
    assert.match(validJson.report.url, /^\/creatorops\/report\/[A-Za-z0-9_-]{43,}$/);
    assert.equal(seen.method, 'POST');
    assert.equal(seen.operation, 'intake-with-report');
    assert.ok(seen.signature && seen.signature.length > 40);
    assert.ok(Number(seen.ts) > 0);
    assert.ok(!seen.body.includes('password'));
    const signedPayload = JSON.parse(seen.body);
    assert.match(signedPayload.tokenHash, /^[0-9a-f]{64}$/);
    assert.equal(signedPayload.application.email, 'test@example.com');
    assert.equal(signedPayload.report.priority_actions.length, 3);
    assert.equal(signedPayload.report.seven_day_plan.length, 7);
    assert.equal(seen.body.includes(validJson.report.url.split('/').pop()), false, 'raw report token must not be sent upstream');

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
