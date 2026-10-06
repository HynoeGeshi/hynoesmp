import { NextResponse } from 'next/server';
import { confirmPasswordlessSignIn } from '@/lib/auth/confirm-passwordless';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await confirmPasswordlessSignIn({
    tokenHash: url.searchParams.get('token_hash'),
    type: url.searchParams.get('type'),
    code: url.searchParams.get('code'),
    returnPath: url.searchParams.get('next'),
  });

  return NextResponse.redirect(new URL(result.redirectPath, url.origin));
}
