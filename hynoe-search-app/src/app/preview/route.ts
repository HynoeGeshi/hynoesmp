import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { publicBusinesses } from '@/data/public-businesses';
import { upgradePreview, previewHeaders } from '@/lib/preview/upgrade';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const original = await readFile(join(process.cwd(), 'public', 'preview.html'), 'utf8');
    const html = upgradePreview(original, publicBusinesses);
    return new Response(html, { headers: previewHeaders(html) });
  } catch {
    return new Response('Preview temporarily unavailable. The current site is unchanged.', {
      status: 503, headers: previewHeaders(''),
    });
  }
}
