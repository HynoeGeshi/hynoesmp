import type { EmailOtpType } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sanitizeAuthReturnPath } from './return-path';

type ConfirmPasswordlessSignInInput = {
  tokenHash: string | null;
  type: string | null;
  code: string | null;
  returnPath?: string | null;
};

type ConfirmPasswordlessSignInResult = {
  ok: boolean;
  redirectPath: string;
};

const FAILURE_REDIRECT = '/sign-in?error=invalid-link';

export async function confirmPasswordlessSignIn({
  tokenHash,
  type,
  code,
  returnPath,
}: ConfirmPasswordlessSignInInput): Promise<ConfirmPasswordlessSignInResult> {
  const redirectPath = sanitizeAuthReturnPath(returnPath);

  if (tokenHash && type !== 'email') {
    return { ok: false, redirectPath: FAILURE_REDIRECT };
  }

  if (!tokenHash && !code) {
    return { ok: false, redirectPath: FAILURE_REDIRECT };
  }

  const supabase = await createServerSupabaseClient();

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'email' as EmailOtpType,
    });

    if (error) {
      return { ok: false, redirectPath: FAILURE_REDIRECT };
    }

    return { ok: true, redirectPath };
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code!);

  if (error) {
    return { ok: false, redirectPath: FAILURE_REDIRECT };
  }

  return { ok: true, redirectPath };
}
