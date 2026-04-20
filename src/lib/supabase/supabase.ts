import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY);

if (!isSupabaseConfigured) {
  console.warn('Missing Supabase env vars: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_SERVICE_ROLE_KEY');
}

// Standard client — uses the anon key, respects RLS, tied to the user session.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client — uses the service role key to bypass RLS for privileged operations
// such as creating user accounts. It is a SEPARATE instance from `supabase` so it
// NEVER touches the logged-in admin's session.
//
// ⚠️  The service role key is embedded in the client bundle because this is a
//     Vite app. Keep this acceptable only for internal/admin-only deployments.
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
