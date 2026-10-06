import type { AppConfig } from '../config';

export function assertAllowedServer(serverId: string, config: AppConfig): void {
  if (serverId !== config.bloomServerId) throw new Error('Bloom server is not allowlisted');
}
