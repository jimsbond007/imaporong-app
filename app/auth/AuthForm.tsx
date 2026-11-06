'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase';
import { buttonClasses } from '@/components/ui/Button';
import { PixelBackdrop } from '@/components/portal/PixelBackdrop';
import {
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
} from '@/components/ui/icons';
import imapMark from '@/assets/illustrations/imap.svg';

type Mode = 'login' | 'register';

function safeNextPath(value: string | null) {
  if (!value) return null;
  return value.startsWith('/') && !value.startsWith('//') ? value : null;
}

export function AuthForm({
  initialMode = 'login',
  roleError = false,
  nextPath = null,
}: {
  initialMode?: Mode;
  roleError?: boolean;
  nextPath?: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(
    roleError
      ? {
          type: 'error',
          message:
            'This account does not have an authorized portal role. Please contact the barangay administrator.',
        }
      : null,
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  const resetNoticeOnModeChange = (next: Mode) => {
    setMode(next);
    setNotice(null);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setNotice({ type: 'error', message: error.message });
      setLoading(false);
      return;
    }

    if (!data.user) {
      setNotice({ type: 'error', message: 'Sign in did not return a user. Please try again.' });
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setNotice({
        type: 'error',
        message:
          'Your account role could not be verified. Please contact the barangay administrator.',
      });
      setLoading(false);
      return;
    }

    if (profile.role !== 'admin' && profile.role !== 'resident') {
      await supabase.auth.signOut();
      setNotice({
        type: 'error',
        message: 'This account does not have an authorized portal role.',
      });
      setLoading(false);
      return;
    }

    const destination = resolveDestination(profile.role, safeNextPath(nextPath));
    router.replace(destination);
    router.refresh();
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    const parsedAge = age.trim() ? Number(age) : null;
    if (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 120)) {
      setNotice({ type: 'error', message: 'Enter a valid age between 0 and 120.' });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setNotice({ type: 'error', message: 'Use at least 6 characters for your password.' });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          address: address.trim(),
          age: parsedAge,
          gender,
        },
      },
    });

    if (error) {
      setNotice({ type: 'error', message: error.message });
      setLoading(false);
      return;
    }

    // The database trigger creates the resident profile from the metadata above.
    // This fallback also covers projects that have not applied that migration yet.
    if (data.user && data.session) {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          full_name: fullName.trim(),
          address: address.trim(),
          age: parsedAge,
          gender,
          role: 'resident',
          is_verified: false,
        },
        { onConflict: 'id', ignoreDuplicates: true },
      );

      if (profileError) {
        console.error('Could not save the new resident profile:', profileError);
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          console.error('Could not sign out after profile creation failed:', signOutError);
        }
        setLoading(false);
        setNotice({
          type: 'error',
          message: `Your account was created, but its resident record could not be saved. ${profileError.message}`,
        });
        return;
      }

      router.replace('/dashboard');
      router.refresh();
      return;
    }

    setMode('login');
    setPassword('');
    setLoading(false);
    setNotice({
      type: 'success',
      message:
        'Account created. Check your email to confirm your address, then sign in here.',
    });
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cream">
      <PixelBackdrop />
      <section className="relative z-10 flex min-h-screen flex-col items-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto my-auto w-full max-w-lg">
          <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border-2 border-line bg-cream/95 px-4 py-3 shadow-subtle sm:mb-5">
            <Link href="/" className="inline-flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-line bg-white p-1">
                <Image
                  src={imapMark}
                  alt="iMaporong"
                  priority
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-base font-bold text-forest">
                  iMaporong
                </span>
                <span className="block text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted">
                  Barangay Maporong
                </span>
              </span>
            </Link>
            <Link
              href="/"
              className="shrink-0 text-sm font-bold text-pine underline-offset-4 hover:underline"
            >
              Back to home
            </Link>
          </div>

          <div className="rounded-[24px] border-2 border-earth/20 bg-cream p-5 shadow-raised sm:p-8">
            <div className="mb-5">
              <p className="eyebrow">{mode === 'login' ? 'Resident access' : 'New account'}</p>
              <h2 className="heading-2 mt-1.5">
                {mode === 'login' ? 'Welcome back' : 'Register as a resident'}
              </h2>
              <p className="body-sm mt-1.5">
                {mode === 'login'
                  ? 'Use the email address connected to your barangay record.'
                  : 'Barangay staff verify new resident records before an ID is issued.'}
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Account access"
              className="mb-5 grid grid-cols-2 gap-1 rounded-xl border-2 border-line bg-mist p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => resetNoticeOnModeChange('login')}
                className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                  mode === 'login'
                    ? 'bg-white text-forest shadow-subtle'
                    : 'text-muted hover:text-forest'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => resetNoticeOnModeChange('register')}
                className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                  mode === 'register'
                    ? 'bg-white text-forest shadow-subtle'
                    : 'text-muted hover:text-forest'
                }`}
              >
                Register
              </button>
            </div>

            <p className="mb-5 rounded-xl border-2 border-line bg-white px-3.5 py-3 text-xs leading-relaxed text-muted">
              {mode === 'login'
                ? 'Staff accounts with administrator access open the staff workspace automatically. For security, account roles cannot be changed from this sign-in page.'
                : 'New registrations receive resident access. An existing administrator must grant staff access to an account.'}
            </p>

            {notice && (
              <div
                role={notice.type === 'error' ? 'alert' : 'status'}
                className={`mb-5 rounded-2xl border p-3.5 text-sm font-semibold leading-relaxed ${
                  notice.type === 'error'
                    ? 'border-[#f1cccc] bg-rejected-bg text-rejected-ink'
                    : 'border-[#c4e3d5] bg-mint text-pine'
                }`}
              >
                {notice.message}
              </div>
            )}

            <form
              onSubmit={mode === 'login' ? handleLogin : handleRegister}
              className="space-y-3 sm:space-y-4"
            >
              {mode === 'register' && (
                <>
                  <Field label="Full name" htmlFor="full-name">
                    <input
                      id="full-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Juana Dela Cruz"
                      className="input-base"
                    />
                  </Field>

                  <Field label="Home address" htmlFor="address" hint="Include your purok if known.">
                    <input
                      id="address"
                      type="text"
                      required
                      autoComplete="street-address"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Purok 1, Barangay Maporong"
                      className="input-base"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Age" htmlFor="age">
                      <input
                        id="age"
                        type="number"
                        min={0}
                        max={120}
                        required
                        value={age}
                        onChange={(event) => setAge(event.target.value)}
                        className="input-base"
                      />
                    </Field>
                    <Field label="Gender" htmlFor="gender">
                      <select
                        id="gender"
                        required
                        value={gender}
                        onChange={(event) => setGender(event.target.value)}
                        className="input-base"
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </Field>
                  </div>
                </>
              )}

              <Field label="Email address" htmlFor="email">
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="input-base"
                />
              </Field>

              <Field
                label="Password"
                htmlFor="password"
                hint={mode === 'register' ? 'At least 6 characters.' : undefined}
              >
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="input-base pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition hover:text-pine"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </Field>

              <button
                type="submit"
                disabled={loading}
                className={buttonClasses('primary', 'lg', 'mt-2 w-full')}
              >
                {loading ? (
                  'Please wait…'
                ) : mode === 'login' ? (
                  <>
                    Sign in <ArrowRightIcon className="h-4 w-4" />
                  </>
                ) : (
                  'Create resident account'
                )}
              </button>
            </form>

            <p className="body-sm mt-4 flex items-start gap-2">
              <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-pine" />
              Accounts are protected by Supabase authentication. Never share your password
              with anyone, including someone claiming to be barangay staff.
            </p>
          </div>

          <p className="mt-6 text-center text-sm font-semibold text-muted">
            {mode === 'login' ? 'No account yet?' : 'Already registered?'}{' '}
            <button
              type="button"
              onClick={() => resetNoticeOnModeChange(mode === 'login' ? 'register' : 'login')}
              className="font-bold text-pine underline-offset-4 hover:underline"
            >
              {mode === 'login' ? 'Register here' : 'Sign in instead'}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

function resolveDestination(role: string, nextPath: string | null) {
  if (nextPath && !(role !== 'admin' && nextPath.startsWith('/admin'))) {
    return nextPath;
  }
  return role === 'admin' ? '/admin' : '/dashboard';
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label-md block text-forest">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-xs font-medium text-muted">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
