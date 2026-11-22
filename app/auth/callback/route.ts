import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth return point (Google sign-in via Supabase).
 *
 * Supabase redirects here with a one-time `code`. We exchange it for a session
 * cookie, then apply the same role gate as password sign-in: only profiles with
 * the `resident` or `admin` role may enter the portal. The role always comes
 * from `profiles.role`, never from the request.
 */

function safeNextPath(value: string | null) {
  if (!value) return null;
  return value.startsWith('/') && !value.startsWith('//') ? value : null;
}

function resolveDestination(role: string, nextPath: string | null) {
  if (nextPath && !(role !== 'admin' && nextPath.startsWith('/admin'))) {
    return nextPath;
  }
  return role === 'admin' ? '/admin' : '/dashboard';
}

function redirectTo(request: NextRequest, path: string) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocal = process.env.NODE_ENV === 'development';
  const base =
    !isLocal && forwardedHost ? `https://${forwardedHost}` : request.nextUrl.origin;
  return NextResponse.redirect(new URL(path, base));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const nextPath = safeNextPath(searchParams.get('next'));

  // The user cancelled on Google's screen, or the provider returned an error.
  if (!code || searchParams.get('error')) {
    return redirectTo(request, '/auth?error=oauth');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error('Google sign-in could not complete:', error?.message);
    return redirectTo(request, '/auth?error=oauth');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'resident')) {
    await supabase.auth.signOut();
    return redirectTo(request, '/auth?error=role');
  }

  return redirectTo(request, resolveDestination(profile.role, nextPath));
}
