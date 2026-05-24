import { createSupabaseServer } from "./server";

/**
 * Sign in anonymously. Returns the session for a new guest user.
 * The resulting auth.users row has is_anonymous=true, which is mirrored
 * to our users.is_guest column via a Postgres trigger.
 */
export async function signInAnonymously() {
  const supabase = await createSupabaseServer();
  return supabase.auth.signInAnonymously();
}

/**
 * Upgrade a guest session to a full account via magic link.
 * Supabase's linkIdentity preserves the user's auth.users.id so all
 * associated data (lessons, SRS, etc.) is retained automatically.
 */
export async function sendMagicLink(email: string) {
  const supabase = await createSupabaseServer();
  return supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
}

/**
 * Get the current session without throwing if unauthenticated.
 */
export async function getSession() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

/**
 * Get the current user or null.
 */
export async function getUser() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  return supabase.auth.signOut();
}
