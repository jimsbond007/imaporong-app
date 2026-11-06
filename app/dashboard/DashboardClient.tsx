'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';
import { RiceFieldScene } from '@/components/landing/RiceFieldScene';

import { supabase } from '@/lib/supabase';
import { getRequestSlipNumber } from '@/components/RequestSlip';
import FeedbackModal from '@/components/FeedbackModal';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { PortalHeader } from '@/components/portal/PortalHeader';
import { StageLayout } from '@/components/portal/StageLayout';
import { ProfilePill } from '@/components/portal/ProfilePill';
import {
  AnnouncementBar,
  ShortcutButton,
  StagePanel,
  TaskRow,
} from '@/components/portal/StageWidgets';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import {
  AlertIcon,
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
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
        <div className="h-[68px] border-b border-line bg-white" />
        <div className="page-shell py-10">
          <div className="skeleton h-8 w-64 rounded-full" />
          <div className="mt-3 skeleton h-4 w-96 max-w-full rounded-full" />
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="skeleton h-44 rounded-[20px] lg:col-span-2" />
            <div className="skeleton h-44 rounded-[20px]" />
          </div>
          <div className="mt-4 skeleton h-64 rounded-[20px]" />
        </div>
      </div>
    );
  }

  const firstName = profile.full_name?.split(' ')[0] || 'Resident';
  const pendingCount = requests.filter((request) => request.status === 'pending').length;
  const readyCount = requests.filter((request) => request.status === 'ready').length;

  return (
    <div className="min-h-screen bg-mist/60 pb-24 md:pb-16">
      <PortalHeader
        name={profile.full_name || 'Resident'}
        role={profile.role || 'resident'}
        isVerified={Boolean(profile.is_verified)}
        active="overview"
        onOpenId={() => setShowIdModal(true)}
      />

      <StageLayout className="pb-24 md:pb-16" contentClassName="p-3 sm:p-5">
      <main className="page-shell py-5">
        {pageNotice && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-[#cfe7f1] bg-sky px-4 py-3 text-sm font-semibold text-[#3a6478]"
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

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <ProfilePill
            name={profile.full_name || 'Resident'}
            roleLabel={profile.role === 'admin' ? 'Administrator' : 'Resident'}
            statusLabel={profile.is_verified ? 'Verified' : 'Awaiting verification'}
            statusTone={profile.is_verified ? 'green' : 'gold'}
          />
          <p className="text-xs font-semibold text-muted">
            {requests.length} {requests.length === 1 ? 'request' : 'requests'} on record
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.7fr_0.95fr]">
          <StagePanel title="What I can do today" icon="check">
            {pendingCount > 0 ? (
              <TaskRow
                icon="clock"
                title={`${pendingCount} request${pendingCount === 1 ? '' : 's'} under review`}
                description="Barangay staff will update each slip when it has been reviewed."
                action={
                  <ButtonLink href="#history" variant="secondary" size="sm">
                    View my requests
                  </ButtonLink>
                }
              />
            ) : null}
            {readyCount > 0 ? (
              <TaskRow
                icon="check"
                title={`${readyCount} document${readyCount === 1 ? '' : 's'} ready for pickup`}
                description="Check the request history for your slip number and status."
                action={
                  <ButtonLink href="#history" variant="secondary" size="sm">
                    View pickup details
                  </ButtonLink>
                }
              />
            ) : null}
            {!profile.is_verified && (
              <TaskRow
                icon="shield"
                title="Resident verification in progress"
                description="Barangay staff review resident records. Your ID card becomes available after verification."
              />
            )}
            {pendingCount === 0 && readyCount === 0 && profile.is_verified && (
              <TaskRow
                icon="sprout"
                title="You are all caught up"
                description="Start a document request whenever you need a barangay certificate."
                action={
                  <ButtonLink href="/dashboard/request" variant="secondary" size="sm">
                    Submit a request
                  </ButtonLink>
                }
              />
            )}
          </StagePanel>

          <div className="grid gap-4">
          {/* Welcome */}
          <section className="animate-fade-up relative overflow-hidden rounded-[24px] border-2 border-line bg-white p-6 shadow-card sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 bg-mint/70"
            />
            <div className="relative z-10 sm:grid sm:grid-cols-[1.5fr_auto] sm:items-center sm:gap-6">
              <div>
                <p className="eyebrow">
                  {profile.is_verified ? 'Verified resident' : 'Verification in progress'}
                </p>
                <h1 className="heading-1 mt-2">Mabalos, {firstName}!</h1>
                <p className="body-md mt-2 max-w-xl">
                  {profile.is_verified
                    ? 'Your resident record is confirmed. You can request documents and print your resident ID.'
                    : 'Your account is registered. Barangay staff still need to verify your record before a resident ID is issued.'}
                </p>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <ButtonLink href="/dashboard/request" size="md">
                    <ClipboardIcon className="h-4 w-4" />
                    Request a document
                  </ButtonLink>
                </div>
              </div>

              <div className="relative mt-6 hidden h-36 overflow-hidden rounded-[20px] border-2 border-line bg-sky sm:mt-0 sm:block sm:w-[190px] lg:w-[210px]">
                <RiceFieldScene className="absolute inset-0 h-full w-full" />
              </div>
            </div>
          </section>

          {/* Record summary */}
          <section className="animate-fade-up delay-1 rounded-[24px] border-2 border-line bg-white p-6 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="heading-3">Resident record</h2>
              <Badge tone={profile.is_verified ? 'green' : 'gold'}>
                {profile.is_verified ? 'Verified' : 'Pending'}
              </Badge>
            </div>

            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted">
                  Full name
                </dt>
                <dd className="mt-0.5 text-sm font-bold text-forest">
                  {profile.full_name || 'Not provided'}
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted">
                  Address
                </dt>
                <dd className="mt-0.5 flex items-start gap-1.5 text-sm font-semibold text-forest/80">
                  <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-pine" />
                  {profile.address || 'Not provided'}
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted">
                  Resident ID number
                </dt>
                <dd className="mt-0.5 font-mono text-sm font-bold text-forest">
                  {profile.bid_number || 'Assigned after verification'}
                </dd>
              </div>
            </dl>

            <div id="my-id" className="mt-5 scroll-mt-24 border-t border-line pt-4">
              {profile.is_verified ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowIdModal(true)}
                >
                  <IdCardIcon className="h-4 w-4" />
                  Open my ID card
                </Button>
              ) : (
                <p className="rounded-xl border border-[#f2dfb6] bg-pending-bg p-3 text-xs font-semibold leading-relaxed text-pending-ink">
                  A resident ID is issued after staff verify your record. Bring a valid ID
                  when visiting the barangay desk.
                </p>
              )}
            </div>
          </section>
          </div>

          <StagePanel title="Quick links" icon="home">
            <div className="grid gap-2.5">
              <ShortcutButton
                icon="request"
                title="Request a document"
                description="Start one of the five available services."
                href="/dashboard/request"
              />
              <ShortcutButton
                icon="home"
                title="My request history"
                description="See slip numbers, current status, and staff feedback."
                href="#history"
              />
              <ShortcutButton
                icon="news"
                title="Announcements"
                description="Read updates posted by barangay staff."
                href="/dashboard/announcements"
              />
              {profile.is_verified ? (
                <ShortcutButton
                  icon="id"
                  title="My resident ID"
                  description="Open, save, or print your verified ID card."
                  onClick={() => setShowIdModal(true)}
                />
              ) : (
                <ShortcutButton
                  icon="id"
                  title="Resident record"
                  description="Your resident ID is available after verification."
                  href="#my-id"
                />
              )}
            </div>
          </StagePanel>
        </div>

        {/* Status strip */}
        <div className="animate-fade-up delay-2 mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Pending review',
              value: pendingCount,
              icon: <ClockIcon className="h-4.5 w-4.5" />,
              tone: 'bg-pending-bg text-pending-ink',
            },
            {
              label: 'Ready for pickup',
              value: readyCount,
              icon: <CheckCircleIcon className="h-4.5 w-4.5" />,
              tone: 'bg-mint text-pine',
            },
            {
              label: 'Total requests',
              value: requests.length,
              icon: <ClipboardIcon className="h-4.5 w-4.5" />,
              tone: 'bg-sky text-[#3a6478]',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-2xl border-2 border-line bg-white px-4 py-3.5 shadow-subtle"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}>
                {item.icon}
              </span>
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted">
                  {item.label}
                </p>
                <p className="font-display text-xl font-extrabold text-forest">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Announcements */}
        <section className="animate-fade-up delay-3 mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Noticeboard</p>
              <h2 className="heading-2 mt-1">Latest from the barangay</h2>
            </div>
            <Link
              href="/dashboard/announcements"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-pine transition hover:gap-2.5"
            >
              View all announcements <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {latestAnnouncements.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {latestAnnouncements.slice(0, 3).map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} compact />
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border-2 border-dashed border-line bg-subtle p-4 sm:flex-row sm:items-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky text-[#3a6478]">
                <BellIcon className="h-5 w-5" />
              </span>
              <p className="flex-1 text-sm font-semibold leading-relaxed text-muted">
                {announcementsAvailable
                  ? 'No announcements have been published yet. Barangay updates will appear here.'
                  : 'The online noticeboard is being set up. Barangay updates will appear here.'}
              </p>
              <Link
                href="/dashboard/announcements"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-pine transition hover:gap-2.5"
              >
                Open noticeboard <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Quick services */}
        <section className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="heading-2">Start a new request</h2>
              <p className="body-sm mt-1">
                Choose a document. You can review the form before submitting.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SERVICES.slice(0, 3).map((service) => (
              <Link
                key={service.slug}
                href={`/dashboard/request?service=${encodeURIComponent(service.name)}`}
                className="interactive-card group flex items-start gap-3 rounded-2xl border-2 border-line bg-white p-4 shadow-subtle"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-pine">
                  <ClipboardIcon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold text-forest">
                    {service.name}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium leading-relaxed text-muted">
                    {service.short}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-6">
          <AnnouncementBar
            title={latestAnnouncements[0]?.title || 'No published announcements yet'}
            description={
              latestAnnouncements[0]
                ? 'Read the latest update from barangay staff.'
                : announcementsAvailable
                  ? 'New barangay updates will appear here after staff publish them.'
                  : 'The online noticeboard is being set up.'
            }
            action={
              <ButtonLink href="/dashboard/announcements" variant="secondary" size="sm">
                Read announcements
              </ButtonLink>
            }
          />
        </div>

        {/* Request history */}
        <section className="mt-10" id="history">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="heading-2">Request history</h2>
              <p className="body-sm mt-1">
                Follow each slip from review to pickup. Rejected requests show the staff
                feedback below.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[20px] border-2 border-line bg-white shadow-card">
            {requests.length === 0 ? (
              <div className="p-5">
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
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {requests.map((request) => (
                  <li key={request.id} className="p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-extrabold text-forest">
                            {request.service_type}
                          </p>
                          <StatusBadge status={request.status} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-muted">
                          <span className="font-mono text-[0.6875rem] font-bold tracking-wide text-pine">
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

                      <div className="flex shrink-0 items-center gap-2">
                        {(request.status === 'received' || request.status === 'rejected') && (
                          <Button
                            variant="dangerSoft"
                            size="sm"
                            onClick={() => setRequestToHide(request)}
                            disabled={deletingRequestId === request.id}
                          >
                            <TrashIcon className="h-4 w-4" />
                            {deletingRequestId === request.id ? 'Removing…' : 'Remove'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {request.status === 'rejected' && request.rejection_reason && (
                      <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#f1cccc] bg-rejected-bg p-3.5">
                        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-rejected-ink" />
                        <div>
                          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-rejected-ink">
                            Staff feedback
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-[#7c3535]">
                            {request.rejection_reason}
                          </p>
                        </div>
                      </div>
                    )}

                    {request.status === 'ready' && (
                      <p className="mt-3 flex items-center gap-2 rounded-xl border border-[#c4e3d5] bg-mint px-3.5 py-2.5 text-xs font-semibold text-pine">
                        <CheckCircleIcon className="h-4 w-4" />
                        Ready for pickup at the barangay desk. Bring a valid ID.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
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
            className="relative flex h-[270px] w-full max-w-[430px] shrink-0 flex-col overflow-hidden rounded-[20px] border border-line bg-white"
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
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1">
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
              <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-[0.5rem] font-bold uppercase tracking-[0.1em] text-pine">
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
