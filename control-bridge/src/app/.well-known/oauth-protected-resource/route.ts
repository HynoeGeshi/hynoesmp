import { loadConfig } from '../../../config';
import { protectedResourceMetadata } from '../../../auth/oauth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = loadConfig();
  return Response.json(protectedResourceMetadata(config), { headers: { 'cache-control': 'no-store' } });
}
