import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCreatorOpsServer } from '../creatorops/server.mjs';

const assetRoot = fileURLToPath(new URL('../creatorops/', import.meta.url));

test('CreatorOps exposes only explicit public static files', async (t) => {
  const fixtureDir = await mkdtemp(join(assetRoot, '.static-test-'));
  const fixtureName = fixtureDir.slice(assetRoot.length);
  const privateFiles = ['.env', '.env.local', '.git/config', 'private.json', 'unlisted.js', 'unlisted.css', 'index.html'];
  const server = createCreatorOpsServer({ adminUser: 'test', adminPassword: 'local-test-password' });
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(fixtureDir, { recursive: true, force: true });
  });
  await mkdir(join(fixtureDir, '.git'));
  for (const filename of privateFiles) await writeFile(join(fixtureDir, filename), 'private static fixture');
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;

  const blockedPaths = [
    'server.mjs', 'webhook-server.mjs', 'audit-engine.mjs', 'preflight.mjs', 'webhook-preflight.mjs',
    'admin.html', 'report.html', '.env', '.env.local', '.git/config',
    '%73erver.mjs', '%61dmin.html', '%72eport.html',
    ...privateFiles.map((filename) => `${fixtureName}/${filename}`),
    `${fixtureName}/%2eenv`, `${fixtureName}%2f.env`,
    '%2e%2e%2fcreatorops%2fserver.mjs', '..%5ccreatorops%5cserver.mjs'
  ];
  for (const path of blockedPaths) {
    await t.test(`rejects /creatorops/${path}`, async () => {
      for (const method of ['GET', 'HEAD']) {
        const response = await fetch(`${base}/creatorops/${path}`, { method });
        assert.ok([400, 404].includes(response.status), `${method} ${path} returned ${response.status}`);
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.equal(await response.text(), method === 'HEAD' ? '' : response.status === 400 ? 'Bad request' : 'Not found');
      }
    });
  }

  const publicFiles = [
    'index.html', 'privacy.html', 'terms.html', 'growth.html',
    'creatorops.css', 'creatorops.js', 'admin.css', 'admin.js',
    'report.css', 'report.js', 'growth.css', 'growth.js'
  ];
  for (const filename of publicFiles) {
    await t.test(`serves public ${filename}`, async () => {
      const response = await fetch(`${base}/creatorops/${filename}?v=test`);
      assert.equal(response.status, 200);
      assert.equal(await response.text(), await readFile(join(assetRoot, filename), 'utf8'));
      const head = await fetch(`${base}/creatorops/${filename}`, { method: 'HEAD' });
      assert.equal(head.status, 200);
      assert.equal(await head.text(), '');
    });
  }

  await t.test('preserves home aliases and root stylesheet/script', async () => {
    for (const path of ['/', '/creatorops', '/creatorops/', '/index.html', '/creatorops.css', '/creatorops.js']) {
      const response = await fetch(`${base}${path}`);
      assert.equal(response.status, 200, path);
      await response.text();
    }
  });

  await t.test('preserves authenticated admin pages and private token report pages', async () => {
    for (const path of ['/admin', '/admin/']) {
      const unauthorized = await fetch(`${base}${path}`);
      assert.equal(unauthorized.status, 401);
      await unauthorized.text();
      const authorized = await fetch(`${base}${path}`, {
        headers: { authorization: `Basic ${Buffer.from('test:local-test-password').toString('base64')}` }
      });
      assert.equal(authorized.status, 200);
      assert.equal(authorized.headers.get('cache-control'), 'no-store');
      assert.equal(await authorized.text(), await readFile(join(assetRoot, 'admin.html'), 'utf8'));
    }
    const report = await fetch(`${base}/creatorops/report/${'a'.repeat(43)}`);
    assert.equal(report.status, 200);
    assert.equal(report.headers.get('cache-control'), 'no-store');
    assert.equal(report.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
    assert.equal(await report.text(), await readFile(join(assetRoot, 'report.html'), 'utf8'));
  });
});
