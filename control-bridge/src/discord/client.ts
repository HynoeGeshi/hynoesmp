import type { AppConfig } from '../config';
import { auditAction } from '../audit';
import type {
  DiscordChannel,
  DiscordChannelPatch,
  DiscordClient,
  DiscordGuild,
  DiscordMessage,
  DiscordOnboarding,
  DiscordPermissionOverwrite,
  DiscordRole,
  DiscordRolePatch,
  DiscordUser,
  DiscordWebhook,
} from './types';

const API = 'https://discord.com/api/v10';

export function createDiscordClient(config: AppConfig): DiscordClient {
  function withReason(init: RequestInit, reason?: string): RequestInit {
    if (!reason?.trim()) return init;
    const headers = new Headers(init.headers);
    headers.set('x-audit-log-reason', encodeURIComponent(reason.trim().slice(0, 512)));
    return { ...init, headers };
  }

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('authorization', `Bot ${config.discordBotToken}`);
    headers.set('accept', 'application/json');
    if (init.body != null && !headers.has('content-type')) headers.set('content-type', 'application/json');
    const response = await fetch(`${API}${path}`, { ...init, headers, cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (init.method && init.method !== 'GET') auditAction(config, { tool: 'discord_provider_write', target: path.split('?')[0], status: response.ok ? 'success' : 'error', detail: { method: init.method, httpStatus: response.status } });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({})) as { code?: number; retry_after?: number };
      throw new Error(`Discord API request failed (${response.status}), code ${typeof detail.code === 'number' ? detail.code : 'unknown'}${response.status === 429 ? `; rate limited, retry after ${Number(detail.retry_after) || 1}s. Write not retried.` : ''}`);
    }
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  const guildId = encodeURIComponent(config.discordGuildId);
  const json = (body: unknown, method: string, reason?: string): RequestInit => withReason({ method, body: JSON.stringify(body) }, reason);
  const empty = (method: string, reason?: string): RequestInit => withReason({ method }, reason);

  return {
    getGuildMember: (userId) => request(`/guilds/${guildId}/members/${encodeURIComponent(userId)}`),
    getApplication: () => request('/oauth2/applications/@me'),
    sendMessagePayload: (channelId, payload) => request(`/channels/${encodeURIComponent(channelId)}/messages`, json(payload, 'POST')),
    editMessage: (channelId, messageId, payload) => request(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`, json(payload, 'PATCH')),
    crosspostMessage: (channelId, messageId) => request(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}/crosspost`, empty('POST')),
    getGuild: () => request<DiscordGuild>(`/guilds/${guildId}`),
    listGuildChannels: () => request<DiscordChannel[]>(`/guilds/${guildId}/channels`),
    listGuildRoles: () => request<DiscordRole[]>(`/guilds/${guildId}/roles`),
    listGuildWebhooks: async () => (await request<DiscordWebhook[]>(`/guilds/${guildId}/webhooks`)).map(({ id, type, guild_id, channel_id, name, application_id }) => ({ id, type, guild_id, channel_id, name, application_id })),
    getGuildOnboarding: () => request<DiscordOnboarding>(`/guilds/${guildId}/onboarding`),
    recentMessages: (channelId, limit) => request<DiscordMessage[]>(`/channels/${encodeURIComponent(channelId)}/messages?limit=${Math.max(1, Math.min(100, Math.trunc(limit)))}`),
    sendMessage: (channelId, content, allowMassMention = false) => request<DiscordMessage>(`/channels/${encodeURIComponent(channelId)}/messages`, {
      method: 'POST', body: JSON.stringify({ content, allowed_mentions: { parse: allowMassMention ? ['everyone'] : [] } }),
    }),
    getCurrentUser: () => request<DiscordUser>('/users/@me'),
    getMessage: (channelId, messageId) => request<DiscordMessage>(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`),
    deleteMessage: (channelId, messageId) => request<void>(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' }),

    createGuildChannel: (patch: DiscordChannelPatch & { name: string }, reason?: string) =>
      request<DiscordChannel>(`/guilds/${guildId}/channels`, json(patch, 'POST', reason)),
    updateChannel: (channelId: string, patch: DiscordChannelPatch, reason?: string) =>
      request<DiscordChannel>(`/channels/${encodeURIComponent(channelId)}`, json(patch, 'PATCH', reason)),
    reorderGuildChannels: (channels, reason?: string) =>
      request<DiscordChannel[]>(`/guilds/${guildId}/channels`, json(channels, 'PATCH', reason)),
    deleteChannel: (channelId: string, reason?: string) =>
      request<DiscordChannel | void>(`/channels/${encodeURIComponent(channelId)}`, empty('DELETE', reason)),

    createGuildRole: (patch: DiscordRolePatch & { name?: string }, reason?: string) =>
      request<DiscordRole>(`/guilds/${guildId}/roles`, json(patch, 'POST', reason)),
    updateGuildRole: (roleId: string, patch: DiscordRolePatch, reason?: string) =>
      request<DiscordRole>(`/guilds/${guildId}/roles/${encodeURIComponent(roleId)}`, json(patch, 'PATCH', reason)),
    reorderGuildRoles: (roles, reason?: string) =>
      request<DiscordRole[]>(`/guilds/${guildId}/roles`, json(roles, 'PATCH', reason)),
    deleteGuildRole: (roleId: string, reason?: string) =>
      request<void>(`/guilds/${guildId}/roles/${encodeURIComponent(roleId)}`, empty('DELETE', reason)),

    putChannelPermission: (channelId: string, overwriteId: string, overwrite: Omit<DiscordPermissionOverwrite, 'id'>, reason?: string) =>
      request<void>(`/channels/${encodeURIComponent(channelId)}/permissions/${encodeURIComponent(overwriteId)}`, json(overwrite, 'PUT', reason)),
    deleteChannelPermission: (channelId: string, overwriteId: string, reason?: string) =>
      request<void>(`/channels/${encodeURIComponent(channelId)}/permissions/${encodeURIComponent(overwriteId)}`, empty('DELETE', reason)),

    timeoutGuildMember: (userId: string, until: string | null, reason?: string) =>
      request<unknown>(`/guilds/${guildId}/members/${encodeURIComponent(userId)}`, json({ communication_disabled_until: until }, 'PATCH', reason)),
    kickGuildMember: (userId: string, reason?: string) =>
      request<void>(`/guilds/${guildId}/members/${encodeURIComponent(userId)}`, empty('DELETE', reason)),
    banGuildMember: (userId: string, reason?: string) =>
      request<void>(`/guilds/${guildId}/bans/${encodeURIComponent(userId)}`, empty('PUT', reason)),
    unbanGuildMember: (userId: string, reason?: string) =>
      request<void>(`/guilds/${guildId}/bans/${encodeURIComponent(userId)}`, empty('DELETE', reason)),
    addGuildMemberRole: (userId: string, roleId: string, reason?: string) =>
      request<void>(`/guilds/${guildId}/members/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`, empty('PUT', reason)),
    removeGuildMemberRole: (userId: string, roleId: string, reason?: string) =>
      request<void>(`/guilds/${guildId}/members/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`, empty('DELETE', reason)),
    bulkDeleteMessages: (channelId: string, messageIds: string[], reason?: string) =>
      request<void>(`/channels/${encodeURIComponent(channelId)}/messages/bulk-delete`, json({ messages: messageIds }, 'POST', reason)),
    deleteWebhook: (webhookId: string, reason?: string) =>
      request<void>(`/webhooks/${encodeURIComponent(webhookId)}`, empty('DELETE', reason)),
  };
}
