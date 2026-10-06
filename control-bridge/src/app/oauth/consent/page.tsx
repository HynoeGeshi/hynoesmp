import { loadOAuthPublicConfig } from '../../../auth/public-config';
import { normalizeAuthorizationId } from '../../../auth/consent';
import { ConsentClient } from '../../../components/ConsentClient';

export const dynamic = 'force-dynamic';

export default async function ConsentPage({ searchParams }: { searchParams: Promise<{ authorization_id?: string }> }) {
  const params = await searchParams;
  let authorizationId: string;
  try { authorizationId = normalizeAuthorizationId(params.authorization_id); }
  catch { return <main className="shell"><section className="card"><h1>Invalid authorization request</h1><p className="error">The authorization_id is missing or invalid.</p></section></main>; }
  const config = loadOAuthPublicConfig();
  return <ConsentClient {...config} authorizationId={authorizationId} />;
}
