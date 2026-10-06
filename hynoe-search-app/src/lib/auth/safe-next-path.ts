export function safeNextPath(value: string | null, fallback = '/command-center') {
  if (!value) return fallback;
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//')) return fallback;
  if (value.includes('://')) return fallback;
  return value;
}
