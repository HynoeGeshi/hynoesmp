const POWER_SIGNALS = new Set(['start', 'stop', 'restart']);
const BLOCKED_GENERIC_COMMANDS = new Set(['stop', 'restart', 'kill']);
const HOST_ESCAPE_PATTERNS = [
  /&&/, /\|\|/, /`/, /\$\(/, /\b(?:bash|powershell|cmd\.exe|wget|curl)\b/i, /\/bin\//i,
];

export function assertAllowedCommand(command: string): void {
  const value = command.trim().replace(/^\//, '');
  if (!value || value.length > 512) throw new Error('Invalid Minecraft command');
  if (/[\r\n\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw new Error('Control characters are not allowed');
  const verb = value.split(/\s+/, 1)[0].toLowerCase();
  if (BLOCKED_GENERIC_COMMANDS.has(verb)) throw new Error('Power commands must use the dedicated power tool');
  if (HOST_ESCAPE_PATTERNS.some((pattern) => pattern.test(value))) throw new Error('Host/shell escape pattern is not allowed');
}

export function assertAllowedPowerSignal(signal: string): asserts signal is 'start' | 'stop' | 'restart' {
  if (!POWER_SIGNALS.has(signal)) throw new Error('Unsupported power signal');
}
