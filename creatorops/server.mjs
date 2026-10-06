import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('./', import.meta.url));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
};

function send(res, status, body, contentType = 'text/plain; charset=utf-8', extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store',
    ...SECURITY_HEADERS,
    ...extraHeaders
  });
  res.end(body);
}

async function sendFile(res, filename) {
  try {
    const body = await readFile(join(ROOT, filename));
    send(res, 200, body, MIME[extname(filename)] || 'application/octet-stream');
  } catch {
    send(res, 404, 'Not found');
  }
}

function safeAssetPath(urlPath) {
  const relative = urlPath.replace(/^\/creatorops\//, '');
  const normalized = normalize(relative).replace(/^([.][.]\/)+/, '');
  if (!normalized || normalized.startsWith('..') || normalized.includes('\0')) return null;
  return normalized;
}

export function createCreatorOpsServer() {
  return createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    const path = decodeURIComponent(url.pathname);

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      send(res, 405, 'Method not allowed', 'text/plain; charset=utf-8', { Allow: 'GET, HEAD' });
      return;
    }

    if (path === '/healthz') {
      send(res, 200, JSON.stringify({ ok: true, service: 'hynoe-creatorops' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      return;
    }

    if (path === '/' || path === '/creatorops' || path === '/creatorops/' || path === '/index.html') {
      await sendFile(res, 'index.html');
      return;
    }

    if (path.startsWith('/creatorops/')) {
      const asset = safeAssetPath(path);
      if (!asset) {
        send(res, 400, 'Bad request');
        return;
      }
      await sendFile(res, asset);
      return;
    }

    send(res, 404, 'Not found');
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  const server = createCreatorOpsServer();
  server.listen(port, host, () => {
    console.log(`Hynoe CreatorOps listening on http://${host}:${port}`);
  });
}
