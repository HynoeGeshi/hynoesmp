import { afterEach, describe, expect, test, vi } from 'vitest';

const REQUIRED_ENV = [
  'BLOOM_API_KEY',
  'BLOOM_SERVER_ID',
  'DISCORD_BOT_TOKEN',
  'DISCORD_GUILD_ID',
  'DISCORD_ALLOWED_CHANNEL_IDS',
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'ALLOWED_SUPABASE_USER_ID',
  'PUBLIC_BASE_URL',
] as const;

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe('MCP route module', () => {
  test('can be imported without production secrets so Next can build the route', async () => {
    for (const key of REQUIRED_ENV) delete process.env[key];
    vi.resetModules();

    await expect(import('../src/app/api/mcp/route')).resolves.toBeDefined();
  });
});
