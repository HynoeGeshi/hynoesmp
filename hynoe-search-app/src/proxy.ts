import { NextResponse, type NextRequest } from 'next/server';
import { resolveHostRoute } from '@/lib/host-routing';
export function proxy(request: NextRequest) {
  const decision = resolveHostRoute(request.headers.get('host') ?? '', request.nextUrl.pathname);
  if (decision.action === 'next') return NextResponse.next();
  if (decision.action === 'rewrite') return NextResponse.rewrite(new URL(decision.pathname, request.url));
  return new NextResponse('Unknown host', { status: 421 });
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
