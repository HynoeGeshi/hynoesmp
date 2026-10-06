import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { readPublicSupabaseEnv } from './env';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = readPublicSupabaseEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. The request proxy
          // handles refresh writes when this utility is used for reads.
        }
      },
    },
  });
}
