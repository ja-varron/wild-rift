import { supabase } from './supabase';

export type OAuthProvider = 'google' | 'github' | 'gitlab' | 'azure' | 'facebook';

export async function signUp(email: string, password: string, metadata?: Record<string, any>) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  } as any);
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
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

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => callback(event, session));
}

export async function updateUser(updates: { email?: string; password?: string; data?: Record<string, any> }) {
  const { data, error } = await supabase.auth.updateUser({
    email: updates.email,
    password: updates.password,
    data: updates.data,
  } as any);
  return { data, error };
}
