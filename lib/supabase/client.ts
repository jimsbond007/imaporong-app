import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client. Session cookies are shared with the server so that
 * `proxy.ts` and server layouts can verify the signed-in user.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.',
    );
  }

  return createBrowserClient(url, anonKey);
}
