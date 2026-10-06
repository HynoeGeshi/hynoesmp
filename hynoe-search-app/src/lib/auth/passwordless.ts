import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sanitizeAuthReturnPath } from './return-path';

type RequestPasswordlessSignInInput = {
  email: string;
  returnPath?: string | null;
  origin: string;
};

type PasswordlessSignInResult = {
  ok: boolean;
  message: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requestPasswordlessSignIn({
  email,
  returnPath,
  origin,
}: RequestPasswordlessSignInInput): Promise<PasswordlessSignInResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return {
      ok: false,
      message: 'Enter a valid email address.',
    };
  }

  const safeReturnPath = sanitizeAuthReturnPath(returnPath);
  const redirectUrl = new URL('/auth/confirm', origin);
  redirectUrl.searchParams.set('next', safeReturnPath);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: redirectUrl.toString(),
    },
  });

  if (error) {
    return {
      ok: false,
      message: 'We could not send a sign-in link. Try again in a moment.',
    };
  }

  return {
    ok: true,
    message: 'Check your email for your secure Hynoe sign-in link.',
  };
}
