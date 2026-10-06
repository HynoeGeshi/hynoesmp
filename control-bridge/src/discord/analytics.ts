import type { DiscordMessage } from './types';

export type DiscordChannelActivityInput = {
  channelId: string;
  channelName?: string;
  messages: DiscordMessage[];
};

export type DiscordActivitySummary = {
  totalMessages: number;
  totalReplies: number;
  channels: Array<{
    channelId: string;
    channelName?: string;
    messageCount: number;
    replyCount: number;
    lastMessageAt?: string;
  }>;
};

export function summarizeDiscordActivity(input: { channels: DiscordChannelActivityInput[] }): DiscordActivitySummary {
  const channels = input.channels.map((channel) => {
    const replyCount = channel.messages.filter((message) => Boolean(message.message_reference?.message_id)).length;
    const lastMessageAt = channel.messages
      .map((message) => message.timestamp)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1);
    return {
      channelId: channel.channelId,
      channelName: channel.channelName,
      messageCount: channel.messages.length,
      replyCount,
      ...(lastMessageAt ? { lastMessageAt } : {}),
    };
  }).sort((a, b) => b.messageCount - a.messageCount || b.replyCount - a.replyCount || a.channelId.localeCompare(b.channelId));

  return {
    totalMessages: channels.reduce((sum, channel) => sum + channel.messageCount, 0),
    totalReplies: channels.reduce((sum, channel) => sum + channel.replyCount, 0),
    channels,
  };
}
