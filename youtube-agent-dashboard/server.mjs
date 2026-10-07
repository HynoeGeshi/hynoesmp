import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PUBLIC = join(HERE, 'public');
const DEFAULT_VENDOR = join(HERE, '..', 'assets', 'vendor', 'supabase.mjs');
const DEFAULT_CORE = join(HERE, 'lib', 'dashboard-core.mjs');

export function publicConfig(env = process.env) {
  return {
    supabaseUrl: env.SUPABASE_URL ?? '',
    supabaseAnonKey: env.SUPABASE_ANON_KEY ?? '',
  };
}

const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.mjs', ['app.mjs', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
]);

export function createServer({ env = process.env, publicDir = DEFAULT_PUBLIC, vendorFile = DEFAULT_VENDOR, coreFile = DEFAULT_CORE } = {}) {
  return http.createServer(async (req, res) => {
    const path = new URL(req.url ?? '/', 'http://localhost').pathname;

    if (path === '/health') {
      const body = JSON.stringify({ ok: true });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(body);
    }

    if (path === '/config.js') {
      const body = `window.__HYNOE_YOUTUBE_AGENT_CONFIG__=${JSON.stringify(publicConfig(env))};`;
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(body);
    }

    try {
      let file;
      let type;
      if (path === '/vendor/supabase.mjs') {
        file = vendorFile;
        type = 'text/javascript; charset=utf-8';
      } else if (path === '/dashboard-core.mjs') {
        file = coreFile;
        type = 'text/javascript; charset=utf-8';
      } else if (routes.has(path)) {
        const [name, mime] = routes.get(path);
        file = join(publicDir, name);
        type = mime;
      } else {
        res.writeHead(404, { 'Cache-Control': 'no-store' });
        return res.end('Not found');
      }

      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': path === '/' ? 'no-store' : 'public, max-age=300' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'Cache-Control': 'no-store' });
      res.end('Not found');
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 10000);
  const server = createServer();
  server.listen(port, '0.0.0.0', () => {
    console.log(`hynoe-youtube-agent listening on ${port}`);
  });
}
