import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * Email verification link handler.
 *
 * The "Confirm signup" email template (see supabase/email-templates) links
 * here with a `token_hash`. Unlike the PKCE `?code=` flow used by Google
 * sign-in, this works even when the resident opens the email on a different
 * phone or browser than the one they registered on.
 *
 * After the token is verified we apply the same role gate as the sign-in form:
 * only profiles with the `resident` or `admin` role may enter the portal.
 */

const ALLOWED_TYPES: EmailOtpType[] = ['signup', 'email', 'magiclink', 'email_change'];

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
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextPath = safeNextPath(searchParams.get('next'));

  if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) {
    return redirectTo(request, '/auth?error=verify');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error || !data.user) {
    console.error('Email verification failed:', error?.message);
    return redirectTo(request, '/auth?error=verify');
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
