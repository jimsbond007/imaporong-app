import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AppRole = 'resident' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  address: string | null;
  bid_number: string | null;
  is_verified: boolean | null;
  role: string | null;
  age: number | null;
  gender: string | null;
  created_at: string | null;
}

export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null as Profile | null };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, address, bid_number, is_verified, role, age, gender, created_at')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Could not load the signed-in profile:', error.message);
    return { supabase, user, profile: null as Profile | null };
  }

  return { supabase, user, profile: profile as Profile };
});

export async function requireUser(nextPath = '/dashboard') {
  const session = await getCurrentProfile();
  if (!session.user) {
    redirect(`/auth?next=${encodeURIComponent(nextPath)}`);
  }
  return session;
}

/**
 * Resident portal guard. Admins may preview the resident portal.
 * The database policies are the real boundary; this only gives a clean redirect.
 */
export async function requireResident(nextPath = '/dashboard') {
  const session = await requireUser(nextPath);
  const role = session.profile?.role;

  if (role !== 'resident' && role !== 'admin') {
    redirect('/auth?error=role');
  }

  return session;
}

/** Staff portal guard. Non-admins are redirected, never shown a shell. */
export async function requireAdmin(nextPath = '/admin') {
  const session = await requireUser(nextPath);

  if (session.profile?.role !== 'admin') {
    redirect('/dashboard?notice=admin-only');
  }

  return session;
}
