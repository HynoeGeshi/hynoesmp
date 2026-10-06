export type DiscordUser = { id: string; username?: string; global_name?: string | null };
export type DiscordChannel = { id: string; name?: string; type: number; parent_id?: string | null };
export type DiscordMessage = { id: string; content?: string; timestamp?: string; author: DiscordUser; channel_id?: string };
export interface DiscordClient {
  listGuildChannels(): Promise<DiscordChannel[]>;
  recentMessages(channelId: string, limit: number): Promise<DiscordMessage[]>;
  sendMessage(channelId: string, content: string, allowMassMention?: boolean): Promise<DiscordMessage>;
  getCurrentUser(): Promise<DiscordUser>;
  getMessage(channelId: string, messageId: string): Promise<DiscordMessage>;
  deleteMessage(channelId: string, messageId: string): Promise<void>;
}
