import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../src/app/api/discord/approval/route';
import { discordApprovals } from '../src/discord/approvals';

const { preview, ownerSession } = vi.hoisted(() => ({
  preview: vi.fn(),
  ownerSession: vi.fn(),
}));

vi.mock('../src/auth/owner-session', () => ({ verifyOwnerDashboardSession: ownerSession }));
vi.mock('../src/discord/control', () => ({
  createManagedDiscordTools: () => ({ discord_delete_channel: preview }),
}));

const digest = 'a'.repeat(64);

function request(input: Record<string, unknown> = {}) {
  return new Request('https://bridge.example.com/api/discord/approval', {
    method: 'POST',
    body: JSON.stringify({
      tool: 'discord_delete_channel',
      input: { channelId: 'channel' },
      ...input,
    }),
  });
}

describe('Discord owner approval endpoint', () => {
  beforeEach(() => {
    vi.stubEnv('DISCORD_BOT_TOKEN', 'test-token');
    vi.stubEnv('DISCORD_GUILD_ID', 'guild');
    vi.stubEnv('DISCORD_GUILD_MANAGEMENT_ENABLED', 'true');
    vi.stubEnv('SUPABASE_URL', 'https://auth.example.com');
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'test-key');
    vi.stubEnv('ALLOWED_SUPABASE_USER_ID', 'owner');
    vi.stubEnv('PUBLIC_BASE_URL', 'https://bridge.example.com');
    ownerSession.mockResolvedValue({ userId: 'owner' });
    preview.mockResolvedValue({ requiresApproval: true, digest });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('reports incomplete setup without asking the operator to sign in again', async () => {
    vi.stubEnv('DISCORD_BOT_TOKEN', '');
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ error: 'Discord approvals are unavailable until the bridge is configured.' });
    expect(ownerSession).not.toHaveBeenCalled();
  });

  it('does not issue an approval for an action that needs no review', async () => {
    const issue = vi.spyOn(discordApprovals, 'issue');
    preview.mockResolvedValue({ requiresApproval: false, digest });
    const response = await POST(request({ approve: true, digest }));
    expect(response.status).toBe(400);
    expect(issue).not.toHaveBeenCalled();
  });

  it('requires a fresh preview after a change and only issues an exact review', async () => {
    const issue = vi.spyOn(discordApprovals, 'issue').mockReturnValue('test-approval');
    const stale = await POST(request({ approve: true, digest: 'b'.repeat(64) }));
    expect(stale.status).toBe(409);
    expect(issue).not.toHaveBeenCalled();
    const exact = await POST(request({ approve: true, digest }));
    expect(exact.status).toBe(200);
    expect(await exact.json()).toMatchObject({ approvalId: 'test-approval' });
    expect(issue).toHaveBeenCalledExactlyOnceWith(digest, 'owner');
    expect(preview).toHaveBeenCalledWith({ channelId: 'channel', dryRun: true });
  });
});
