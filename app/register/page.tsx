import { permanentRedirect } from 'next/navigation';

/**
 * Legacy prototype route.
 *
 * The old screen inserted directly into `profiles`, bypassing Supabase Auth.
 * Registration now happens in /auth, which creates a real auth user and lets
 * the database trigger create the matching resident profile.
 */
export default function LegacyRegisterPage() {
  permanentRedirect('/auth?mode=register');
}
