import { withMcpAuth } from 'mcp-handler';
import { loadConfig } from '../../../config';
import { verifyMcpAccessToken } from '../../../auth/verify-token';
import { createHynoeMcpHandler } from '../../../mcp/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function createHandler() {
  const config = loadConfig();
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

function getHandler() {
  handler ??= createHandler();
  return handler;
}

export async function GET(request: Request) {
  return getHandler()(request);
}

export async function POST(request: Request) {
  return getHandler()(request);
}

export async function DELETE(request: Request) {
  return getHandler()(request);
}
