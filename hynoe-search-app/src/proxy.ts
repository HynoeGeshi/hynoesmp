import { NextResponse, type NextRequest } from 'next/server';
import { resolveHostRoute } from '@/lib/host-routing';
import { refreshAuthSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  const decision = resolveHostRoute(request.headers.get('host') ?? '', request.nextUrl.pathname);

  if (decision.action === 'rewrite') {
    return NextResponse.rewrite(new URL(decision.pathname, request.url));
  }

  if (decision.action !== 'next') {
    return new NextResponse('Unknown host', { status: 421 });
  }

  return refreshAuthSession(request, NextResponse.next({ request }));
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
