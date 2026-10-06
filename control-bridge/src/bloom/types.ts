export type BloomServer = { name?: string; identifier?: string; uuid?: string; [key: string]: unknown };
export type BloomResources = { current_state?: string; resources?: { cpu_absolute?: number; memory_bytes?: number; disk_bytes?: number; network_rx_bytes?: number; network_tx_bytes?: number; [key: string]: unknown }; [key: string]: unknown };
export type BloomFile = { name?: string; mode?: string; size?: number; is_file?: boolean; is_symlink?: boolean; [key: string]: unknown };
export type BloomBackup = { uuid?: string; name?: string; bytes?: number; is_successful?: boolean; created_at?: string; completed_at?: string; [key: string]: unknown };
export type BloomWebsocketCredentials = { token: string; socket: string };
export interface BloomClient {
  getServer(): Promise<BloomServer>;
  getResources(): Promise<BloomResources>;
  listFiles(path: string): Promise<BloomFile[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  listBackups(): Promise<BloomBackup[]>;
  sendCommand(command: string): Promise<void>;
  setPower(signal: 'start' | 'stop' | 'restart'): Promise<void>;
  getWebsocketCredentials(): Promise<BloomWebsocketCredentials>;
}
