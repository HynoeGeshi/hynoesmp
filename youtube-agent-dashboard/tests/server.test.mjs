import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer, publicConfig } from '../server.mjs';

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_test_only_not_a_real_key',
  UNRELATED_VALUE: 'not-browser-config',
};

async function withServer(fn) {
  const server = createServer({ env });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await fn(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

test('public config exposes only Supabase public values', () => {
  assert.deepEqual(publicConfig(env), {
    supabaseUrl: env.SUPABASE_URL,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
  });
});

test('health endpoint returns 200', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, securityRevision: '20261007-exact-owner-changes-v3' });
  });
});

test('runtime config is no-store and excludes unrelated values', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/config.js`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const body = await response.text();
    assert.match(body, /supabaseUrl/);
    assert.match(body, /supabaseAnonKey/);
    assert.doesNotMatch(body, /not-browser-config/);
  });
});

test('dashboard code is no-store so queue fixes appear immediately', async () => {
  await withServer(async (base) => {
    for (const path of ['/', '/app.mjs', '/dashboard-core.mjs']) {
      const response = await fetch(`${base}${path}`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
  });
});

test('static server rejects path traversal', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/..%2F..%2Fpackage.json`);
    assert.equal(response.status, 404);
  });
});
