import type { AppConfig } from '../config';
import { createDiscordClient } from '../discord/client';
import { summarizeDiscordActivity } from '../discord/analytics';
import type { DiscordClient, DiscordMessage } from '../discord/types';
import { assertAllowedChannel } from '../policy/discord-policy';

const MAX_ACTIVITY_CHANNELS = 25;

function rejectMassMention(content: string, allowMassMention: boolean) {
  if (!allowMassMention && /@(everyone|here)\b/i.test(content)) throw new Error('Mass mentions require explicit approval');
}

export function createDiscordTools(config: AppConfig, client: DiscordClient = createDiscordClient(config)) {
  return {
    async discord_list_channels() {
      const channels = await client.listGuildChannels();
      return {
        channels: config.discordGuildManagementEnabled === true
          ? channels
          : channels.filter((channel) => config.discordAllowedChannelIds.includes(channel.id)),
      };
    },
    async discord_guild_overview() {
      const [guild, channels, roles, onboarding] = await Promise.all([
        client.getGuild(),
        client.listGuildChannels(),
        client.listGuildRoles(),
        client.getGuildOnboarding(),
      ]);
      return {
        guild,
        categories: channels.filter((channel) => channel.type === 4),
        channels: channels.filter((channel) => channel.type !== 4),
        roles,
        onboarding,
      };
    },
    async discord_list_roles() {
      return { roles: await client.listGuildRoles() };
    },
    async discord_list_webhooks() {
      return { webhooks: await client.listGuildWebhooks() };
    },
    async discord_channel_permissions({ channelId }: { channelId: string }) {
      assertAllowedChannel(channelId, config);
      const channels = await client.listGuildChannels();
      const channel = channels.find((candidate) => candidate.id === channelId);
      if (!channel) throw new Error('Discord channel was not found in the configured guild');
      return { channelId, permissionOverwrites: channel.permission_overwrites ?? [] };
    },
    async discord_activity_summary({ channelIds, perChannelLimit = 50 }: { channelIds?: string[]; perChannelLimit?: number } = {}) {
      let requestedIds = channelIds?.filter(Boolean) ?? [];
      const channels = await client.listGuildChannels();
      if (requestedIds.length === 0) {
        requestedIds = channels.filter((channel) => channel.type === 0 || channel.type === 5).map((channel) => channel.id);
      }
      const ids = [...new Set(requestedIds)].slice(0, MAX_ACTIVITY_CHANNELS);
      const safeLimit = Math.max(1, Math.min(100, Math.trunc(perChannelLimit)));
      const names = new Map(channels.map((channel) => [channel.id, channel.name]));
      const activity = [];
      for (const id of ids) {
        assertAllowedChannel(id, config);
        activity.push({ channelId: id, channelName: names.get(id), messages: await client.recentMessages(id, safeLimit) });
      }
      return summarizeDiscordActivity({ channels: activity });
    },
    async discord_recent_messages({ channelId, limit = 25 }: { channelId: string; limit?: number }) {
      assertAllowedChannel(channelId, config);
      return { channelId, messages: await client.recentMessages(channelId, Math.max(1, Math.min(100, Math.trunc(limit)))) };
    },
    async discord_search_recent({ query, channelId }: { query: string; channelId?: string }) {
      const needle = query.trim().toLowerCase();
      if (!needle || needle.length > 200) throw new Error('Search query must be 1-200 characters');
      let channelIds: string[];
      if (channelId) {
        channelIds = [channelId];
      } else if (config.discordGuildManagementEnabled === true) {
        channelIds = (await client.listGuildChannels()).filter((channel) => channel.type === 0 || channel.type === 5).map((channel) => channel.id).slice(0, MAX_ACTIVITY_CHANNELS);
      } else {
        channelIds = config.discordAllowedChannelIds;
      }
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
