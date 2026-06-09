import { supabase, supabaseAdmin } from '../supabase';

export type OAuthProvider = 'google' | 'github' | 'gitlab' | 'azure' | 'facebook';

function getRolePath(role: string | null | undefined): string {
  const normalized = role?.toLowerCase();
  if (normalized === 'admin') return '/admin';
  if (normalized === 'instructor') return '/instructor';
  return '/student';
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) {
    console.error('Error signing up:', error);
    return { data: null, error };
  }

  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      data,
      error: {
        message: `[Supabase Auth] ${error.message}`,
      },
    };
  }

  const accessToken = data?.session?.access_token;
  if (!accessToken) {
    await supabase.auth.signOut();
    return {
      data: null,
      error: {
        message: '[Supabase Auth] Session is missing an access token after sign-in.',
      },
    };
  }

  const userId = data?.user?.id;
  const forcePasswordChange = data?.user?.user_metadata?.force_password_change === true;
  if (!userId) {
    return {
      data,
      error: null,
      redirectTo: forcePasswordChange ? '/force-password-change' : '/student',
    };
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    data,
    error: null,
    redirectTo: forcePasswordChange ? '/force-password-change' : getRolePath(profileData?.role),
  };
}

export async function signInWithProvider(provider: OAuthProvider) {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

export async function sendPasswordReset(email: string, redirectTo?: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo ?? window.location.origin + '/reset-password',
  });
  return { data, error };
}

// Sign up an account for student or instructor on behalf of an admin.
// Uses the supabaseAdmin client (service role key) so:
//   - Email confirmation is skipped automatically.
//   - The logged-in admin's own session is never touched.
//   - No Edge Function or external server is required.
export async function adminSignUp(
  email: string,
  password: string,
  profile?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    role?: string;
  },
) {
  if (!supabaseAdmin) {
    return {
      data: null,
      error: new Error(
        'Admin client is not configured. Add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env.local.',
      ),
    };
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: profile?.firstName ?? '',
      middle_name: profile?.middleName ?? '',
      last_name: profile?.lastName ?? '',
      role: profile?.role ?? 'Student'
    },
  });

  if (error) {
    console.error('Error creating user:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

