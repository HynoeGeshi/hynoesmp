import type { AppConfig } from '../config';
import { createDiscordClient } from '../discord/client';
import type { DiscordClient, DiscordMessage } from '../discord/types';
import { assertAllowedChannel } from '../policy/discord-policy';

function rejectMassMention(content: string, allowMassMention: boolean) {
  if (!allowMassMention && /@(everyone|here)\b/i.test(content)) throw new Error('Mass mentions require explicit approval');
}

export function createDiscordTools(config: AppConfig, client: DiscordClient = createDiscordClient(config)) {
  return {
    async discord_list_channels() {
      const channels = (await client.listGuildChannels()).filter((channel) => config.discordAllowedChannelIds.includes(channel.id));
      return { channels };
    },
    async discord_recent_messages({ channelId, limit = 25 }: { channelId: string; limit?: number }) {
      assertAllowedChannel(channelId, config);
      return { channelId, messages: await client.recentMessages(channelId, Math.max(1, Math.min(100, Math.trunc(limit)))) };
    },
    async discord_search_recent({ query, channelId }: { query: string; channelId?: string }) {
      const needle = query.trim().toLowerCase();
      if (!needle || needle.length > 200) throw new Error('Search query must be 1-200 characters');
      const channelIds = channelId ? [channelId] : config.discordAllowedChannelIds;
      const matches: DiscordMessage[] = [];
      for (const id of channelIds) {
        assertAllowedChannel(id, config);
        const messages = await client.recentMessages(id, 100);
        matches.push(...messages.filter((message) => (message.content ?? '').toLowerCase().includes(needle)).map((message) => ({ ...message, channel_id: message.channel_id ?? id })));
      }
      return { matches: matches.slice(0, 100) };
    },
    async discord_send_message({ channelId, content, allowMassMention = false }: { channelId: string; content: string; allowMassMention?: boolean }) {
      assertAllowedChannel(channelId, config);
      if (!content.trim() || content.length > 2000) throw new Error('Discord message must be 1-2000 characters');
      rejectMassMention(content, allowMassMention);
      return { message: await client.sendMessage(channelId, content, allowMassMention) };
    },
    async discord_send_announcement({ channelId, content, allowMassMention = false }: { channelId: string; content: string; allowMassMention?: boolean }) {
      assertAllowedChannel(channelId, config);
      if (!content.trim() || content.length > 2000) throw new Error('Discord announcement must be 1-2000 characters');
      rejectMassMention(content, allowMassMention);
      return { message: await client.sendMessage(channelId, content, allowMassMention) };
    },
    async discord_delete_own_message({ channelId, messageId }: { channelId: string; messageId: string }) {
      assertAllowedChannel(channelId, config);
      const [me, message] = await Promise.all([client.getCurrentUser(), client.getMessage(channelId, messageId)]);
      if (message.author.id !== me.id) throw new Error('Only bot-authored messages can be deleted');
      await client.deleteMessage(channelId, messageId);
      return { ok: true, channelId, messageId };
    },
  };
}
