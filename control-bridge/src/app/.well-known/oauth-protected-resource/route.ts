import { loadOAuthMetadataConfig } from '../../../config';
import { protectedResourceMetadata } from '../../../auth/oauth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const headers = { 'cache-control': 'no-store' };
  try {
    return Response.json(protectedResourceMetadata(loadOAuthMetadataConfig()), { headers });
  } catch {
    return Response.json({ error: 'Hynoe OAuth discovery is unavailable.' }, { status: 503, headers });
  }
}
