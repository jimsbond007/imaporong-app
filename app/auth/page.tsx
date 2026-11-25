import type { Metadata } from 'next';
import { AuthForm } from './AuthForm';

export const metadata: Metadata = {
  title: 'Resident access',
  description:
    'Sign in to the iMaporong resident portal or register a new resident account with Barangay Maporong, Oas, Albay.',
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthForm
      initialMode={params.mode === 'register' ? 'register' : 'login'}
      roleError={params.error === 'role'}
      oauthError={params.error === 'oauth'}
      verifyError={params.error === 'verify'}
      nextPath={params.next ?? null}
    />
  );
}
