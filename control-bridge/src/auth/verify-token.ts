import { createLocalJWKSet, jwtVerify, errors as joseErrors, type JWTPayload } from 'jose';
import type { AppConfig } from '../config';
import { oauthChallenge } from './oauth';

export type AuthContext = { userId: string; clientId: string; email?: string; scopes: string[] };

export class AuthError extends Error {
  constructor(public readonly status: number, message: string, public readonly challenge?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

function parseScopes(payload: JWTPayload): string[] {
  if (typeof payload.scope === 'string') return payload.scope.split(/\s+/).filter(Boolean);
  const scp = payload.scp;
  if (Array.isArray(scp)) return scp.filter((v): v is string => typeof v === 'string');
  return [];
}

export async function verifyMcpAccessToken(request: Request, config: AppConfig, options: { directSessionOnly?: boolean } = {}): Promise<AuthContext> {
  const header = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw new AuthError(401, 'Missing bearer token', oauthChallenge(config));

  try {
    const jwksResponse = await fetch(`${config.supabaseUrl}/auth/v1/.well-known/jwks.json`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!jwksResponse.ok) throw new AuthError(401, 'Unable to verify access token', oauthChallenge(config));
    const jwks = await jwksResponse.json() as { keys?: JsonWebKey[] };
    if (!Array.isArray(jwks.keys) || jwks.keys.length === 0) throw new AuthError(401, 'Unable to verify access token', oauthChallenge(config));

    const { payload } = await jwtVerify(match[1], createLocalJWKSet(jwks as Parameters<typeof createLocalJWKSet>[0]), {
      issuer: `${config.supabaseUrl}/auth/v1`,
    });
    if (!payload.sub) throw new AuthError(401, 'Access token has no subject', oauthChallenge(config));
    if (payload.sub !== config.allowedSupabaseUserId) throw new AuthError(403, 'This account is not authorized for Hynoe control tools');
    if (options.directSessionOnly && payload.client_id !== undefined) throw new AuthError(403, 'Direct owner login required for approval');

    return {
      userId: payload.sub,
      clientId: typeof payload.client_id === 'string' ? payload.client_id : 'supabase-oauth',
      email: typeof payload.email === 'string' ? payload.email : undefined,
      scopes: parseScopes(payload),
    };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    if (error instanceof joseErrors.JOSEError || error instanceof Error) throw new AuthError(401, 'Invalid or expired access token', oauthChallenge(config));
    throw new AuthError(401, 'Invalid access token', oauthChallenge(config));
  }
}
