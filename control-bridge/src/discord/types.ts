export type DiscordUser = { id: string; username?: string; global_name?: string | null };

export type DiscordPermissionOverwrite = {
  id: string;
  type: 0 | 1;
  allow: string;
  deny: string;
};

export type DiscordChannel = {
  id: string;
  name?: string;
  type: number;
  parent_id?: string | null;
  position?: number;
  topic?: string | null;
  permission_overwrites?: DiscordPermissionOverwrite[];
};

export type DiscordMessage = {
  id: string;
  content?: string;
  timestamp?: string;
  author: DiscordUser;
  channel_id?: string;
  message_reference?: { message_id?: string; channel_id?: string; guild_id?: string };
};

export type DiscordGuild = {
  id: string;
  name?: string;
  description?: string | null;
  owner_id?: string;
  features?: string[];
  system_channel_id?: string | null;
  rules_channel_id?: string | null;
  public_updates_channel_id?: string | null;
};

export type DiscordRole = {
  id: string;
  name: string;
  color?: number;
  hoist?: boolean;
  position?: number;
  permissions?: string;
  managed?: boolean;
  mentionable?: boolean;
};

export type DiscordWebhook = {
  id: string;
  type?: number;
  guild_id?: string | null;
  channel_id?: string | null;
  name?: string | null;
  application_id?: string | null;
};

export type DiscordOnboarding = {
  guild_id?: string;
  prompts?: unknown[];
  default_channel_ids?: string[];
  enabled?: boolean;
  mode?: number;
};

export type DiscordChannelPatch = {
  name?: string;
  type?: number;
  position?: number;
  topic?: string | null;
  parent_id?: string | null;
  nsfw?: boolean;
  rate_limit_per_user?: number;
  permission_overwrites?: DiscordPermissionOverwrite[];
};

export type DiscordRolePatch = {
  name?: string;
  permissions?: string;
  color?: number;
  hoist?: boolean;
  mentionable?: boolean;
  unicode_emoji?: string | null;
  icon?: string | null;
};

export interface DiscordClient {
  getGuild(): Promise<DiscordGuild>;
  listGuildChannels(): Promise<DiscordChannel[]>;
  listGuildRoles(): Promise<DiscordRole[]>;
  listGuildWebhooks(): Promise<DiscordWebhook[]>;
  getGuildOnboarding(): Promise<DiscordOnboarding>;
  recentMessages(channelId: string, limit: number): Promise<DiscordMessage[]>;
  sendMessage(channelId: string, content: string, allowMassMention?: boolean): Promise<DiscordMessage>;
  getCurrentUser(): Promise<DiscordUser>;
  getMessage(channelId: string, messageId: string): Promise<DiscordMessage>;
  deleteMessage(channelId: string, messageId: string): Promise<void>;
  createGuildChannel(patch: DiscordChannelPatch & { name: string }, reason?: string): Promise<DiscordChannel>;
  updateChannel(channelId: string, patch: DiscordChannelPatch, reason?: string): Promise<DiscordChannel>;
  reorderGuildChannels(channels: Array<{ id: string; position?: number; parent_id?: string | null; lock_permissions?: boolean }>, reason?: string): Promise<DiscordChannel[]>;
  deleteChannel(channelId: string, reason?: string): Promise<DiscordChannel | void>;
  createGuildRole(patch: DiscordRolePatch & { name?: string }, reason?: string): Promise<DiscordRole>;
  updateGuildRole(roleId: string, patch: DiscordRolePatch, reason?: string): Promise<DiscordRole>;
  reorderGuildRoles(roles: Array<{ id: string; position: number }>, reason?: string): Promise<DiscordRole[]>;
  deleteGuildRole(roleId: string, reason?: string): Promise<void>;
  putChannelPermission(channelId: string, overwriteId: string, overwrite: Omit<DiscordPermissionOverwrite, 'id'>, reason?: string): Promise<void>;
  deleteChannelPermission(channelId: string, overwriteId: string, reason?: string): Promise<void>;
  timeoutGuildMember(userId: string, until: string | null, reason?: string): Promise<unknown>;
  kickGuildMember(userId: string, reason?: string): Promise<void>;
  banGuildMember(userId: string, reason?: string): Promise<void>;
  unbanGuildMember(userId: string, reason?: string): Promise<void>;
  addGuildMemberRole(userId: string, roleId: string, reason?: string): Promise<void>;
  removeGuildMemberRole(userId: string, roleId: string, reason?: string): Promise<void>;
  bulkDeleteMessages(channelId: string, messageIds: string[], reason?: string): Promise<void>;
  deleteWebhook(webhookId: string, reason?: string): Promise<void>;
}
