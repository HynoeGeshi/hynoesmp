import { describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../src/config';
import type { BloomClient } from '../src/bloom/types';
import { createBloomTools } from '../src/tools/bloom';

const config = { bloomServerId: 'srv', bloomApiKey: 'SECRET', discordBotToken: 'DSECRET' } as AppConfig;
const client: BloomClient = {
  getServer: vi.fn(async () => ({ name: 'Hynoe SMP' })),
  getResources: vi.fn(async () => ({ current_state: 'running', resources: { cpu_absolute: 12, memory_bytes: 1024 } })),
  listFiles: vi.fn(async () => []), readFile: vi.fn(async () => 'ok'), writeFile: vi.fn(async () => undefined),
  listBackups: vi.fn(async () => []), sendCommand: vi.fn(async () => undefined), setPower: vi.fn(async () => undefined),
  getWebsocketCredentials: vi.fn(async () => ({ token: 't', socket: 'wss://example.test' })),
};

describe('Bloom tools', () => {
  it('combines server and resources for status', async () => {
    const status = await createBloomTools(config, client).bloom_server_status();
    expect(status).toMatchObject({ name: 'Hynoe SMP', state: 'running', cpuPercent: 12, memoryBytes: 1024 });
  });
  it('blocks unsafe command before provider call', async () => {
    const tools = createBloomTools(config, client);
    await expect(tools.bloom_send_command({ command: 'stop' })).rejects.toThrow();
    expect(client.sendCommand).not.toHaveBeenCalled();
  });
  it('allows safe command and restricted power', async () => {
    const tools = createBloomTools(config, client);
    await tools.bloom_send_command({ command: 'list' });
    await tools.bloom_power({ signal: 'restart' });
    expect(client.sendCommand).toHaveBeenCalledWith('list');
    expect(client.setPower).toHaveBeenCalledWith('restart');
  });
  it('rejects traversal before file provider call', async () => {
    await expect(createBloomTools(config, client).bloom_read_file({ path: '../../etc/passwd' })).rejects.toThrow();
    expect(client.readFile).not.toHaveBeenCalled();
  });
});
