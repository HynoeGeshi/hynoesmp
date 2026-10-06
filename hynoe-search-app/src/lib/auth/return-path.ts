const DEFAULT_AUTH_RETURN_PATH = '/command-center';

export function sanitizeAuthReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_AUTH_RETURN_PATH;
  }

  let parsed: URL;
  try {
    parsed = new URL(value, 'https://hynoe.net');
  } catch {
    return DEFAULT_AUTH_RETURN_PATH;
  }

  if (parsed.origin !== 'https://hynoe.net') {
    return DEFAULT_AUTH_RETURN_PATH;
  }

  if (parsed.pathname === '/auth/callback') {
    return DEFAULT_AUTH_RETURN_PATH;
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
