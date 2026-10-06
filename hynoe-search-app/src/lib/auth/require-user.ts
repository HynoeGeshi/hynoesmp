import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sanitizeAuthReturnPath } from './return-path';

export type AuthenticatedUser = {
  id: string;
  email: string | null;
};

export async function requireUser(
  returnPath = '/command-center',
): Promise<AuthenticatedUser> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const id = typeof claims?.sub === 'string' ? claims.sub : null;
  const email = claims && typeof claims.email === 'string' ? claims.email : null;

  if (error || !id) {
    const safeReturnPath = sanitizeAuthReturnPath(returnPath);
    redirect(`/sign-in?next=${encodeURIComponent(safeReturnPath)}`);
  }

  return { id, email };
}
