import { z } from 'zod';
import { loadConfig } from '../../../../config';
import { verifyOwnerDashboardSession } from '../../../../auth/owner-session';
import { createManagedDiscordTools } from '../../../../discord/control';
import { discordApprovals } from '../../../../discord/approvals';
import { auditAction } from '../../../../audit';

export const dynamic = 'force-dynamic';
const schema = z.object({ tool: z.string().max(100), input: z.record(z.string(), z.unknown()), approve: z.boolean().optional(), digest: z.string().regex(/^[a-f0-9]{64}$/).optional() });
export async function POST(request: Request) {
  try {
    if (Number(request.headers.get('content-length') ?? 0) > 32000) return Response.json({ error: 'Request too large' }, { status: 413 });
    const config = loadConfig();
    const auth = await verifyOwnerDashboardSession(request, config);
    const text = await request.text();
    if (text.length > 32000) return Response.json({ error: 'Request too large' }, { status: 413 });
    const body = schema.parse(JSON.parse(text));
    const tools = createManagedDiscordTools(config);
    const tool = Object.hasOwn(tools, body.tool) ? tools[body.tool] : undefined;
    if (!tool) return Response.json({ error: 'Unknown Discord tool' }, { status: 400 });
    const preview = await tool({ ...body.input, dryRun: true });
    if (!body.approve) return Response.json(preview, { headers: { 'cache-control': 'no-store' } });
    if (body.digest !== preview.digest) return Response.json({ error: 'Server or request changed. Preview again before approval.' }, { status: 409 });
    const approvalId = discordApprovals.issue(preview.digest, auth.userId);
    auditAction(config, { tool: 'discord_owner_approval', status: 'success', target: config.discordGuildId, detail: { approvedTool: body.tool, ownerId: auth.userId, digest: preview.digest } });
    return Response.json({ approvalId, expiresInSeconds: 300, tool: body.tool }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    const status = error && typeof error === 'object' && 'status' in error ? Number(error.status) : 400;
    return Response.json({ error: 'Approval request rejected. Verify owner login, configuration and action.' }, { status, headers: { 'cache-control': 'no-store' } });
  }
}
