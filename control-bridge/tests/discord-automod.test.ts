import { afterEach, expect, it, vi } from 'vitest';
import type { AppConfig } from '../src/config';
import * as discord from '../src/discord/client';

const config = { discordGuildId: '976637845542416476', discordGuildManagementEnabled: true, discordBotToken: 'mock' } as AppConfig;
afterEach(() => vi.unstubAllGlobals());

it('rejects another guild and disabled management before contacting Discord', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  await expect(discord.readDiscordAutomodStatus({ ...config, discordGuildId: 'other' })).rejects.toThrow(/restricted/i);
  await expect(discord.readDiscordAutomodStatus({ ...config, discordGuildManagementEnabled: false })).rejects.toThrow(/disabled/i);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('uses one read and reports enabled blocking rules and exemptions without private metadata', async () => {
  const base = { guild_id: config.discordGuildId, event_type: 1, enabled: true, exempt_channels: [], exempt_roles: [] };
  const fetchMock = vi.fn(async () => Response.json([
    { ...base, id: 'rule1', name: 'Language', trigger_type: 1, trigger_metadata: { keyword_filter: ['PRIVATE_KEYWORD'], allow_list: ['PRIVATE_ALLOW'] },
      actions: [{ type: 1, metadata: { custom_message: 'PRIVATE_TEXT' } }], exempt_channels: ['channel1'], exempt_roles: ['role1'] },
    { ...base, id: 'rule2', name: 'Mentions', trigger_type: 5, actions: [{ type: 1 }] },
    { ...base, id: 'rule3', name: 'Disabled', enabled: false, trigger_type: 4, actions: [{ type: 1 }] },
  ]));
  vi.stubGlobal('fetch', fetchMock);
  const result = await discord.readDiscordAutomodStatus(config);
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith('https://discord.com/api/v10/guilds/976637845542416476/auto-moderation/rules', expect.objectContaining({ cache: 'no-store' }));
  expect(result).toMatchObject({
    guildId: config.discordGuildId, blockingLanguageRulePresent: true, hasConfiguredExemptions: true,
    enabledRules: [{ name: 'Language', triggerType: 1, actionTypes: [1], exemptChannelIds: ['channel1'], exemptRoleIds: ['role1'] }, { name: 'Mentions' }],
    coverageNote: expect.stringMatching(/Administrator.*Manage Server.*exempt/i),
  });
  expect(JSON.stringify(result)).not.toMatch(/PRIVATE_|Disabled/);
});

it('does not count disabled, alert-only, or mention rules as blocking language rules', async () => {
  const base = { guild_id: config.discordGuildId, event_type: 1, exempt_channels: [], exempt_roles: [] };
  vi.stubGlobal('fetch', vi.fn(async () => Response.json([
    { ...base, id: 'disabled', name: 'Disabled', enabled: false, trigger_type: 1, actions: [{ type: 1 }] },
    { ...base, id: 'alert', name: 'Alert only', enabled: true, trigger_type: 1, actions: [{ type: 2 }] },
    { ...base, id: 'mentions', name: 'Mentions', enabled: true, trigger_type: 5, actions: [{ type: 1 }] },
  ])));
  await expect(discord.readDiscordAutomodStatus(config)).resolves.toMatchObject({ blockingLanguageRulePresent: false, hasConfiguredExemptions: false });
});
