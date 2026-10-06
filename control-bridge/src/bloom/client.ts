import type { AppConfig } from '../config';
import type { BloomBackup, BloomClient, BloomFile, BloomResources, BloomServer, BloomWebsocketCredentials } from './types';
const ACCEPT = 'Application/vnd.pterodactyl.v1+json';
function unwrapAttributes<T>(value: unknown): T {
  if (value && typeof value === 'object' && 'attributes' in value) return (value as { attributes: T }).attributes;
  return value as T;
}
export function createBloomClient(config: AppConfig): BloomClient {
  const base = `${config.bloomPanelUrl}/api/client/servers/${encodeURIComponent(config.bloomServerId)}`;
  async function request(path: string, init: RequestInit = {}, expectText = false): Promise<unknown> {
    const headers = new Headers(init.headers);
    headers.set('authorization', `Bearer ${config.bloomApiKey}`);
    headers.set('accept', ACCEPT);
    if (init.body != null && !headers.has('content-type')) headers.set('content-type', 'application/json');
    const response = await fetch(`${base}${path}`, { ...init, headers, cache: 'no-store' });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Bloom API request failed (${response.status})${detail ? `: ${detail.slice(0, 500)}` : ''}`);
    }
    if (response.status === 204) return undefined;
    if (expectText) return response.text();
    const text = await response.text();
    return text ? JSON.parse(text) : undefined;
  }
  return {
    async getServer() { return unwrapAttributes<BloomServer>(await request('')); },
    async getResources() { return unwrapAttributes<BloomResources>(await request('/resources')); },
    async listFiles(path) {
      const directory = path.startsWith('/') ? path : `/${path}`;
      const json = await request(`/files/list?directory=${encodeURIComponent(directory)}`) as { data?: unknown[] };
      return (json?.data ?? []).map((item) => unwrapAttributes<BloomFile>(item));
    },
    async readFile(path) {
      const file = path.startsWith('/') ? path.slice(1) : path;
      return await request(`/files/contents?file=${encodeURIComponent(file)}`, {}, true) as string;
    },
    async writeFile(path, content) {
      const file = path.startsWith('/') ? path.slice(1) : path;
      await request(`/files/write?file=${encodeURIComponent(file)}`, { method: 'POST', headers: { 'content-type': 'text/plain; charset=utf-8' }, body: content });
    },
    async listBackups() {
      const json = await request('/backups') as { data?: unknown[] };
      return (json?.data ?? []).map((item) => unwrapAttributes<BloomBackup>(item));
    },
    async sendCommand(command) { await request('/command', { method: 'POST', body: JSON.stringify({ command }) }); },
    async setPower(signal) { await request('/power', { method: 'POST', body: JSON.stringify({ signal }) }); },
    async getWebsocketCredentials() {
      const json = await request('/websocket');
      return (json && typeof json === 'object' && 'data' in json ? (json as { data: BloomWebsocketCredentials }).data : json) as BloomWebsocketCredentials;
    },
  };
}
