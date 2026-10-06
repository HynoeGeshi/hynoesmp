import path from 'node:path';

const MAX_PATH_LENGTH = 512;
const ALLOWED_ROOT_FILES = new Set([
  'server.properties', 'bukkit.yml', 'spigot.yml', 'permissions.yml', 'ops.json', 'whitelist.json',
]);
const ALLOWED_PREFIXES = ['config/', 'datapacks/', 'plugins/'];
const DENIED_BINARY_EXTENSIONS = new Set([
  '.jar', '.zip', '.exe', '.dll', '.so', '.class', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp3', '.mp4', '.dat', '.mca', '.mcr', '.nbt',
]);

function repeatedDecode(input: string): string {
  let current = input;
  for (let i = 0; i < 3; i += 1) {
    let next: string;
    try { next = decodeURIComponent(current); } catch { throw new Error('Invalid encoded file path'); }
    if (next === current) break;
    current = next;
  }
  return current;
}

export function normalizeAllowedFilePath(input: string): string {
  if (!input || input.length > MAX_PATH_LENGTH || input.includes('\0')) throw new Error('Unsafe file path');
  const decoded = repeatedDecode(input).replace(/\\/g, '/');
  const rawSegments = decoded.split('/').filter(Boolean);
  if (rawSegments.some((segment) => segment === '..' || segment === '.')) throw new Error('Path traversal is not allowed');

  const normalized = path.posix.normalize(`/${decoded}`).replace(/^\/+/, '');
  if (!normalized || normalized.startsWith('../') || normalized.includes('/../')) throw new Error('Path traversal is not allowed');
  if (normalized.startsWith('etc/') || normalized.startsWith('proc/') || normalized.startsWith('sys/') || normalized.startsWith('dev/')) {
    throw new Error('System paths are not allowed');
  }

  const ext = path.posix.extname(normalized).toLowerCase();
  if (DENIED_BINARY_EXTENSIONS.has(ext)) throw new Error('Binary files are not allowed');

  const allowed = ALLOWED_ROOT_FILES.has(normalized) || ALLOWED_PREFIXES.some((prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix));
  if (!allowed) throw new Error('File path is outside the approved server directories');
  return normalized;
}
