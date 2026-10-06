import type { AppConfig } from '../config';
import { createBloomClient } from '../bloom/client';
import { readRecentConsole } from '../bloom/console';
import type { BloomClient } from '../bloom/types';
import { assertAllowedCommand, assertAllowedPowerSignal } from '../policy/command-policy';
import { normalizeAllowedFilePath } from '../policy/file-policy';

export function createBloomTools(config: AppConfig, client: BloomClient = createBloomClient(config)) {
  return {
    async bloom_server_status() {
      const [server, resources] = await Promise.all([client.getServer(), client.getResources()]);
      return {
        name: server.name,
        state: resources.current_state,
        cpuPercent: resources.resources?.cpu_absolute,
        memoryBytes: resources.resources?.memory_bytes,
        diskBytes: resources.resources?.disk_bytes,
        networkRxBytes: resources.resources?.network_rx_bytes,
        networkTxBytes: resources.resources?.network_tx_bytes,
      };
    },
    async bloom_recent_console({ maxLines = 100 }: { maxLines?: number } = {}) {
      const safeMax = Math.max(1, Math.min(100, Math.trunc(maxLines)));
      return { lines: await readRecentConsole(client, { maxLines: safeMax }) };
    },
    async bloom_send_command({ command }: { command: string }) {
      assertAllowedCommand(command);
      const normalized = command.trim().replace(/^\//, '');
      await client.sendCommand(normalized);
      return { ok: true, command: normalized };
    },
    async bloom_power({ signal }: { signal: string }) {
      assertAllowedPowerSignal(signal);
      await client.setPower(signal);
      return { ok: true, signal };
    },
    async bloom_list_files({ path = '/config' }: { path?: string } = {}) {
      const normalized = normalizeAllowedFilePath(path);
      return { path: normalized, files: await client.listFiles(normalized) };
    },
    async bloom_read_file({ path }: { path: string }) {
      const normalized = normalizeAllowedFilePath(path);
      const content = await client.readFile(normalized);
      if (content.length > 512_000) throw new Error('File is too large to return safely');
      return { path: normalized, content };
    },
    async bloom_write_file({ path, content }: { path: string; content: string }) {
      const normalized = normalizeAllowedFilePath(path);
      if (content.length > 512_000) throw new Error('File is too large to write safely');
      await client.writeFile(normalized, content);
      return { ok: true, path: normalized, bytes: Buffer.byteLength(content, 'utf8') };
    },
    async bloom_list_backups() {
      return { backups: await client.listBackups() };
    },
  };
}
