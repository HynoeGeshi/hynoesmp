import { withMcpAuth } from 'mcp-handler';
import { loadConfig, type AppConfig } from '../../../config';
import { verifyMcpAccessToken } from '../../../auth/verify-token';
import { createHynoeMcpHandler } from '../../../mcp/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function createHandler(config: AppConfig) {
  const rawHandler = createHynoeMcpHandler(config);

  return withMcpAuth(
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
}

let handler: ReturnType<typeof createHandler> | undefined;

async function handleRequest(request: Request) {
  if (!handler) {
    let config: AppConfig;
    try {
      config = loadConfig();
    } catch {
      return Response.json(
        { error: 'Hynoe control tools are unavailable until configuration is complete.' },
        { status: 503, headers: { 'cache-control': 'no-store' } },
      );
    }
    handler = createHandler(config);
  }
  return handler(request);
}

export const GET = handleRequest;
export const POST = handleRequest;
export const DELETE = handleRequest;
