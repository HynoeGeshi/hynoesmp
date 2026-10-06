import { loadOAuthPublicConfig } from '../../auth/public-config';
import { LoginClient } from '../../components/LoginClient';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ authorization_id?: string }> }) {
  const params = await searchParams;
  const config = loadOAuthPublicConfig();
  return <LoginClient {...config} authorizationId={params.authorization_id} />;
}
