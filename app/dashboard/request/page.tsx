'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase';
import { getRequestSlipNumber } from '@/components/RequestSlip';
import { PageHeader } from '@/components/portal/PageHeader';
import { PortalHeader } from '@/components/portal/PortalHeader';
import { StageLayout } from '@/components/portal/StageLayout';
import { PixelIcon } from '@/components/portal/PixelIcon';
import { Button, ButtonLink, buttonClasses } from '@/components/ui/Button';
import { ServiceIcon } from '@/components/ui/ServiceIcon';
import {
  AlertIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardIcon,
  InfoIcon,
  LockIcon,
  PrinterIcon,
} from '@/components/ui/icons';
import { SERVICES } from '@/lib/constants';

interface ProfileInfo {
  full_name: string | null;
  address: string | null;
  role: string | null;
  is_verified: boolean | null;
}

const INITIAL_FORM = {
  full_name: '',
  sex: 'Male',
  civil_status: 'Single',
  birthday: '',
  age: '',
  address: '',
  height: '',
  weight: '',
  business: '',
  capital: '',
  cp_no: '',
  birth_place: '',
  purpose: '',
  service_type: SERVICES[0].name,
  request_for: '',
};

function calculateAge(birthDateString: string): string {
  if (!birthDateString) return '';
  const birthDate = new Date(birthDateString);
  if (Number.isNaN(birthDate.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age > 0 ? age.toString() : '';
}

function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label-md block text-forest">
        {label}
        {required && (
          <span className="ml-1 text-rejected-ink" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && <p className="mt-0.5 text-xs font-medium text-muted">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export default function RequestForm() {
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submittedSlip, setSubmittedSlip] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/auth');
        return;
      }

      const { data: record, error } = await supabase
        .from('profiles')
        .select('full_name, address, role, is_verified')
        .eq('id', user.id)
        .single();

      if (error || !record) {
        console.error('Could not load the signed-in profile:', error);
        router.replace('/auth');
        return;
      }

      if (record.role !== 'resident' && record.role !== 'admin') {
        router.replace('/auth');
        return;
      }

      setProfile(record);

      const requestedService = new URLSearchParams(window.location.search).get('service');
      const matchedService = SERVICES.find(
        (service) =>
          service.name.toLowerCase() === requestedService?.trim().toLowerCase() ||
          service.slug === requestedService?.trim().toLowerCase(),
      );

      setFormData((previous) => ({
        ...previous,
        full_name: record.full_name || '',
        address: record.address || '',
        service_type: matchedService?.name ?? previous.service_type,
      }));
      setProfileLoading(false);
    };

    fetchProfile();
  }, [router]);

  const update = <K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K],
  ) => setFormData((previous) => ({ ...previous, [key]: value }));

  const handleBirthdayChange = (value: string) => {
    setFormData((previous) => ({
      ...previous,
      birthday: value,
      age: calculateAge(value),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    if (!formData.birthday) {
      setFeedback('Please enter your birth date so the request slip can show your age.');
      return;
    }

    if (!formData.purpose.trim()) {
      setFeedback('Please describe the purpose of your request.');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/auth');
        return;
      }

      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !currentProfile) {
        console.error('Could not verify request submitter role:', profileError);
        router.replace('/auth');
        return;
      }

      if (currentProfile.role !== 'resident' && currentProfile.role !== 'admin') {
        router.replace('/auth');
        return;
      }

      const { data: insertedRows, error } = await supabase
        .from('service_requests')
        .insert([
          {
            full_name: formData.full_name.trim(),
            sex: formData.sex,
            civil_status: formData.civil_status,
            birthday: formData.birthday,
            age: Number.parseInt(formData.age, 10) || null,
            address: formData.address.trim(),
            height: formData.height.trim() || null,
            weight: formData.weight.trim() || null,
            business: formData.business.trim() || null,
            capital: formData.capital.trim() || null,
            cp_no: formData.cp_no.trim() || null,
            birth_place: formData.birth_place.trim() || null,
            purpose: formData.purpose.trim(),
            service_type: formData.service_type,
            request_for: formData.request_for.trim() || null,
            resident_id: user.id,
            status: 'pending',
          },
        ])
        .select('id, slip_number, created_at');

      if (error) {
        console.error('Failed to submit service request:', error);
        const missingSetup =
          ['42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205'].includes(error.code) ||
          /does not exist|could not find/i.test(error.message);

        setFeedback(
          missingSetup
            ? 'The request database is missing required fields or slip-number setup. Ask the barangay administrator to apply all SQL files in supabase/migrations in order, then reload this page.'
            : error.message,
        );
        return;
      }

      const inserted = insertedRows?.[0];
      const slipNumber = getRequestSlipNumber({
        id: inserted?.id,
        slip_number: inserted?.slip_number,
        created_at: inserted?.created_at,
      });

      // The database trigger normally creates this. The fallback is allowed by
      // the resident update policy and only stores the generated slip number.
      if (inserted?.id && inserted.slip_number !== slipNumber) {
        const { error: updateError } = await supabase
          .from('service_requests')
          .update({ slip_number: slipNumber })
          .eq('id', inserted.id);

        if (updateError) {
          console.error('Failed to save request slip number:', updateError);
        }
      }

      setSubmittedSlip(slipNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      setFeedback('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copySlip = async () => {
    if (!submittedSlip) return;
    try {
      await navigator.clipboard.writeText(submittedSlip);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (profileLoading) {
    return (
      <div>
        <div className="h-[68px] border-b border-line bg-white" />
        <div className="page-shell py-10">
          <div className="skeleton h-8 w-64 rounded-full" />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="skeleton h-[420px] rounded-[20px] lg:col-span-2" />
            <div className="skeleton h-64 rounded-[20px]" />
          </div>
        </div>
      </div>
    );
  }

  const selectedService =
    SERVICES.find((service) => service.name === formData.service_type) ?? SERVICES[0];
  const isBusiness = formData.service_type === 'Business Clearance';

  return (
    <div className="min-h-screen bg-mist/60 pb-24 md:pb-16">
      <PortalHeader
        name={profile?.full_name || 'Resident'}
        role={profile?.role || 'resident'}
        isVerified={Boolean(profile?.is_verified)}
        active="request"
      />

      <StageLayout className="pb-24 md:pb-16" contentClassName="p-3 sm:p-5">
      <main className="page-shell py-5">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-pine transition hover:gap-2.5"
        >
          <ArrowRightIcon className="h-4 w-4 rotate-180" />
          Back to overview
        </Link>

        {submittedSlip ? (
          <section className="animate-fade-up mx-auto mt-6 max-w-xl rounded-[24px] border-2 border-line bg-white p-6 text-center shadow-card sm:p-8">
            <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-[22px] border-2 border-line bg-mint shadow-subtle">
              <PixelIcon name="rice" size={76} className="text-pine" />
              <span className="absolute -bottom-2 -right-1 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white bg-cream text-pine shadow-subtle">
                <CheckCircleIcon className="h-6 w-6" />
              </span>
            </div>
            <h1 className="heading-2 mt-4">Request submitted</h1>
            <p className="body-md mt-2">
              Barangay staff will review your request. Keep this slip number for follow-up.
            </p>

            <div className="mt-6 rounded-2xl border-2 border-dashed border-pine/40 bg-subtle px-5 py-4">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-muted">
                Request slip number
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold tracking-tight text-pine">
                {submittedSlip}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Button variant="secondary" onClick={copySlip}>
                {copied ? 'Copied' : 'Copy slip number'}
              </Button>
              <ButtonLink href="/dashboard">
                <ClipboardIcon className="h-4 w-4" />
                View my requests
              </ButtonLink>
            </div>

            <button
              type="button"
              onClick={() => {
                setSubmittedSlip(null);
                setFeedback(null);
                setCopied(false);
                setFormData((previous) => ({
                  ...INITIAL_FORM,
                  full_name: previous.full_name,
                  address: previous.address,
                }));
              }}
              className="mt-5 text-sm font-bold text-pine underline-offset-4 hover:underline"
            >
              Submit another request
            </button>

            <p className="body-sm mt-6 flex items-start justify-center gap-2 text-left">
              <PrinterIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              Printing of the official slip is handled at the barangay desk. Your request
              remains in the staff queue.
            </p>
          </section>
        ) : (
          <>
            <PageHeader
              className="animate-fade-up mt-5"
              eyebrow="Document request"
              title="New document request"
              description="Fill in the details once. A request slip number will be generated after you submit, and you can follow the status from your dashboard."
            />

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <div className="space-y-4">
                <section className="rounded-[20px] border-2 border-line bg-white p-5 shadow-card sm:p-6">
                  <h2 className="heading-3">1. Choose a document</h2>
                  <p className="body-sm mt-1">
                    Select the certificate or clearance you need.
                  </p>

                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {SERVICES.map((service) => {
                      const selected = formData.service_type === service.name;
                      return (
                        <label
                          key={service.slug}
                          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition ${
                            selected
                              ? 'border-pine bg-mint/60 ring-1 ring-pine'
                              : 'border-line bg-white hover:border-leaf hover:bg-subtle'
                          }`}
                        >
                          <input
                            type="radio"
                            name="service_type"
                            value={service.name}
                            checked={selected}
                            onChange={() => update('service_type', service.name)}
                            className="sr-only"
                          />
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              selected ? 'bg-pine text-white' : 'bg-mint text-pine'
                            }`}
                          >
                            <ServiceIcon icon={service.icon} className="h-4.5 w-4.5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-extrabold text-forest">
                              {service.name}
                            </span>
                            <span className="mt-0.5 block text-xs font-medium leading-relaxed text-muted">
                              {service.short}
                            </span>
                          </span>
                          <span
                            className={`ml-auto mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? 'border-pine bg-pine text-white'
                                : 'border-[#c4d6cb] bg-white text-transparent'
                            }`}
                          >
                            <CheckCircleIcon className="h-3 w-3" />
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-[20px] border-2 border-line bg-white p-5 shadow-card sm:p-6">
                  <h2 className="heading-3">2. Request details</h2>
                  <p className="body-sm mt-1">
                    Tell the barangay why you need this document.
                  </p>

                  <div className="mt-4 space-y-4">
                    <Field
                      label="Purpose of request"
                      htmlFor="purpose"
                      required
                      hint={`${formData.purpose.length}/200 characters`}
                    >
                      <input
                        id="purpose"
                        type="text"
                        required
                        maxLength={200}
                        value={formData.purpose}
                        onChange={(event) => update('purpose', event.target.value)}
                        placeholder="e.g. Local employment, scholarship, medical assistance"
                        className="input-base"
                      />
                    </Field>

                    <Field
                      label="For whom"
                      htmlFor="request_for"
                      hint="Leave blank if the request is for yourself."
                    >
                      <input
                        id="request_for"
                        type="text"
                        value={formData.request_for}
                        onChange={(event) => update('request_for', event.target.value)}
                        placeholder="Full name of the person you are requesting for"
                        className="input-base"
                      />
                    </Field>
                  </div>
                </section>

                <section className="rounded-[20px] border-2 border-line bg-white p-5 shadow-card sm:p-6">
                  <h2 className="heading-3">3. Personal information</h2>
                  <p className="body-sm mt-1">
                    Prefilled from your resident record. Correct anything that is outdated.
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field label="Full name" htmlFor="full_name" required>
                        <input
                          id="full_name"
                          type="text"
                          required
                          autoComplete="name"
                          value={formData.full_name}
                          onChange={(event) => update('full_name', event.target.value)}
                          className="input-base"
                        />
                      </Field>
                    </div>

                    <Field label="Birth date" htmlFor="birthday" required>
                      <input
                        id="birthday"
                        type="date"
                        required
                        max={new Date().toISOString().slice(0, 10)}
                        value={formData.birthday}
                        onChange={(event) => handleBirthdayChange(event.target.value)}
                        className="input-base"
                      />
                    </Field>

                    <Field label="Age" htmlFor="age" hint="Computed from birth date.">
                      <input
                        id="age"
                        type="text"
                        readOnly
                        value={formData.age}
                        placeholder="—"
                        className="input-base bg-mist"
                      />
                    </Field>

                    <Field label="Sex" htmlFor="sex">
                      <select
                        id="sex"
                        value={formData.sex}
                        onChange={(event) => update('sex', event.target.value)}
                        className="input-base"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </Field>

                    <Field label="Civil status" htmlFor="civil_status">
                      <select
                        id="civil_status"
                        value={formData.civil_status}
                        onChange={(event) => update('civil_status', event.target.value)}
                        className="input-base"
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                      </select>
                    </Field>

                    <div className="sm:col-span-2">
                      <Field label="Home address" htmlFor="address" required>
                        <input
                          id="address"
                          type="text"
                          required
                          autoComplete="street-address"
                          value={formData.address}
                          onChange={(event) => update('address', event.target.value)}
                          className="input-base"
                        />
                      </Field>
                    </div>
                  </div>
                </section>

                <section className="rounded-[20px] border-2 border-line bg-white p-5 shadow-card sm:p-6">
                  <h2 className="heading-3">4. Additional details</h2>
                  <p className="body-sm mt-1">
                    Optional fields that help staff prepare the document correctly.
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Birth place" htmlFor="birth_place">
                      <input
                        id="birth_place"
                        type="text"
                        value={formData.birth_place}
                        onChange={(event) => update('birth_place', event.target.value)}
                        placeholder="City or municipality"
                        className="input-base"
                      />
                    </Field>

                    <Field label="Contact number" htmlFor="cp_no">
                      <input
                        id="cp_no"
                        type="tel"
                        inputMode="tel"
                        value={formData.cp_no}
                        onChange={(event) => update('cp_no', event.target.value)}
                        placeholder="09XXXXXXXXX"
                        className="input-base"
                      />
                    </Field>

                    <Field label="Height" htmlFor="height">
                      <input
                        id="height"
                        type="text"
                        value={formData.height}
                        onChange={(event) => update('height', event.target.value)}
                        placeholder={`e.g. 5'6"`}
                        className="input-base"
                      />
                    </Field>

                    <Field label="Weight" htmlFor="weight">
                      <input
                        id="weight"
                        type="text"
                        value={formData.weight}
                        onChange={(event) => update('weight', event.target.value)}
                        placeholder="e.g. 60 kg"
                        className="input-base"
                      />
                    </Field>

                    {isBusiness && (
                      <>
                        <Field label="Business name" htmlFor="business">
                          <input
                            id="business"
                            type="text"
                            value={formData.business}
                            onChange={(event) => update('business', event.target.value)}
                            placeholder="Registered or trade name"
                            className="input-base"
                          />
                        </Field>

                        <Field label="Capital" htmlFor="capital">
                          <input
                            id="capital"
                            type="text"
                            value={formData.capital}
                            onChange={(event) => update('capital', event.target.value)}
                            placeholder="e.g. PHP 50,000"
                            className="input-base"
                          />
                        </Field>
                      </>
                    )}
                  </div>
                </section>

                {feedback && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-2xl border border-[#f1cccc] bg-rejected-bg p-4 text-sm font-semibold text-rejected-ink"
                  >
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{feedback}</span>
                  </div>
                )}
              </div>

              {/* Summary rail */}
              <aside className="lg:sticky lg:top-32 lg:self-start">
                <div className="rounded-[20px] border-2 border-line bg-white p-5 shadow-card">
                  <p className="eyebrow">Request summary</p>

                  <div className="mt-3 flex items-start gap-3 rounded-2xl border border-line bg-subtle p-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-pine">
                      <ServiceIcon icon={selectedService.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-forest">
                        {selectedService.name}
                      </p>
                      <p className="mt-0.5 text-xs font-medium leading-relaxed text-muted">
                        {selectedService.short}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-4 space-y-2.5 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <dt className="font-semibold text-muted">Requested by</dt>
                      <dd className="max-w-[60%] text-right font-bold text-forest">
                        {formData.full_name || '—'}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="font-semibold text-muted">For</dt>
                      <dd className="max-w-[60%] text-right font-bold text-forest">
                        {formData.request_for || 'Myself'}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="font-semibold text-muted">Status</dt>
                      <dd>
                        <span className="rounded-full border border-[#f2dfb6] bg-pending-bg px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wide text-pending-ink">
                          Pending review
                        </span>
                      </dd>
                    </div>
                  </dl>

                  <ul className="mt-4 space-y-2 border-t border-line pt-4">
                    {[
                      'A slip number is generated after submission.',
                      'Staff may ask for corrections before printing.',
                      'Bring a valid ID when claiming the document.',
                    ].map((line) => (
                      <li key={line} className="flex items-start gap-2 text-xs font-medium text-muted">
                        <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pine" />
                        {line}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="submit"
                    disabled={loading}
                    className={buttonClasses('primary', 'lg', 'mt-5 w-full')}
                  >
                    {loading ? 'Submitting…' : 'Submit request'}
                    {!loading && <ArrowRightIcon className="h-4 w-4" />}
                  </button>

                  <p className="mt-3 flex items-start gap-1.5 text-[0.6875rem] font-medium leading-relaxed text-muted">
                    <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pine" />
                    Your details are visible only to you and authorized barangay staff.
                  </p>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-2xl border border-[#cfe7f1] bg-sky p-3.5 text-xs font-semibold leading-relaxed text-[#3a6478]">
                  <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  Requirements and processing time are confirmed by barangay staff when
                  your request is reviewed.
                </div>
              </aside>
            </form>
          </>
        )}
      </main>
      </StageLayout>
    </div>
  );
}
