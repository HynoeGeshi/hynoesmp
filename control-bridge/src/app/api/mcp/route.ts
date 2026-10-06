import { withMcpAuth } from 'mcp-handler';
import { loadConfig } from '../../../config';
import { verifyMcpAccessToken } from '../../../auth/verify-token';
import { createHynoeMcpHandler } from '../../../mcp/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const config = loadConfig();
const rawHandler = createHynoeMcpHandler(config);

const handler = withMcpAuth(
  rawHandler,
  async (request, bearerToken) => {
    try {
      const auth = await verifyMcpAccessToken(request, config);
      return {
        token: bearerToken ?? '',
        clientId: auth.clientId,
        scopes: auth.scopes,
        resource: new URL(`${config.publicBaseUrl}/api/mcp`),
      };
    } catch {
      return undefined;
    }
  },
  {
    required: true,
    requiredScopes: ['openid', 'email'],
    resourceMetadataPath: '/.well-known/oauth-protected-resource',
    resourceUrl: config.publicBaseUrl,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
