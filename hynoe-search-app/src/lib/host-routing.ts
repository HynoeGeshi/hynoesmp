export type HostRouteDecision = { action: 'next' } | { action: 'rewrite'; pathname: string } | { action: 'reject' };
export function resolveHostRoute(host: string, pathname: string): HostRouteDecision {
  const hostname = host.toLowerCase().split(':')[0];
  if (hostname === 'outpost.hynoe.net') return { action: 'rewrite', pathname: pathname === '/' ? '/p/hynoe-outpost' : pathname };
  if (
    hostname === 'hynoe.net' ||
    hostname === 'www.hynoe.net' ||
    hostname === 'hynoe-search.onrender.com' ||
    hostname === 'hynoe-search-direct.onrender.com' ||
    hostname.endsWith('.vercel.app') ||
    hostname === 'localhost'
  ) return { action: 'next' };
  if (hostname === 'hynoesmp.com' || hostname === 'www.hynoesmp.com' || hostname === 'hynoeflicks.com' || hostname === 'www.hynoeflicks.com') return { action: 'reject' };
  return { action: 'reject' };
}
