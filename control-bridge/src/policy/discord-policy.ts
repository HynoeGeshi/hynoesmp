import type { AppConfig } from '../config';

export function assertAllowedChannel(channelId: string, config: AppConfig): void {
  if (!config.discordAllowedChannelIds.includes(channelId)) throw new Error('Discord channel is not allowlisted');
}
