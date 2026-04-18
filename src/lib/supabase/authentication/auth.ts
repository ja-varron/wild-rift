import { supabase } from '../supabase';

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

// export function onAuthStateChange(callback: (event: string, session: any) => void) {
//   return supabase.auth.onAuthStateChange((event, session) => callback(event, session));
// }

// export async function updateUser(updates: { email?: string; password?: string; data?: Record<string, any> }) {
//   const { data, error } = await supabase.auth.updateUser({
//     email: updates.email,
//     password: updates.password,
//     data: updates.data,
//   } as any);
//   return { data, error };
// }


// Sign up an account for student and instructor by admin for a specific role
export async function adminSignUp(
  email: string,
  password: string,
  profile?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    role?: string;
    prcExamType?: string;
  },
) {
  return await createUserViaBackend(email, password, profile);
}

// Call backend API to create user with admin privileges
async function createUserViaBackend(
  email: string,
  password: string,
  profile?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    role?: string;
    prcExamType?: string;
  },
) {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const response = await fetch(`${backendUrl}/api/auth/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        firstName: profile?.firstName ?? "",
        middleName: profile?.middleName ?? "",
        lastName: profile?.lastName ?? "",
        role: profile?.role ?? "Student",
        prcExamType: profile?.prcExamType ?? "",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error = {
        message: errorData.error || `Failed to create user (${response.status})`,
        status: response.status,
      };
      console.error('Error creating user:', error);
      return { data: null, error };
    }

    const raw = await response.json();

    // Normalize backend payload to mirror Supabase auth shape expected by callers.
    const data = {
      ...raw,
      user: raw?.user ?? {
        id: raw?.user_id,
        email: raw?.email ?? email,
      },
    };

    return { data, error: null };
  } catch (err) {
    const error = {
      message: err instanceof Error ? err.message : 'Unknown error creating user',
    };
    console.error('Error creating user:', error);
    return { data: null, error };
  }
}
