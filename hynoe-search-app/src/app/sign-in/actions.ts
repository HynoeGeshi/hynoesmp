'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function siteOrigin(host: string | null, proto: string | null) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (!host) return 'http://localhost:3000';
  return `${proto === 'http' ? 'http' : 'https'}://${host}`;
}

export async function requestMagicLink(formData: FormData) {
  const rawEmail = formData.get('email');
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
  if (!email || email.length > 320 || !email.includes('@')) redirect('/sign-in?error=invalid_email');

  const requestHeaders = await headers();
  const origin = siteOrigin(
    requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host'),
    requestHeaders.get('x-forwarded-proto'),
  );

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/command-center` },
  });

  if (error) redirect('/sign-in?error=send_failed');
  redirect('/sign-in?sent=1');
}
