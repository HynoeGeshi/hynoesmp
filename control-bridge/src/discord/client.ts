import { createHash } from 'node:crypto';
import type { AppConfig } from '../config';
import { auditAction } from '../audit';
import { redactSecrets } from '../security/redact';
import type {
  DiscordAutomodRule,
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

export function discordSendNonce(guildId: string, channelId: string, tool: string, requestId?: string): string | undefined {
  if (requestId === undefined) return undefined;
  return createHash('sha256').update(JSON.stringify(['hynoe-control', guildId, channelId, tool, requestId])).digest('hex').slice(0, 24);
}

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
    const write = Boolean(init.method && init.method !== 'GET');
    const auditWrite = (outcome: 'applied' | 'rejected' | 'unknown', httpStatus?: number) => auditAction(config, {
      tool: 'discord_provider_write', target: path.split('?')[0], status: outcome === 'applied' ? 'success' : 'error',
      detail: { method: init.method, httpStatus, outcome },
    });
    const uncertainWrite = (httpStatus?: number) => new Error(`Discord may have applied the write${httpStatus ? ` (HTTP ${httpStatus})` : ''}. Verify the target in Discord before retrying.`);
    let response: Response;
    try {
      response = await fetch(`${API}${path}`, { ...init, headers, cache: 'no-store', signal: AbortSignal.timeout(15000) });
    } catch (error) {
      if (!write) throw error;
      auditWrite('unknown');
      throw uncertainWrite();
    }
    if (write) {
      auditWrite(response.ok ? 'applied' : response.status >= 500 ? 'unknown' : 'rejected', response.status);
      if (response.status >= 500) throw uncertainWrite(response.status);
    }
    if (!response.ok) {
      const detail = await response.json().catch(() => ({})) as { code?: number; retry_after?: number };
      throw new Error(`Discord API request failed (${response.status}), code ${typeof detail.code === 'number' ? detail.code : 'unknown'}${response.status === 429 ? `; rate limited, retry after ${Number(detail.retry_after) || 1}s. Write not retried.` : ''}`);
    }
    if (response.status === 204) return undefined as T;
    try {
      const text = await response.text();
      return (text ? JSON.parse(text) : undefined) as T;
    } catch (error) {
      if (!write) throw error;
      throw new Error('Discord accepted the write, but its response could not be read. Verify the result in Discord before retrying.');
    }
  }

  const guildId = encodeURIComponent(config.discordGuildId);
  const json = (body: unknown, method: string, reason?: string): RequestInit => withReason({ method, body: JSON.stringify(body) }, reason);
  const empty = (method: string, reason?: string): RequestInit => withReason({ method }, reason);

  return {
    getGuildMember: (userId) => request(`/guilds/${guildId}/members/${encodeURIComponent(userId)}`),
    getApplication: () => request('/oauth2/applications/@me'),
    sendMessagePayload: (channelId, payload, nonce) => request(`/channels/${encodeURIComponent(channelId)}/messages`, json({ ...payload, ...(nonce ? { nonce, enforce_nonce: true } : {}) }, 'POST')),
    editMessage: (channelId, messageId, payload) => request(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`, json(payload, 'PATCH')),
    crosspostMessage: (channelId, messageId) => request(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}/crosspost`, empty('POST')),
    getGuild: () => request<DiscordGuild>(`/guilds/${guildId}`),
    listGuildChannels: () => request<DiscordChannel[]>(`/guilds/${guildId}/channels`),
    listGuildRoles: () => request<DiscordRole[]>(`/guilds/${guildId}/roles`),
    listGuildWebhooks: async () => (await request<DiscordWebhook[]>(`/guilds/${guildId}/webhooks`)).map(({ id, type, guild_id, channel_id, name, application_id }) => ({ id, type, guild_id, channel_id, name, application_id })),
    listGuildAutomodRules: () => request<DiscordAutomodRule[]>(`/guilds/${guildId}/auto-moderation/rules`),
    getGuildOnboarding: () => request<DiscordOnboarding>(`/guilds/${guildId}/onboarding`),
    recentMessages: (channelId, limit) => request<DiscordMessage[]>(`/channels/${encodeURIComponent(channelId)}/messages?limit=${Math.max(1, Math.min(100, Math.trunc(limit)))}`),
    sendMessage: (channelId, content, allowMassMention = false, nonce) => request<DiscordMessage>(`/channels/${encodeURIComponent(channelId)}/messages`, {
      method: 'POST', body: JSON.stringify({ content, allowed_mentions: { parse: allowMassMention ? ['everyone'] : [] }, ...(nonce ? { nonce, enforce_nonce: true } : {}) }),
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

export async function readDiscordAutomodStatus(config: AppConfig) {
  if (config.discordGuildId !== '976637845542416476') throw new Error('This status check is restricted to the Hynoe Discord guild');
  if (config.discordGuildManagementEnabled !== true) throw new Error('Discord guild management is disabled');
  const rules = await createDiscordClient(config).listGuildAutomodRules().catch(() => {
    // Provider errors may contain fragments of keyword or action metadata.
    throw new Error('Could not read Discord AutoMod rules. Verify the bot has Manage Server permission and Discord is reachable.');
  });
  if (!Array.isArray(rules) || rules.some(rule => rule?.guild_id !== config.discordGuildId)) throw new Error('Discord returned an invalid AutoMod inventory for the configured guild');
  const enabledRules = rules.filter(rule => rule.enabled === true).map(rule => ({
    id: rule.id,
    name: redactSecrets(rule.name, [config.discordBotToken, config.bloomApiKey]) as string,
    eventType: rule.event_type,
    triggerType: rule.trigger_type,
    actionTypes: rule.actions.map(action => action.type),
    exemptChannelIds: rule.exempt_channels,
    exemptRoleIds: rule.exempt_roles,
  }));
  return {
    guildId: config.discordGuildId,
    enabledRules,
    blockingLanguageRulePresent: enabledRules.some(rule => rule.eventType === 1 && [1, 4].includes(rule.triggerType) && rule.actionTypes.includes(1)),
    hasConfiguredExemptions: enabledRules.some(rule => rule.exemptChannelIds.length > 0 || rule.exemptRoleIds.length > 0),
    coverageNote: 'This is a configuration check, not a test of which text is blocked. Members with Administrator or Manage Server permissions are exempt under Discord’s rules.',
  };
}
