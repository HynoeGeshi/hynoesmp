import type { AppConfig } from '../config';
import { verifyMcpAccessToken, AuthError } from './verify-token';

export async function verifyOwnerDashboardSession(request: Request, config: AppConfig) {
  if (request.headers.get('origin') !== config.publicBaseUrl) throw new AuthError(403, 'Owner dashboard origin required');
  const auth = await verifyMcpAccessToken(request, config, { directSessionOnly: true });
  // OAuth clients may use management tools but cannot mint human approval.
  if (auth.clientId !== 'supabase-oauth') throw new AuthError(403, 'Approve using a direct owner login, not an OAuth client');
  const authorization = request.headers.get('authorization')!;
  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, { headers: { authorization, apikey: config.supabasePublishableKey }, signal: AbortSignal.timeout(10000), cache: 'no-store' });
  if (!response.ok) throw new AuthError(401, 'Owner session is no longer valid');
  const user = await response.json() as { id?: string };
  if (user.id !== config.allowedSupabaseUserId) throw new AuthError(403, 'Owner account required');
  return auth;
}
