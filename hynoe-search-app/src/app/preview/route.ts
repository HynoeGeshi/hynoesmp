import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Additive, public preview only. No proxying, account data, or private configuration.
export async function GET() {
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  };
  try {
    const html = await readFile(join(process.cwd(), 'public', 'preview.html'), 'utf8');
    const hashes = ['style', 'script'].map((tag) => {
      const content = html.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? '';
      return `'sha256-${createHash('sha256').update(content).digest('base64')}'`;
    });
    headers['Content-Security-Policy'] = [
      "default-src 'none'", "img-src 'self' https://hynoesmp.com",
      `style-src ${hashes[0]}`, `script-src ${hashes[1]}`,
      "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'", "object-src 'none'",
    ].join('; ');
    return new Response(html, { headers });
  } catch {
    return new Response('Preview temporarily unavailable. The current site is unchanged.', {
      status: 503, headers,
    });
  }
}
