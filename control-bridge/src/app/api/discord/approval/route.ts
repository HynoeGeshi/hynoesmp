import { z } from 'zod';
import { loadConfig, type AppConfig } from '../../../../config';
import { verifyOwnerDashboardSession } from '../../../../auth/owner-session';
import { AuthError } from '../../../../auth/verify-token';
import { createManagedDiscordTools } from '../../../../discord/control';
import { discordApprovals } from '../../../../discord/approvals';
import { auditAction } from '../../../../audit';

export const dynamic = 'force-dynamic';
const schema = z.object({ tool: z.string().max(100), input: z.record(z.string(), z.unknown()), approve: z.boolean().optional(), digest: z.string().regex(/^[a-f0-9]{64}$/).optional() });
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > 32000) return reply({ error: 'Request too large' }, 413);
  let config: AppConfig;
  try {
    config = loadConfig();
  } catch {
    return reply({ error: 'Discord approvals are unavailable until the bridge is configured.' }, 503);
  }
  try {
    const auth = await verifyOwnerDashboardSession(request, config);
    const text = await request.text();
    if (text.length > 32000) return reply({ error: 'Request too large' }, 413);
    const body = schema.parse(JSON.parse(text));
    const tools = createManagedDiscordTools(config);
    const tool = Object.hasOwn(tools, body.tool) ? tools[body.tool] : undefined;
    if (!tool) return reply({ error: 'Unknown Discord tool' }, 400);
    const preview = await tool({ ...body.input, dryRun: true });
    if (!body.approve) return reply(preview);
    if (body.digest !== preview.digest) return reply({ error: 'Server or request changed. Preview again before approval.' }, 409);
    if (!preview.requiresApproval) return reply({ error: 'This action does not require owner approval.' }, 400);
    const approvalId = discordApprovals.issue(preview.digest, auth.userId);
    auditAction(config, { tool: 'discord_owner_approval', status: 'success', target: config.discordGuildId, detail: { approvedTool: body.tool, ownerId: auth.userId, digest: preview.digest } });
    return reply({ approvalId, expiresInSeconds: 300, tool: body.tool });
  } catch (error) {
    if (error instanceof AuthError) {
      return reply({ error: error.status === 401 ? 'Sign in again to continue your review.' : 'A direct login to the configured owner account is required.' }, error.status);
    }
    return reply({ error: 'The Discord change could not be reviewed. Check the action and target.' }, 400);
  }
}
