function redactString(value: string, secrets: string[]): string {
  let result = value;
  for (const secret of secrets.filter(Boolean)) result = result.split(secret).join('[REDACTED]');
  return result;
}

export function redactSecrets(value: unknown, secrets: string[]): unknown {
  if (typeof value === 'string') return redactString(value, secrets);
  if (value == null || typeof value !== 'object') return value;
  if (value instanceof Error) return { name: value.name, message: redactString(value.message, secrets) };
  if (Array.isArray(value)) return value.map((item) => redactSecrets(item, secrets));
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) output[key] = redactSecrets(item, secrets);
  return output;
}
