import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PUBLIC = join(HERE, 'public');
const DEFAULT_VENDOR = join(HERE, '..', 'assets', 'vendor', 'supabase.mjs');
const DEFAULT_CORE = join(HERE, 'lib', 'dashboard-core.mjs');

export const SECURITY_REVISION = '20261007-exact-owner-changes-v3';

function isPublicKey(key) {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  // Classification only, not JWT signature validation or user authorization.
  // Supabase still validates the key and enforces authentication and RLS.
  if (key.length > 8192 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) return false;
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
    return payload?.role === 'anon' && payload.sub === undefined;
  } catch {
    return false;
  }
}

export function publicConfig(env = process.env) {
  const supabaseUrl = String(env.SUPABASE_URL ?? '').trim();
  const supabaseAnonKey = String(env.SUPABASE_ANON_KEY ?? '').trim();
  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !isPublicKey(supabaseAnonKey)) throw new Error();
  } catch {
    // Never include the rejected value in responses or logs.
    throw new Error('Invalid public Supabase configuration');
  }
  return { supabaseUrl, supabaseAnonKey };
}

function applySecurityHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
}

const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/upload-package.mjs', ['../lib/upload-package.mjs', 'text/javascript; charset=utf-8']],
  ['/app.mjs', ['app.mjs', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/metadata', ['metadata.html', 'text/html; charset=utf-8']],
  ['/metadata.html', ['metadata.html', 'text/html; charset=utf-8']],
  ['/metadata.mjs', ['metadata.mjs', 'text/javascript; charset=utf-8']],
  ['/changes', ['changes.html', 'text/html; charset=utf-8']],
  ['/changes.html', ['changes.html', 'text/html; charset=utf-8']],
  ['/changes.mjs', ['changes.mjs', 'text/javascript; charset=utf-8']],
  ['/change-drafts.mjs', ['change-drafts.mjs', 'text/javascript; charset=utf-8']],
  ['/owner-change.mjs', ['../lib/owner-change.mjs', 'text/javascript; charset=utf-8']],
]);

export function createServer({ env = process.env, publicDir = DEFAULT_PUBLIC, vendorFile = DEFAULT_VENDOR, coreFile = DEFAULT_CORE } = {}) {
  return http.createServer(async (req, res) => {
    applySecurityHeaders(res);
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Allow': 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Method not allowed');
    }
    let path;
    try {
      path = new URL(req.url ?? '/', 'http://localhost').pathname;
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Bad request');
    }

    if (path === '/health') {
      const body = JSON.stringify({ ok: true, securityRevision: SECURITY_REVISION });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(body);
    }

    if (path === '/config.js') {
      let config;
      try {
        config = publicConfig(env);
      } catch {
        res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Public configuration unavailable');
      }
      const body = `window.__HYNOE_YOUTUBE_AGENT_CONFIG__=${JSON.stringify(config)};`;
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
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
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
