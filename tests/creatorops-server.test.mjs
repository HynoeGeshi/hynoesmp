import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createCreatorOpsServer } from '../creatorops/server.mjs';

const server = createCreatorOpsServer();
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const { port } = server.address();

try {
  const base = `http://127.0.0.1:${port}`;

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

  const missing = await fetch(`${base}/does-not-exist`);
  assert.equal(missing.status, 404);

  console.log('creatorops Render server contract passed');
} finally {
  server.close();
  await once(server, 'close');
}
