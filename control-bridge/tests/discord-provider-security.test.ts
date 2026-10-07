import { expect, it, vi } from 'vitest';
import { createDiscordClient } from '../src/discord/client';
import type { AppConfig } from '../src/config';
const config = { discordGuildId: 'guild', discordBotToken: 'BOT_SECRET' } as AppConfig;
it('never returns webhook tokens or URLs from inventory', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json([{ id: 'w1', name: 'Minecraft', token: 'WEBHOOK_SECRET', url: 'https://discord.com/api/webhooks/w1/WEBHOOK_SECRET' }])));
  const output = await createDiscordClient(config).listGuildWebhooks();
  expect(output[0].name).toBe('Minecraft');
  expect(JSON.stringify(output)).not.toContain('SECRET');
});
it('does not echo provider response bodies on write failure or retry writes', async () => {
  const fetchMock = vi.fn(async () => Response.json({ code: 50013, message: 'private user text BOT_SECRET' }, { status: 403 }));
  vi.stubGlobal('fetch', fetchMock);
  await expect(createDiscordClient(config).updateChannel('c1', { name: 'new' })).rejects.toThrow('code 50013');
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await expect(createDiscordClient(config).updateChannel('c1', { name: 'new' })).rejects.not.toThrow(/BOT_SECRET|private user text/);
});
it('sends and edits embeds without parsing role or member mentions', async () => {
  const fetchMock = vi.fn(async () => Response.json({ id: 'm1', author: { id: 'bot' } })); vi.stubGlobal('fetch', fetchMock);
  const client = createDiscordClient(config);
  await client.sendMessagePayload('c1', { embeds: [{ title: 'Gold Hynoe' }], allowed_mentions: { parse: [] } });
  await client.editMessage('c1', 'm1', { content: 'updated', allowed_mentions: { parse: [] } });
  expect(fetchMock.mock.calls.map((call: any) => [call[0], call[1].method])).toEqual([['https://discord.com/api/v10/channels/c1/messages', 'POST'], ['https://discord.com/api/v10/channels/c1/messages/m1', 'PATCH']]);
});
