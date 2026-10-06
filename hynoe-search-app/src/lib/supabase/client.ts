import { createBrowserClient } from '@supabase/ssr';
import { readPublicSupabaseEnv } from './env';

export function createBrowserSupabaseClient() {
  const { url, publishableKey } = readPublicSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}
