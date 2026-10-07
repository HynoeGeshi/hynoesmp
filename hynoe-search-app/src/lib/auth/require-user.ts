import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || data.user.is_anonymous) redirect('/sign-in');
  return data.user;
}
