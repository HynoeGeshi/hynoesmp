import type { AppConfig } from '../config';
import { createDiscordClient } from '../discord/client';
import { summarizeDiscordActivity } from '../discord/analytics';
import type { DiscordChannelPatch, DiscordClient, DiscordMessage, DiscordRolePatch } from '../discord/types';
import { assertAllowedChannel, assertDiscordActionAllowed } from '../policy/discord-policy';

const MAX_ACTIVITY_CHANNELS = 25;

function rejectMassMention(content: string, allowMassMention: boolean) {
  if (!allowMassMention && /@(everyone|here)\b/i.test(content)) throw new Error('Mass mentions require explicit approval');
}

function bitfield(value: string): bigint {
  if (!/^\d+$/.test(value)) throw new Error('Discord permission bitfields must be decimal integers');
  return BigInt(value);
}

function broadensPermissions(currentAllow: string, currentDeny: string, nextAllow: string, nextDeny: string): boolean {
  const oldAllow = bitfield(currentAllow);
  const oldDeny = bitfield(currentDeny);
  const newAllow = bitfield(nextAllow);
  const newDeny = bitfield(nextDeny);
  return (newAllow & ~oldAllow) !== 0n || (oldDeny & ~newDeny) !== 0n;
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
        client.getGuild(), client.listGuildChannels(), client.listGuildRoles(), client.getGuildOnboarding(),
      ]);
      return {
        guild,
        categories: channels.filter((channel) => channel.type === 4),
        channels: channels.filter((channel) => channel.type !== 4),
        roles,
        onboarding,
      };
    },
    async discord_list_roles() { return { roles: await client.listGuildRoles() }; },
    async discord_list_webhooks() { return { webhooks: await client.listGuildWebhooks() }; },
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
      if (requestedIds.length === 0) requestedIds = channels.filter((channel) => channel.type === 0 || channel.type === 5).map((channel) => channel.id);
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
      if (channelId) channelIds = [channelId];
      else if (config.discordGuildManagementEnabled === true) channelIds = (await client.listGuildChannels()).filter((channel) => channel.type === 0 || channel.type === 5).map((channel) => channel.id).slice(0, MAX_ACTIVITY_CHANNELS);
      else channelIds = config.discordAllowedChannelIds;
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
      assertDiscordActionAllowed('send_message', {});
      if (!content.trim() || content.length > 2000) throw new Error('Discord message must be 1-2000 characters');
      rejectMassMention(content, allowMassMention);
      return { message: await client.sendMessage(channelId, content, allowMassMention) };
    },
    async discord_send_announcement({ channelId, content, allowMassMention = false }: { channelId: string; content: string; allowMassMention?: boolean }) {
      assertAllowedChannel(channelId, config);
      assertDiscordActionAllowed('send_message', {});
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

    async discord_create_channel(input: { name: string; type?: number; parentId?: string | null; topic?: string | null; position?: number; reason?: string }) {
      assertDiscordActionAllowed('create_channel', {});
      const patch: DiscordChannelPatch & { name: string } = { name: input.name, type: input.type ?? 0 };
      if (input.parentId !== undefined) patch.parent_id = input.parentId;
      if (input.topic !== undefined) patch.topic = input.topic;
      if (input.position !== undefined) patch.position = input.position;
      return { channel: await client.createGuildChannel(patch, input.reason ?? 'Hynoe Control structure update') };
    },
    async discord_update_channel(input: { channelId: string; name?: string; topic?: string | null; parentId?: string | null; position?: number; reason?: string }) {
      assertDiscordActionAllowed('update_channel', {});
      assertAllowedChannel(input.channelId, config);
      const patch: DiscordChannelPatch = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.topic !== undefined) patch.topic = input.topic;
      if (input.parentId !== undefined) patch.parent_id = input.parentId;
      if (input.position !== undefined) patch.position = input.position;
      return { channel: await client.updateChannel(input.channelId, patch, input.reason ?? 'Hynoe Control structure update') };
    },
    async discord_reorder_channels(input: { channels: Array<{ id: string; position?: number; parentId?: string | null; lockPermissions?: boolean }>; reason?: string }) {
      assertDiscordActionAllowed('reorder_channels', {});
      return { channels: await client.reorderGuildChannels(input.channels.map((channel) => ({ id: channel.id, position: channel.position, parent_id: channel.parentId, lock_permissions: channel.lockPermissions })), input.reason ?? 'Hynoe Control channel reorder') };
    },
    async discord_create_role(input: DiscordRolePatch & { name: string; reason?: string }) {
      assertDiscordActionAllowed('create_role', {});
      const { reason, ...patch } = input;
      return { role: await client.createGuildRole(patch, reason ?? 'Hynoe Control role update') };
    },
    async discord_update_role(input: DiscordRolePatch & { roleId: string; reason?: string }) {
      assertDiscordActionAllowed('update_role', {});
      const { roleId, reason, ...patch } = input;
      return { role: await client.updateGuildRole(roleId, patch, reason ?? 'Hynoe Control role update') };
    },
    async discord_reorder_roles(input: { roles: Array<{ id: string; position: number }>; reason?: string }) {
      assertDiscordActionAllowed('reorder_roles', {});
      return { roles: await client.reorderGuildRoles(input.roles, input.reason ?? 'Hynoe Control role reorder') };
    },
    async discord_update_channel_permission(input: { channelId: string; overwriteId: string; type: 0 | 1; allow: string; deny: string; confirmed?: boolean; reason?: string }) {
      assertAllowedChannel(input.channelId, config);
      const channels = await client.listGuildChannels();
      const channel = channels.find((candidate) => candidate.id === input.channelId);
      if (!channel) throw new Error('Discord channel was not found in the configured guild');
      const current = channel.permission_overwrites?.find((overwrite) => overwrite.id === input.overwriteId);
      const isBroader = !current || broadensPermissions(current.allow, current.deny, input.allow, input.deny);
      if (isBroader) assertDiscordActionAllowed('broaden_permissions', { confirmed: input.confirmed });
      await client.putChannelPermission(input.channelId, input.overwriteId, { type: input.type, allow: input.allow, deny: input.deny }, input.reason ?? 'Hynoe Control permission update');
      return { ok: true, channelId: input.channelId, overwriteId: input.overwriteId, broadened: isBroader };
    },
    async discord_delete_channel(input: { channelId: string; confirmed?: boolean; reason?: string }) {
      assertDiscordActionAllowed('delete_channel', { confirmed: input.confirmed });
      assertAllowedChannel(input.channelId, config);
      await client.deleteChannel(input.channelId, input.reason ?? 'Confirmed Hynoe Control channel deletion');
      return { ok: true, channelId: input.channelId };
    },
    async discord_delete_role(input: { roleId: string; confirmed?: boolean; reason?: string }) {
      assertDiscordActionAllowed('delete_role', { confirmed: input.confirmed });
      await client.deleteGuildRole(input.roleId, input.reason ?? 'Confirmed Hynoe Control role deletion');
      return { ok: true, roleId: input.roleId };
    },
  };
}
