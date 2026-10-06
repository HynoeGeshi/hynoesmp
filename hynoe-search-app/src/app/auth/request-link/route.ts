import { NextResponse } from 'next/server';
import { requestPasswordlessSignIn } from '@/lib/auth/passwordless';
import { sanitizeAuthReturnPath } from '@/lib/auth/return-path';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const formData = await request.formData();
  const emailValue = formData.get('email');
  const nextValue = formData.get('next');
  const email = typeof emailValue === 'string' ? emailValue : '';
  const returnPath = sanitizeAuthReturnPath(typeof nextValue === 'string' ? nextValue : null);

  const result = await requestPasswordlessSignIn({
    email,
    returnPath,
    origin: url.origin,
  });

  const redirect = new URL('/sign-in', url.origin);
  redirect.searchParams.set(result.ok ? 'sent' : 'error', result.ok ? '1' : 'send-failed');
  redirect.searchParams.set('next', returnPath);

  return NextResponse.redirect(redirect, 303);
}
