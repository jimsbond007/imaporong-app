'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';
import { RiceFieldScene } from '@/components/landing/RiceFieldScene';

import { supabase } from '@/lib/supabase';
import { getRequestSlipNumber } from '@/components/RequestSlip';
import FeedbackModal from '@/components/FeedbackModal';
import { formatAnnouncementDate } from '@/components/AnnouncementCard';
import { PortalHeader } from '@/components/portal/PortalHeader';
import { StageLayout } from '@/components/portal/StageLayout';
import { PixelIcon, type PixelIconName } from '@/components/portal/PixelIcon';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { ServiceIcon } from '@/components/ui/ServiceIcon';
import {
  AlertIcon,
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
  DownloadIcon,
  IdCardIcon,
  InfoIcon,
  MapPinIcon,
  PrinterIcon,
  ShieldCheckIcon,
  TrashIcon,
} from '@/components/ui/icons';
import { SERVICES } from '@/lib/constants';
import type { Announcement, ServiceRequestRow } from '@/lib/types';
import imapMark from '@/assets/illustrations/imap.svg';

interface Profile {
  full_name: string | null;
  address: string | null;
  bid_number: string | null;
  is_verified: boolean | null;
  role: string | null;
}

const TRACKER_STEPS = ['Submitted', 'Under review', 'Ready for pickup'] as const;

/** A three-step progress bar so a resident can see where a slip is at a glance. */
function RequestTracker({ status }: { status: string }) {
  const reached = status === 'received' ? 3 : status === 'ready' ? 2 : 1;

  return (
    <ol aria-label="Request progress" className="mt-3.5 flex gap-1.5">
      {TRACKER_STEPS.map((label, index) => {
        const done = index < reached;
        const current = index === reached;
        return (
          <li key={label} className="min-w-0 flex-1">
            <span
              aria-hidden="true"
              className={`block h-1.5 rounded-full ${
                done ? 'bg-pine' : current ? 'bg-rice' : 'bg-line'
              }`}
            />
            <span
              className={`mt-1.5 flex items-center gap-1 truncate text-[0.6875rem] font-bold ${
                done ? 'text-pine-ink' : current ? 'text-pending-ink' : 'text-muted/70'
              }`}
            >
              {done && <CheckIcon className="h-3 w-3 shrink-0" />}
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

type TodoTone = 'gold' | 'green' | 'sky' | 'calm';

const TODO_TONES: Record<TodoTone, { row: string; icon: string }> = {
  gold: { row: 'border-pending-line bg-pending-bg/70', icon: 'bg-surface text-pending-ink' },
  green: { row: 'border-ready-line bg-mint/70', icon: 'bg-surface text-pine-ink' },
  sky: { row: 'border-sky-line bg-sky/70', icon: 'bg-surface text-sky-ink' },
  calm: { row: 'border-line bg-subtle', icon: 'bg-mint text-pine-ink' },
};

type Todo = {
  key: string;
  icon: PixelIconName;
  tone: TodoTone;
  title: string;
  description: string;
  action?: ReactNode;
};

function Panel({
  title,
  icon,
  aside,
  children,
  className = '',
}: {
  title: string;
  icon: PixelIconName;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[24px] border-2 border-line bg-surface p-5 shadow-subtle sm:p-6 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-display text-base font-extrabold text-forest sm:text-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint text-pine-ink">
            <PixelIcon name={icon} size={20} />
          </span>
          {title}
        </h2>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Dashboard({
  showAdminOnlyNotice = false,
  latestAnnouncements = [],
  announcementsAvailable = false,
}: {
  showAdminOnlyNotice?: boolean;
  latestAnnouncements?: Announcement[];
  announcementsAvailable?: boolean;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<ServiceRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingImage, setSavingImage] = useState(false);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [requestToHide, setRequestToHide] = useState<ServiceRequestRow | null>(null);
  const [historyNotice, setHistoryNotice] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const [showIdModal, setShowIdModal] = useState(false);
  const [pageNotice, setPageNotice] = useState<string | null>(
    showAdminOnlyNotice
      ? 'The staff workspace is only available to barangay administrator accounts. You are seeing the resident view.'
      : null,
  );
  const idCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace('/auth');
          return;
        }

        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, address, bid_number, is_verified, role')
          .eq('id', user.id)
          .single();

        if (profileError || !userProfile) {
          console.error('Could not load the signed-in profile:', profileError);
          setHistoryNotice({
            type: 'error',
            title: 'Profile Could Not Be Loaded',
            message:
              'Your resident profile is unavailable. Please refresh the page or contact the barangay administrator.',
          });
          return;
        }

        setProfile(userProfile);

        const { data: userRequests, error: requestsError } = await supabase
          .from('service_requests')
          .select('*')
          .eq('resident_id', user.id)
          .is('resident_hidden_at', null)
          .order('created_at', { ascending: false });

        if (requestsError) {
          console.error('Could not load resident requests:', requestsError);
          return;
        }

        setRequests((userRequests ?? []) as ServiceRequestRow[]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleHideRequest = async () => {
    if (!requestToHide) return;
    const request = requestToHide;
    setDeletingRequestId(request.id);

    const { error } = await supabase.rpc('hide_completed_request_from_resident', {
      p_request_id: request.id,
    });

    if (error) {
      setRequestToHide(null);
      setDeletingRequestId(null);
      setHistoryNotice({
        type: 'error',
        title: 'Could Not Remove Request',
        message: `This request could not be removed from your history. ${error.message}`,
      });
      return;
    }

    setRequests((current) => current.filter((item) => item.id !== request.id));
    setRequestToHide(null);
    setDeletingRequestId(null);
    setHistoryNotice({
      type: 'success',
      title: 'Request Removed',
      message:
        'This request was removed from your history. The record remains visible to barangay staff.',
    });
  };

  const handleSaveImage = async () => {
    if (!idCardRef.current) return;
    setSavingImage(true);
    try {
      const dataUrl = await toPng(idCardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Maporong-ID-${
        profile?.full_name?.replace(/\s+/g, '_') || 'Resident'
      }.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export ID image:', error);
      setHistoryNotice({
        type: 'error',
        title: 'Could Not Save ID',
        message: 'Could not generate the ID image. Please try printing instead.',
      });
    } finally {
      setSavingImage(false);
    }
  };

  if (loading || !profile) {
    return (
      <div>
        <div className="h-[68px] border-b border-line bg-surface" />
        <div className="page-shell py-8">
          <div className="skeleton h-56 rounded-[26px]" />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="skeleton h-20 rounded-2xl" />
            <div className="skeleton h-20 rounded-2xl" />
            <div className="skeleton h-20 rounded-2xl" />
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.7fr_1fr]">
            <div className="skeleton h-80 rounded-[24px]" />
            <div className="skeleton h-80 rounded-[24px]" />
          </div>
        </div>
      </div>
    );
  }

  const firstName = profile.full_name?.split(' ')[0] || 'Resident';
  const pendingCount = requests.filter((request) => request.status === 'pending').length;
  const readyCount = requests.filter((request) => request.status === 'ready').length;
  const isVerified = Boolean(profile.is_verified);
  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const todos: Todo[] = [];
  if (readyCount > 0) {
    todos.push({
      key: 'ready',
      icon: 'check',
      tone: 'green',
      title: `${readyCount} document${readyCount === 1 ? '' : 's'} ready for pickup`,
      description: 'Bring a valid ID to the barangay desk and show your slip number.',
      action: (
        <ButtonLink href="#history" variant="secondary" size="sm">
          View pickup details
        </ButtonLink>
      ),
    });
  }
  if (pendingCount > 0) {
    todos.push({
      key: 'pending',
      icon: 'clock',
      tone: 'gold',
      title: `${pendingCount} request${pendingCount === 1 ? '' : 's'} under review`,
      description: 'Barangay staff will update each slip once it has been reviewed.',
      action: (
        <ButtonLink href="#history" variant="secondary" size="sm">
          View my requests
        </ButtonLink>
      ),
    });
  }
  if (!isVerified) {
    todos.push({
      key: 'verify',
      icon: 'shield',
      tone: 'sky',
      title: 'Resident verification in progress',
      description:
        'Barangay staff review resident records. Your ID card becomes available after verification.',
    });
  }
  if (todos.length === 0) {
    todos.push({
      key: 'caught-up',
      icon: 'sprout',
      tone: 'calm',
      title: 'You are all caught up',
      description: 'Start a document request whenever you need a barangay certificate.',
      action: (
        <ButtonLink href="/dashboard/request" variant="secondary" size="sm">
          Submit a request
        </ButtonLink>
      ),
    });
  }

  const stats = [
    {
      label: 'Pending review',
      value: pendingCount,
      icon: <ClockIcon className="h-5 w-5" />,
      tone: 'bg-pending-bg text-pending-ink',
    },
    {
      label: 'Ready for pickup',
      value: readyCount,
      icon: <CheckCircleIcon className="h-5 w-5" />,
      tone: 'bg-mint text-pine-ink',
    },
    {
      label: 'Total requests',
      value: requests.length,
      icon: <ClipboardIcon className="h-5 w-5" />,
      tone: 'bg-sky text-sky-ink',
    },
  ];

  return (
    <div className="min-h-screen bg-mist/60 pb-24 md:pb-16">
      <PortalHeader
        name={profile.full_name || 'Resident'}
        role={profile.role || 'resident'}
        isVerified={isVerified}
        active="overview"
        onOpenId={() => setShowIdModal(true)}
      />

      <StageLayout className="pb-24 md:pb-16" contentClassName="p-3 sm:p-5">
        <main className="page-shell py-5">
          {pageNotice && (
            <div
              role="status"
              className="mb-5 flex items-start gap-3 rounded-2xl border border-sky-line bg-sky px-4 py-3 text-sm font-semibold text-sky-ink"
            >
              <InfoIcon className="mt-0.5 h-4.5 w-4.5 shrink-0" />
              <div className="flex-1">{pageNotice}</div>
              <button
                type="button"
                onClick={() => setPageNotice(null)}
                className="text-xs font-bold uppercase tracking-wide underline underline-offset-4"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ------------------------------------------------------ Welcome */}
          <section className="animate-fade-up relative overflow-hidden rounded-[28px] border-2 border-pine-deep/40 bg-pine p-6 text-white shadow-card sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-14 -top-16 h-56 w-56 rounded-full bg-white/10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-gold/20"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-10 bottom-6 h-24 w-24 rotate-12 rounded-[28px] bg-white/[0.07]"
            />

            <div className="relative z-10 grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-white/90">
                    {today}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.1em] ${
                      isVerified ? 'bg-mint text-pine-ink' : 'bg-pending-bg text-pending-ink'
                    }`}
                  >
                    <ShieldCheckIcon className="h-3.5 w-3.5" />
                    {isVerified ? 'Verified resident' : 'Verification in progress'}
                  </span>
                </div>

                <h1 className="mt-4 text-balance font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                  Mabalos, {firstName}!
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                  {isVerified
                    ? 'Your resident record is confirmed. Request documents, track your slips, and print your resident ID, all in one place.'
                    : 'Your account is registered. Barangay staff still need to verify your record before a resident ID is issued.'}
                </p>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <ButtonLink href="/dashboard/request" variant="gold" size="md">
                    <ClipboardIcon className="h-4 w-4" />
                    Request a document
                  </ButtonLink>
                  {isVerified && (
                    <button
                      type="button"
                      onClick={() => setShowIdModal(true)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
                    >
                      <IdCardIcon className="h-4 w-4" />
                      My ID card
                    </button>
                  )}
                </div>
              </div>

              <div className="relative hidden h-44 overflow-hidden rounded-[22px] border-2 border-white/35 bg-sky shadow-subtle md:block">
                <RiceFieldScene className="absolute inset-0 h-full w-full" />
              </div>
            </div>
          </section>

          {/* -------------------------------------------------------- Stats */}
          <div className="animate-fade-up delay-1 mt-4 grid gap-3 sm:grid-cols-3">
            {stats.map((item) => (
              <a
                key={item.label}
                href="#history"
                className="interactive-card flex items-center gap-3.5 rounded-2xl border-2 border-line bg-surface px-4 py-3.5 shadow-subtle"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.tone}`}
                >
                  {item.icon}
                </span>
                <span>
                  <span className="block font-display text-2xl font-extrabold leading-none text-forest">
                    {item.value}
                  </span>
                  <span className="mt-1 block text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted">
                    {item.label}
                  </span>
                </span>
              </a>
            ))}
          </div>

          <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            {/* ======================================================= Left */}
            <div className="grid gap-5">
              <Panel title="What you can do today" icon="check" className="animate-fade-up delay-2">
                <ul className="grid gap-2.5">
                  {todos.map((todo) => {
                    const tone = TODO_TONES[todo.tone];
                    return (
                      <li
                        key={todo.key}
                        className={`flex flex-col gap-3 rounded-2xl border p-3.5 sm:flex-row sm:items-center ${tone.row}`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}
                        >
                          <PixelIcon name={todo.icon} size={22} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-extrabold text-forest">{todo.title}</h3>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted">
                            {todo.description}
                          </p>
                        </div>
                        {todo.action && <div className="shrink-0">{todo.action}</div>}
                      </li>
                    );
                  })}
                </ul>
              </Panel>

              <Panel
                title="Start a new request"
                icon="request"
                aside={
                  <ButtonLink href="/dashboard/request" variant="quiet" size="sm">
                    See all
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </ButtonLink>
                }
                className="animate-fade-up delay-3"
              >
                <p className="body-sm -mt-1 mb-3">
                  Choose a document. You can review the form before submitting.
                </p>
                <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
                  {SERVICES.map((service) => (
                    <li key={service.slug}>
                      <Link
                        href={`/dashboard/request?service=${encodeURIComponent(service.name)}`}
                        className="group flex items-center gap-3 bg-surface px-3.5 py-3 transition hover:bg-mist/70"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-pine-ink transition group-hover:bg-pine group-hover:text-white">
                          <ServiceIcon icon={service.icon} className="h-[18px] w-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-extrabold text-forest">
                            {service.name}
                          </span>
                          <span className="mt-0.5 block text-xs font-medium leading-relaxed text-muted">
                            {service.short}
                          </span>
                        </span>
                        <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-pine-ink" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>

              {/* Request history */}
              <section id="history" className="scroll-mt-32">
                <Panel
                  title="Request history"
                  icon="home"
                  aside={
                    <span className="text-xs font-semibold text-muted">
                      {requests.length} {requests.length === 1 ? 'request' : 'requests'}
                    </span>
                  }
                >
                  <p className="body-sm -mt-1 mb-4">
                    Follow each slip from review to pickup. Rejected requests show the staff
                    feedback below.
                  </p>

                  {requests.length === 0 ? (
                    <EmptyState
                      icon={<ClipboardIcon className="h-5 w-5" />}
                      title="No requests yet"
                      description="When you submit a document request, its slip number and status will appear here."
                      action={
                        <ButtonLink href="/dashboard/request" size="sm">
                          Request a document
                        </ButtonLink>
                      }
                    />
                  ) : (
                    <ul className="grid gap-3">
                      {requests.map((request) => {
                        const serviceIcon =
                          SERVICES.find((service) => service.name === request.service_type)
                            ?.icon ?? 'clearance';
                        return (
                          <li
                            key={request.id}
                            className="rounded-2xl border border-line bg-subtle p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex min-w-0 items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-pine-ink shadow-subtle">
                                  <ServiceIcon icon={serviceIcon} className="h-[18px] w-[18px]" />
                                </span>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-extrabold text-forest">
                                      {request.service_type}
                                    </p>
                                    <StatusBadge status={request.status} />
                                  </div>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs font-semibold text-muted">
                                    <span className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[0.6875rem] font-bold tracking-wide text-pine-ink">
                                      {getRequestSlipNumber(request)}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                      <CalendarIcon className="h-3.5 w-3.5" />
                                      {new Date(request.created_at).toLocaleDateString('en-PH', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </span>
                                    {request.request_for && <span>For: {request.request_for}</span>}
                                  </div>
                                </div>
                              </div>

                              {(request.status === 'received' ||
                                request.status === 'rejected') && (
                                <Button
                                  variant="dangerSoft"
                                  size="sm"
                                  className="shrink-0 self-start"
                                  onClick={() => setRequestToHide(request)}
                                  disabled={deletingRequestId === request.id}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  {deletingRequestId === request.id ? 'Removing…' : 'Remove'}
                                </Button>
                              )}
                            </div>

                            {request.status !== 'rejected' && (
                              <RequestTracker status={request.status} />
                            )}

                            {request.status === 'rejected' && request.rejection_reason && (
                              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-rejected-line bg-rejected-bg p-3.5">
                                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-rejected-ink" />
                                <div>
                                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-rejected-ink">
                                    Staff feedback
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-rejected-deep">
                                    {request.rejection_reason}
                                  </p>
                                </div>
                              </div>
                            )}

                            {request.status === 'ready' && (
                              <p className="mt-3 flex items-center gap-2 rounded-xl border border-ready-line bg-mint px-3.5 py-2.5 text-xs font-semibold text-pine-ink">
                                <CheckCircleIcon className="h-4 w-4 shrink-0" />
                                Ready for pickup at the barangay desk. Bring a valid ID.
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Panel>
              </section>
            </div>

            {/* ======================================================= Right */}
            <aside className="grid gap-5">
              {/* Resident ID */}
              <Panel
                title="My resident ID"
                icon="id"
                aside={
                  <Badge tone={isVerified ? 'green' : 'gold'}>
                    {isVerified ? 'Verified' : 'Pending'}
                  </Badge>
                }
                className="animate-fade-up delay-2"
              >
                <div id="my-id" className="scroll-mt-32">
                  <div
                    data-theme="light"
                    className={`overflow-hidden rounded-[18px] border border-line bg-surface shadow-subtle ${
                      isVerified ? '' : 'opacity-80'
                    }`}
                  >
                    <div className="relative overflow-hidden bg-pine px-4 py-3 text-white">
                      <div
                        aria-hidden="true"
                        className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10"
                      />
                      <div className="relative z-10 flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface p-1">
                          <Image src={imapMark} alt="" className="h-full w-full object-contain" />
                        </span>
                        <span className="leading-tight">
                          <span className="block text-[0.5625rem] font-bold uppercase tracking-[0.18em] text-white/80">
                            Resident identification
                          </span>
                          <span className="block font-display text-sm font-extrabold uppercase">
                            Barangay Maporong
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="px-4 py-3.5">
                      <p className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-muted">
                        Full name
                      </p>
                      <p className="mt-0.5 break-words font-display text-base font-extrabold uppercase leading-tight text-forest">
                        {profile.full_name || 'Not provided'}
                      </p>
                      <div className="mt-3 rounded-xl border border-line bg-mist px-3 py-2">
                        <p className="text-[0.5rem] font-bold uppercase tracking-[0.14em] text-muted">
                          BID number
                        </p>
                        <p className="mt-0.5 font-mono text-sm font-extrabold tracking-tight text-forest">
                          {profile.bid_number || 'Assigned after verification'}
                        </p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gold" />
                  </div>

                  <p className="mt-3.5 flex items-start gap-2 text-xs font-semibold leading-relaxed text-forest/80">
                    <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-pine-ink" />
                    {profile.address || 'Address not provided'}
                  </p>

                  <div className="mt-4">
                    {isVerified ? (
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => setShowIdModal(true)}
                      >
                        <IdCardIcon className="h-4 w-4" />
                        Open my ID card
                      </Button>
                    ) : (
                      <p className="rounded-xl border border-pending-line bg-pending-bg p-3 text-xs font-semibold leading-relaxed text-pending-ink">
                        A resident ID is issued after staff verify your record. Bring a valid ID
                        when visiting the barangay desk.
                      </p>
                    )}
                  </div>
                </div>
              </Panel>

              {/* Noticeboard */}
              <Panel
                title="Noticeboard"
                icon="news"
                aside={
                  <Link
                    href="/dashboard/announcements"
                    className="inline-flex items-center gap-1 text-xs font-bold text-pine-ink transition hover:gap-1.5"
                  >
                    View all <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Link>
                }
                className="animate-fade-up delay-3"
              >
                {latestAnnouncements.length > 0 ? (
                  <ul className="grid gap-2.5">
                    {latestAnnouncements.slice(0, 3).map((announcement) => (
                      <li key={announcement.id}>
                        <Link
                          href="/dashboard/announcements"
                          className="interactive-card block rounded-2xl border-2 border-line bg-subtle p-3.5"
                        >
                          <span className="flex flex-wrap items-center gap-2">
                            <Badge tone="sky">{announcement.category || 'General'}</Badge>
                            <time
                              dateTime={announcement.published_at || announcement.created_at}
                              className="inline-flex items-center gap-1.5 text-[0.6875rem] font-semibold text-muted"
                            >
                              <CalendarIcon className="h-3 w-3" />
                              {formatAnnouncementDate(
                                announcement.published_at || announcement.created_at,
                              )}
                            </time>
                          </span>
                          <span className="mt-2 line-clamp-2 block font-display text-sm font-extrabold leading-snug text-forest">
                            {announcement.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-line bg-subtle p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky text-sky-ink">
                      <BellIcon className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-semibold leading-relaxed text-muted">
                      {announcementsAvailable
                        ? 'No announcements have been published yet. Barangay updates will appear here.'
                        : 'The online noticeboard is being set up. Barangay updates will appear here.'}
                    </p>
                    <Link
                      href="/dashboard/announcements"
                      className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-pine-ink transition hover:gap-2.5"
                    >
                      Open noticeboard <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </Panel>
            </aside>
          </div>
        </main>
      </StageLayout>

      {/* ID card modal */}
      <Modal
        open={showIdModal}
        onClose={() => setShowIdModal(false)}
        title="Resident identification card"
        description="Present this card when transacting at the barangay desk."
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={handleSaveImage}
              disabled={savingImage}
            >
              <DownloadIcon className="h-4 w-4" />
              {savingImage ? 'Generating…' : 'Save image'}
            </Button>
            <Button onClick={() => window.print()}>
              <PrinterIcon className="h-4 w-4" />
              Print ID
            </Button>
          </>
        }
      >
        <div className="flex justify-center">
          <div
            ref={idCardRef}
            id="printable-id"
            data-theme="light"
            className="relative flex h-[270px] w-full max-w-[430px] shrink-0 flex-col overflow-hidden rounded-[20px] border border-line bg-surface"
          >
            <div className="relative overflow-hidden bg-pine px-5 pb-4 pt-4 text-white">
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-12 left-1/3 h-28 w-28 rounded-full bg-gold/20"
              />
              <div className="relative z-10 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface p-1">
                  <Image
                    src={imapMark}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </span>
                <div>
                  <p className="text-[0.5625rem] font-bold uppercase tracking-[0.2em] text-white/80">
                    Republic of the Philippines · Province of Albay
                  </p>
                  <p className="font-display text-xl font-extrabold uppercase tracking-tight">
                    Barangay Maporong
                  </p>
                  <p className="text-[0.5625rem] font-bold uppercase tracking-[0.18em] text-white/85">
                    Resident identification card
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between px-5 py-4">
              <div>
                <p className="text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-muted">
                  Full name
                </p>
                <p className="mt-0.5 font-display text-2xl font-extrabold uppercase leading-tight tracking-tight text-forest">
                  {profile.full_name || 'Resident'}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-[1.1fr_1fr] gap-3">
                <div className="rounded-xl border border-line bg-mist px-3 py-2">
                  <p className="text-[0.5rem] font-bold uppercase tracking-[0.14em] text-muted">
                    BID number
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-extrabold tracking-tight text-forest">
                    {profile.bid_number || '—'}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[0.5rem] font-bold uppercase tracking-[0.14em] text-muted">
                    Residence
                  </p>
                  <p className="mt-0.5 text-[0.6875rem] font-bold uppercase leading-tight text-forest/80">
                    {profile.address || '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between px-5 pb-3">
              <div className="w-2/5">
                <div className="mb-1 border-b border-forest/60" />
                <p className="text-[0.5rem] font-bold uppercase tracking-wide text-muted">
                  Resident signature
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-[0.5rem] font-bold uppercase tracking-[0.1em] text-pine-ink">
                <ShieldCheckIcon className="h-3 w-3" />
                Verified resident
              </span>
            </div>

            <div className="h-2 bg-gold" />
          </div>
        </div>

        <p className="body-sm mt-4 text-center">
          If your name, address, or BID number is wrong, contact barangay staff before
          printing.
        </p>

        <style jsx global>{`
          @media print {
            #printable-id {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              position: fixed;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%) scale(1.4);
              box-shadow: none !important;
            }
            body * {
              visibility: hidden;
            }
            #printable-id,
            #printable-id * {
              visibility: visible;
            }
          }
        `}</style>
      </Modal>

      {requestToHide && (
        <FeedbackModal
          title="Delete request history?"
          message={`Remove this ${
            requestToHide.status === 'rejected' ? 'rejected' : 'completed'
          } request from your history? It stays visible to barangay staff.`}
          type="warning"
          confirmLabel="Delete history"
          busy={deletingRequestId === requestToHide.id}
          onConfirm={handleHideRequest}
          onClose={() => setRequestToHide(null)}
        />
      )}

      {historyNotice && (
        <FeedbackModal
          title={historyNotice.title}
          message={historyNotice.message}
          type={historyNotice.type}
          onClose={() => setHistoryNotice(null)}
        />
      )}
    </div>
  );
}
