import WebSocket from 'ws';
import type { BloomClient } from './types';

export async function readRecentConsole(client: BloomClient, options: { maxLines?: number; timeoutMs?: number } = {}): Promise<string[]> {
  const { maxLines = 100, timeoutMs = 1600 } = options;
  const credentials = await client.getWebsocketCredentials();
  return await new Promise<string[]>((resolve, reject) => {
    const lines: string[] = [];
    const socket = new WebSocket(credentials.socket, { handshakeTimeout: Math.min(timeoutMs, 1500) });
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      try { socket.close(); } catch {}
      resolve(lines.slice(-maxLines));
    };
    const timer = setTimeout(finish, timeoutMs);
    socket.on('open', () => socket.send(JSON.stringify({ event: 'auth', args: [credentials.token] })));
    socket.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString()) as { event?: string; args?: unknown[] };
        if (message.event === 'auth success') socket.send(JSON.stringify({ event: 'send logs', args: [null] }));
        if (message.event === 'console output' && typeof message.args?.[0] === 'string') {
          lines.push(...message.args[0].split(/\r?\n/).filter(Boolean));
          if (lines.length >= maxLines) finish();
        }
      } catch {}
    });
    socket.on('error', (error) => {
      clearTimeout(timer);
      if (lines.length) finish();
      else if (!settled) { settled = true; reject(error); }
    });
    socket.on('close', () => { clearTimeout(timer); finish(); });
  });
}
