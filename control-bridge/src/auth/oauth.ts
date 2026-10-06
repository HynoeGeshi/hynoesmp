import type { AppConfig } from '../config';

export const MCP_SCOPES = ['openid', 'email'] as const;

export function protectedResourceMetadata(config: AppConfig) {
  return {
    resource: `${config.publicBaseUrl}/api/mcp`,
    authorization_servers: [`${config.supabaseUrl}/auth/v1`],
    scopes_supported: [...MCP_SCOPES],
    bearer_methods_supported: ['header'],
  };
}

export function oauthChallenge(config: AppConfig): string {
  return `Bearer resource_metadata="${config.publicBaseUrl}/.well-known/oauth-protected-resource"`;
}
