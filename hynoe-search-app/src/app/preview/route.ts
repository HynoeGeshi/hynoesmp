import { listDiscoverablePages } from '@/lib/pages/public-pages';
import { renderSearchHome } from '@/lib/preview/search-home';
import { previewHeaders } from '@/lib/preview/upgrade';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const pages = await listDiscoverablePages();
    const html = renderSearchHome(pages);
    return new Response(html, { headers: previewHeaders(html) });
  } catch {
    return new Response('Search preview temporarily unavailable. Please try again.', { status: 503, headers: previewHeaders('') });
  }
}
