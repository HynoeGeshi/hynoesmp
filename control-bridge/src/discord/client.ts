import type { AppConfig } from '../config';
import type { DiscordChannel, DiscordClient, DiscordMessage, DiscordUser } from './types';

const API = 'https://discord.com/api/v10';
export function createDiscordClient(config: AppConfig): DiscordClient {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('authorization', `Bot ${config.discordBotToken}`);
    headers.set('accept', 'application/json');
    if (init.body != null) headers.set('content-type', 'application/json');
    const response = await fetch(`${API}${path}`, { ...init, headers, cache: 'no-store' });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Discord API request failed (${response.status})${detail ? `: ${detail.slice(0, 500)}` : ''}`);
    }
    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  }
  return {
    listGuildChannels: () => request<DiscordChannel[]>(`/guilds/${encodeURIComponent(config.discordGuildId)}/channels`),
    recentMessages: (channelId, limit) => request<DiscordMessage[]>(`/channels/${encodeURIComponent(channelId)}/messages?limit=${Math.max(1, Math.min(100, Math.trunc(limit)))}`),
    sendMessage: (channelId, content, allowMassMention = false) => request<DiscordMessage>(`/channels/${encodeURIComponent(channelId)}/messages`, {
      method: 'POST', body: JSON.stringify({ content, allowed_mentions: { parse: allowMassMention ? ['everyone'] : [] } }),
    }),
    getCurrentUser: () => request<DiscordUser>('/users/@me'),
    getMessage: (channelId, messageId) => request<DiscordMessage>(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`),
    deleteMessage: (channelId, messageId) => request<void>(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' }),
  };
}
