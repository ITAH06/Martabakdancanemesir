import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data && data.session ? data.session : null;
}

/* Role dicek dari database, bukan dari klaim browser. */
export async function isAdmin() {
  const session = await getSession();
  if (!session || !session.user) return false;

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  return !error && !!data && data.role === 'admin';
}
