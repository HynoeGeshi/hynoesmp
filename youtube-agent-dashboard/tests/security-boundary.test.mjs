import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, publicConfig } from '../server.mjs';

const key = 'sb_publishable_test_only_not_a_real_key';
const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: key };
const jwt = (role) => ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({role})).toString('base64url'), 'testsignature'].join('.');

async function withServer(callback, config = env) {
  const dir = await mkdtemp(join(tmpdir(), 'hynoe-security-'));
  await writeFile(join(dir, 'index.html'), '<!doctype html><h1>Test</h1>');
  await writeFile(join(dir, 'app.mjs'), 'export const test = true;');
  await writeFile(join(dir, 'styles.css'), 'body { margin: 0; }');
  const server = createServer({ env: config, publicDir: dir, vendorFile: join(dir, 'app.mjs'), coreFile: join(dir, 'app.mjs') });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try { await callback(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); await rm(dir, {recursive:true, force:true}); }
}

test('publishable and legacy anon config remain compatible', () => {
  for (const value of [key, jwt('anon')]) {
    assert.deepEqual(publicConfig({...env, SUPABASE_ANON_KEY:value}), {supabaseUrl:env.SUPABASE_URL, supabaseAnonKey:value});
  }
});

for (const [name, value] of [
  ['secret key', 'sb_secret_test_only_do_not_expose'],
  ['service-role JWT', jwt('service_role')],
  ['user JWT', jwt('authenticated')],
  ['malformed JWT', 'eyJ.bad.sig'],
  ['arbitrary credential', 'not-a-publishable-key'],
  ['multiline key', key+'\nprivate-data'],
]) {
  test(`public config rejects ${name} without echoing it`, () => {
    assert.throws(() => publicConfig({...env, SUPABASE_ANON_KEY:value}), (error) => {
      assert.equal(error.message, 'Invalid public Supabase configuration');
      assert.ok(!error.message.includes(value));
      return true;
    });
  });
}

test('config URLs cannot carry private credentials or query tokens', () => {
  for (const value of ['https://user:password@example.supabase.co', 'https://example.supabase.co?token=private', 'http://example.supabase.co']) {
    assert.throws(() => publicConfig({...env, SUPABASE_URL:value}), /Invalid public Supabase configuration/);
  }
});

test('all HTTP responses protect dashboard framing, referrers, and indexing', async () => {
  await withServer(async base => {
    for (const path of ['/', '/config.js', '/health', '/app.mjs', '/dashboard-core.mjs', '/not-found']) {
      const response = await fetch(base+path);
      assert.equal(response.headers.get('x-frame-options'), 'DENY');
      assert.match(response.headers.get('content-security-policy') || '', /frame-ancestors 'none'/);
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
      assert.equal(response.headers.get('cache-control'), 'no-store');
      await response.text();
    }
  });
});

test('misconfigured privileged key yields safe 503 instead of JavaScript disclosure', async () => {
  await withServer(async base => {
    const response = await fetch(base+'/config.js');
    assert.equal(response.status, 503);
    const body = await response.text();
    assert.doesNotMatch(body, /sb_secret_|private-test-value|service_role/);
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  }, {...env, SUPABASE_ANON_KEY:'sb_secret_private-test-value'});
});

test('unsupported HTTP methods cannot act as a write API', async () => {
  await withServer(async base => {
    const response = await fetch(base+'/config.js', {method:'POST'});
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'GET, HEAD');
    await response.text();
  });
});

test('health preserves liveness and exposes a deploy verification revision', async () => {
  await withServer(async base => {
    const response = await fetch(base+'/health');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {ok:true, securityRevision:'20261007-private-dashboard-v1'});
  });
});

test('HEAD works without a body and path traversal remains denied', async () => {
  await withServer(async base => {
    const head = await fetch(base+'/', {method:'HEAD'});
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    assert.equal((await fetch(base+'/..%2F..%2F.env')).status, 404);
  });
});
