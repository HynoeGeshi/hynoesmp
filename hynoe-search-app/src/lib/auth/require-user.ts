import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requireUser() {
  const user = await (async () => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getUser();
      return error ? null : data.user;
    } catch {
      // Fail closed without exposing provider/configuration errors to the browser.
      return null;
    }
  })();
  // Keep redirects outside the try block so Next's redirect signal is not swallowed.
  if (!user || user.is_anonymous) redirect('/sign-in');
  return user;
}
