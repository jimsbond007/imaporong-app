'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';

import { supabase } from '@/lib/supabase';
import RequestSlip, { getRequestSlipNumber } from '@/components/RequestSlip';
import FeedbackModal from '@/components/FeedbackModal';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button, buttonClasses } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { StageLayout } from '@/components/portal/StageLayout';
import { ProfilePill } from '@/components/portal/ProfilePill';
import {
  AnnouncementBar,
  FeatureCard,
  ShortcutButton,
  StagePanel,
  TaskRow,
} from '@/components/portal/StageWidgets';
import {
  AlertIcon,
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardIcon,
  ClockIcon,
  DownloadIcon,
  FileTextIcon,
  IdCardIcon,
  LogOutIcon,
  PencilIcon,
  PlusIcon,
  PrinterIcon,
  SearchIcon,
  ShieldCheckIcon,
  TrashIcon,
  UploadIcon,
  UsersIcon,
} from '@/components/ui/icons';
import type { Announcement, ResidentRow, ServiceRequestRow } from '@/lib/types';
import imapMark from '@/assets/illustrations/imap.svg';

type Tab = 'residents' | 'requests' | 'calendar' | 'announcements';
type Feedback = { type: 'error' | 'success'; message: string } | null;

function parseCsvRow(row: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    if (character === '"' && quoted && row[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += character;
    }
  }

  cells.push(cell.trim());
  return cells;
}

function normalizeGender(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'female' || normalized === 'male') {
    return normalized[0].toUpperCase() + normalized.slice(1);
  }
  if (normalized === 'other') return 'Other';
  if (normalized === 'prefer not to say') return 'Prefer not to say';
  return null;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

const ANNOUNCEMENT_CATEGORIES = ['General', 'Advisory', 'Health', 'Schedule', 'Program'];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('requests');

  const [residents, setResidents] = useState<ResidentRow[]>([]);
  const [requests, setRequests] = useState<ServiceRequestRow[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsReady, setAnnouncementsReady] = useState(true);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Resident registry
  const [residentSearch, setResidentSearch] = useState('');
  const [residentBusy, setResidentBusy] = useState(false);
  const [showResidentForm, setShowResidentForm] = useState(false);
  const [editingResident, setEditingResident] = useState<ResidentRow | null>(null);
  const [residentToDelete, setResidentToDelete] = useState<ResidentRow | null>(null);
  const [residentForm, setResidentForm] = useState({
    full_name: '',
    address: '',
    age: '',
    gender: '',
  });
  const residentImportRef = useRef<HTMLInputElement>(null);

  // Requests
  const [requestFilter, setRequestFilter] = useState<'active' | 'pending' | 'ready'>(
    'active',
  );
  const [requestSearch, setRequestSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestRow | null>(null);
  const [requestToReject, setRequestToReject] = useState<ServiceRequestRow | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [savingRejection, setSavingRejection] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  // Slip
  const [slipRequest, setSlipRequest] = useState<ServiceRequestRow | null>(null);
  const slipRef = useRef<HTMLDivElement>(null);

  // Calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateRequests, setSelectedDateRequests] = useState<
    ServiceRequestRow[] | null
  >(null);
  const [selectedDateLabel, setSelectedDateLabel] = useState('');

  // Announcements
  const [announcementForm, setAnnouncementForm] = useState({
    id: null as string | null,
    title: '',
    body: '',
    category: 'General',
    published: true,
  });
  const [announcementBusy, setAnnouncementBusy] = useState(false);
  const [announcementError, setAnnouncementError] = useState('');
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(
    null,
  );

  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  const showFeedback = (type: 'error' | 'success', message: string) => {
    setFeedback({ type, message });
  };

  const fetchData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const [residentResult, requestResult, announcementResult] = await Promise.all([
        supabase.from('residents').select('*').order('full_name'),
        supabase
          .from('service_requests')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('announcements')
          .select('*')
          .order('published_at', { ascending: false }),
      ]);

      if (residentResult.error) {
        console.error('Resident registry fetch failed:', residentResult.error);
        showFeedback(
          'error',
          `Could not load the resident registry. ${residentResult.error.message}`,
        );
      } else {
        setResidents((residentResult.data ?? []) as ResidentRow[]);
      }

      if (requestResult.error) {
        console.error('Service request fetch failed:', requestResult.error);
        showFeedback('error', `Could not load service requests. ${requestResult.error.message}`);
      } else {
        setRequests((requestResult.data ?? []) as ServiceRequestRow[]);
      }

      if (announcementResult.error) {
        setAnnouncementsReady(false);
        setAnnouncements([]);
      } else {
        setAnnouncementsReady(true);
        setAnnouncements((announcementResult.data ?? []) as Announcement[]);
      }
    } catch (error) {
      console.error('Admin fetch failed:', error);
      showFeedback('error', 'Could not load the staff workspace. Please refresh the page.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    // Kick off the first load without a synchronous state update, so the
    // initial skeleton renders before data arrives.
    const load = async () => {
      const results = await Promise.all([
        supabase.from('residents').select('*').order('full_name'),
        supabase
          .from('service_requests')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('announcements')
          .select('*')
          .order('published_at', { ascending: false }),
      ]);

      if (cancelled) return;

      const [residentResult, requestResult, announcementResult] = results;

      if (residentResult.error) {
        console.error('Resident registry fetch failed:', residentResult.error);
        setFeedback({
          type: 'error',
          message: `Could not load the resident registry. ${residentResult.error.message}`,
        });
      } else {
        setResidents((residentResult.data ?? []) as ResidentRow[]);
      }

      if (requestResult.error) {
        console.error('Service request fetch failed:', requestResult.error);
        setFeedback({
          type: 'error',
          message: `Could not load service requests. ${requestResult.error.message}`,
        });
      } else {
        setRequests((requestResult.data ?? []) as ServiceRequestRow[]);
      }

      if (announcementResult.error) {
        setAnnouncementsReady(false);
        setAnnouncements([]);
      } else {
        setAnnouncementsReady(true);
        setAnnouncements((announcementResult.data ?? []) as Announcement[]);
      }

      setLoading(false);
      setRefreshing(false);
    };

    load().catch((error) => {
      if (cancelled) return;
      console.error('Admin fetch failed:', error);
      setFeedback({
        type: 'error',
        message: 'Could not load the staff workspace. Please refresh the page.',
      });
      setLoading(false);
      setRefreshing(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
    router.refresh();
  };

  // --------------------------------------------------------------- Residents
  const approveResident = async (resident: ResidentRow) => {
    setResidentBusy(true);
    try {
      if (resident.profile_id) {
        const bidNumber = `MPRNG-${new Date().getFullYear()}-${Math.floor(
          1000 + Math.random() * 9000,
        )}`;
        const { error } = await supabase
          .from('profiles')
          .update({ is_verified: true, bid_number: bidNumber })
          .eq('id', resident.profile_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('residents')
          .update({ is_verified: true })
          .eq('id', resident.id);
        if (error) throw error;
      }

      await fetchData();
      showFeedback(
        'success',
        `${resident.full_name} is verified as a bona fide resident.`,
      );
    } catch (error) {
      console.error('Failed to verify resident:', error);
      showFeedback('error', `Could not verify resident: ${(error as Error).message}`);
    } finally {
      setResidentBusy(false);
    }
  };

  const openNewResidentForm = () => {
    setEditingResident(null);
    setResidentForm({ full_name: '', address: '', age: '', gender: '' });
    setShowResidentForm(true);
  };

  const openEditResidentForm = (resident: ResidentRow) => {
    setEditingResident(resident);
    setResidentForm({
      full_name: resident.full_name,
      address: resident.address,
      age: resident.age?.toString() ?? '',
      gender: resident.gender ?? '',
    });
    setShowResidentForm(true);
  };

  const saveResident = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const age = residentForm.age.trim() ? Number(residentForm.age) : null;

    if (age !== null && (!Number.isInteger(age) || age < 0 || age > 120)) {
      showFeedback('error', 'Enter a valid age between 0 and 120.');
      return;
    }

    setResidentBusy(true);
    try {
      const values = {
        full_name: residentForm.full_name.trim(),
        address: residentForm.address.trim(),
        age,
        gender: residentForm.gender || null,
      };

      const { error } = editingResident
        ? await supabase.rpc('admin_update_resident_record', {
            p_resident_id: editingResident.id,
            p_full_name: values.full_name,
            p_address: values.address,
            p_age: values.age,
            p_gender: values.gender,
          })
        : await supabase.from('residents').insert(values);

      if (error) throw error;

      setShowResidentForm(false);
      setEditingResident(null);
      await fetchData();
      showFeedback('success', editingResident ? 'Resident record updated.' : 'Resident record added.');
    } catch (error) {
      console.error('Failed to save resident:', error);
      showFeedback('error', `Could not save resident: ${(error as Error).message}`);
    } finally {
      setResidentBusy(false);
    }
  };

  const deleteResident = async () => {
    if (!residentToDelete) return;
    setResidentBusy(true);
    try {
      const { error } = await supabase
        .from('residents')
        .delete()
        .eq('id', residentToDelete.id);
      if (error) throw error;

      const name = residentToDelete.full_name;
      setResidentToDelete(null);
      await fetchData();
      showFeedback('success', `${name} was removed from the resident registry.`);
    } catch (error) {
      console.error('Failed to delete resident:', error);
      showFeedback('error', `Could not remove resident: ${(error as Error).message}`);
    } finally {
      setResidentBusy(false);
    }
  };

  const importResidentRoster = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = (await file.text()).replace(/^\uFEFF/, '');
      const rows = text
        .split(/\r?\n/)
        .filter((row) => row.trim())
        .map(parseCsvRow);

      if (rows.length < 2) {
        showFeedback('error', 'The CSV must include a header row and at least one resident.');
        return;
      }

      const headers = rows[0].map((header) =>
        header.trim().toLowerCase().replace(/[\s_-]+/g, ''),
      );
      const nameIndex = headers.findIndex((header) =>
        ['name', 'fullname', 'residentname'].includes(header),
      );
      const addressIndex = headers.findIndex((header) =>
        ['address', 'homeaddress', 'purok'].includes(header),
      );
      const ageIndex = headers.findIndex((header) => header === 'age');
      const genderIndex = headers.findIndex((header) => ['gender', 'sex'].includes(header));

      if (nameIndex < 0 || addressIndex < 0) {
        showFeedback(
          'error',
          'CSV needs Name and Address columns. Age and Gender columns are optional.',
        );
        return;
      }

      const seen = new Set(
        residents.map(
          (resident) =>
            `${resident.full_name.trim().toLowerCase()}|${resident.address
              .trim()
              .toLowerCase()}`,
        ),
      );
      const entries: Array<{
        full_name: string;
        address: string;
        age: number | null;
        gender: string | null;
      }> = [];
      const errors: string[] = [];

      rows.slice(1).forEach((row, index) => {
        const full_name = row[nameIndex]?.trim() || '';
        const address = row[addressIndex]?.trim() || '';
        const rowNumber = index + 2;
        const ageValue = ageIndex >= 0 ? row[ageIndex]?.trim() || '' : '';
        const age = ageValue ? Number(ageValue) : null;
        const genderValue = genderIndex >= 0 ? row[genderIndex]?.trim() || '' : '';
        const gender = genderValue ? normalizeGender(genderValue) : null;

        if (!full_name || !address) {
          errors.push(`Row ${rowNumber}: name and address are required.`);
          return;
        }
        if (ageValue && (!Number.isInteger(age) || age === null || age < 0 || age > 120)) {
          errors.push(`Row ${rowNumber}: age must be between 0 and 120.`);
          return;
        }
        if (genderValue && !gender) {
          errors.push(
            `Row ${rowNumber}: gender must be Female, Male, Other, or Prefer not to say.`,
          );
          return;
        }

        const identity = `${full_name.toLowerCase()}|${address.toLowerCase()}`;
        if (seen.has(identity)) return;
        seen.add(identity);
        entries.push({ full_name, address, age, gender });
      });

      if (errors.length) {
        showFeedback(
          'error',
          `Import stopped without adding records. ${errors.slice(0, 3).join(' ')}${
            errors.length > 3 ? ` Plus ${errors.length - 3} more issue(s).` : ''
          }`,
        );
        return;
      }
      if (!entries.length) {
        showFeedback('error', 'No new residents found in the CSV.');
        return;
      }

      setResidentBusy(true);
      const { error } = await supabase.from('residents').insert(entries);
      if (error) throw error;

      await fetchData();
      showFeedback('success', `Imported ${entries.length} resident record(s).`);
    } catch (error) {
      console.error('Failed to import roster:', error);
      showFeedback('error', 'Could not read the file. Please upload a valid CSV roster.');
    } finally {
      setResidentBusy(false);
    }
  };

  // ---------------------------------------------------------------- Requests
  const updateRequestStatus = async (
    request: ServiceRequestRow,
    status: 'ready' | 'received',
  ) => {
    setBusyRequestId(request.id);
    try {
      const payload =
        status === 'received'
          ? { status, received_at: new Date().toISOString() }
          : { status };

      const { error } = await supabase
        .from('service_requests')
        .update(payload)
        .eq('id', request.id);
      if (error) throw error;

      setSelectedRequest(null);
      await fetchData();
      showFeedback(
        'success',
        status === 'ready'
          ? `Request ${getRequestSlipNumber(request)} is ready for pickup.`
          : `Request ${getRequestSlipNumber(request)} was marked received.`,
      );
    } catch (error) {
      console.error('Failed to update request:', error);
      showFeedback('error', `Could not update request: ${(error as Error).message}`);
    } finally {
      setBusyRequestId(null);
    }
  };

  const rejectRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requestToReject) return;

    const reason = rejectionReason.trim();
    if (!reason) {
      setRejectionError('Please enter a reason before submitting.');
      return;
    }

    setSavingRejection(true);
    setRejectionError('');

    const { error } = await supabase
      .from('service_requests')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', requestToReject.id);

    if (error) {
      setRejectionError(`Could not reject this request: ${error.message}`);
      setSavingRejection(false);
      return;
    }

    if (selectedRequest?.id === requestToReject.id) setSelectedRequest(null);
    setRequestToReject(null);
    setRejectionReason('');
    setSavingRejection(false);
    await fetchData();
    showFeedback('success', 'Request rejected. The reason is visible to the resident.');
  };

  const downloadSlip = async () => {
    if (!slipRef.current || !slipRequest) return;
    try {
      const dataUrl = await toPng(slipRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Request-Slip-${getRequestSlipNumber(slipRequest)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to download slip:', error);
      setNotice({
        title: 'Could Not Download Slip',
        message: 'Could not generate the slip image. Please try printing instead.',
      });
    }
  };

  const printSlip = async () => {
    if (!slipRef.current) return;
    try {
      const dataUrl = await toPng(slipRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });

      const frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true');
      frame.style.position = 'fixed';
      frame.style.right = '0';
      frame.style.bottom = '0';
      frame.style.width = '0';
      frame.style.height = '0';
      frame.style.border = '0';
      document.body.appendChild(frame);

      const frameWindow = frame.contentWindow;
      const frameDocument = frameWindow?.document;
      if (!frameWindow || !frameDocument) {
        frame.remove();
        throw new Error('Print frame unavailable');
      }

      frameDocument.open();
      frameDocument.write(`<!doctype html><html><head><title>Request Slip</title><style>
        @page { size: A4 portrait; margin: 12mm; }
        html, body { margin: 0; padding: 0; background: #ffffff; }
        img { display: block; width: 100%; height: auto; }
      </style></head><body><img src="${dataUrl}" alt="Request Slip" /></body></html>`);
      frameDocument.close();

      const cleanup = () => frame.remove();
      frameWindow.onafterprint = cleanup;

      const triggerPrint = () => {
        frameWindow.focus();
        frameWindow.print();
        window.setTimeout(cleanup, 60000);
      };

      const image = frameDocument.querySelector('img');
      if (image && !image.complete) {
        image.addEventListener('load', triggerPrint, { once: true });
        image.addEventListener(
          'error',
          () => {
            cleanup();
            setNotice({
              title: 'Could Not Print Slip',
              message: 'The slip image could not be prepared. Please try again.',
            });
          },
          { once: true },
        );
      } else {
        triggerPrint();
      }
    } catch (error) {
      console.error('Failed to print slip:', error);
      setNotice({
        title: 'Could Not Print Slip',
        message: 'Could not prepare the slip for printing. Please try again.',
      });
    }
  };

  // ------------------------------------------------------------- Announcements
  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      id: null,
      title: '',
      body: '',
      category: 'General',
      published: true,
    });
    setAnnouncementError('');
  };

  const saveAnnouncement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAnnouncementError('');

    if (announcementForm.title.trim().length < 3) {
      setAnnouncementError('Add a title with at least 3 characters.');
      return;
    }
    if (announcementForm.body.trim().length < 3) {
      setAnnouncementError('Add the announcement text.');
      return;
    }

    setAnnouncementBusy(true);
    try {
      const payload = {
        title: announcementForm.title.trim(),
        body: announcementForm.body.trim(),
        category: announcementForm.category,
        published: announcementForm.published,
      };

      if (announcementForm.id) {
        const existing = announcements.find(
          (announcement) => announcement.id === announcementForm.id,
        );
        const shouldRestamp =
          announcementForm.published && existing && !existing.published;

        const { error } = await supabase
          .from('announcements')
          .update(shouldRestamp ? { ...payload, published_at: new Date().toISOString() } : payload)
          .eq('id', announcementForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('announcements').insert({
          ...payload,
          published_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      resetAnnouncementForm();
      await fetchData();
      showFeedback(
        'success',
        announcementForm.id ? 'Announcement updated.' : 'Announcement published to the landing page.',
      );
    } catch (error) {
      console.error('Failed to save announcement:', error);
      setAnnouncementError(`Could not save this announcement: ${(error as Error).message}`);
    } finally {
      setAnnouncementBusy(false);
    }
  };

  const editAnnouncement = (announcement: Announcement) => {
    setAnnouncementForm({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      category: announcement.category,
      published: announcement.published,
    });
    setAnnouncementError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteAnnouncement = async () => {
    if (!announcementToDelete) return;
    setAnnouncementBusy(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementToDelete.id);
      if (error) throw error;
      setAnnouncementToDelete(null);
      await fetchData();
      showFeedback('success', 'Announcement deleted.');
    } catch (error) {
      showFeedback('error', `Could not delete announcement: ${(error as Error).message}`);
    } finally {
      setAnnouncementBusy(false);
    }
  };

  // ------------------------------------------------------------------ Derived
  const activeRequests = requests.filter(
    (request) => request.status === 'pending' || request.status === 'ready',
  );
  const pendingRequests = requests.filter((request) => request.status === 'pending');
  const readyRequests = requests.filter((request) => request.status === 'ready');
  const pendingVerification = residents.filter((resident) => !resident.is_verified);

  const filteredRequests = requests
    .filter((request) => {
      if (requestFilter === 'pending') return request.status === 'pending';
      if (requestFilter === 'ready') return request.status === 'ready';
      return request.status === 'pending' || request.status === 'ready';
    })
    .filter((request) => {
      const term = requestSearch.trim().toLowerCase();
      if (!term) return true;
      return `${request.full_name} ${request.service_type} ${getRequestSlipNumber(request)}`
        .toLowerCase()
        .includes(term);
    });

  const searchTerm = residentSearch.trim().toLowerCase();
  const filteredResidents = residents.filter((resident) =>
    [resident.full_name, resident.address, resident.gender ?? '', resident.age?.toString() ?? '']
      .some((value) => value.toLowerCase().includes(searchTerm)),
  );

  const demographics = {
    female: residents.filter((resident) => resident.gender?.toLowerCase() === 'female').length,
    male: residents.filter((resident) => resident.gender?.toLowerCase() === 'male').length,
    other: residents.filter(
      (resident) => resident.gender && !['female', 'male'].includes(resident.gender.toLowerCase()),
    ).length,
    under18: residents.filter((resident) => resident.age !== null && resident.age < 18).length,
    adult: residents.filter(
      (resident) => resident.age !== null && resident.age >= 18 && resident.age < 60,
    ).length,
    senior: residents.filter((resident) => resident.age !== null && resident.age >= 60).length,
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getRequestsForDate = (day: number) => {
    const target = new Date(year, month, day).toDateString();
    return requests.filter(
      (request) => new Date(request.created_at).toDateString() === target,
    );
  };

  const tabs: Array<{ key: Tab; label: string; icon: React.ReactNode; count?: number }> = [
    {
      key: 'requests',
      label: 'Requests',
      icon: <ClipboardIcon className="h-4 w-4" />,
      count: activeRequests.length,
    },
    {
      key: 'residents',
      label: 'Residents',
      icon: <UsersIcon className="h-4 w-4" />,
      count: residents.length,
    },
    {
      key: 'announcements',
      label: 'Announcements',
      icon: <BellIcon className="h-4 w-4" />,
      count: announcements.length,
    },
    { key: 'calendar', label: 'Calendar', icon: <CalendarIcon className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-mist/60">
        <div className="h-[68px] border-b border-line bg-white" />
        <div className="page-shell py-10">
          <div className="skeleton h-8 w-72 rounded-full" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton h-28 rounded-[20px]" />
            ))}
          </div>
          <div className="mt-4 skeleton h-80 rounded-[20px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Staff header */}
      <header className="sticky top-0 z-40 border-b-2 border-line bg-white">
        <div className="page-shell flex h-[68px] items-center justify-between gap-3">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-mist p-1">
              <Image
                src={imapMark}
                alt="iMaporong"
                priority
                className="h-full w-full object-contain"
              />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-display text-base font-extrabold tracking-tight text-forest">
                iMaporong
              </span>
              <span className="block text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted">
                Staff workspace
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            <span className="hidden items-center gap-1.5 rounded-full border border-[#c4e3d5] bg-mint px-2.5 py-1.5 text-[0.6875rem] font-bold text-pine sm:inline-flex">
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              Administrator
            </span>
            <Link
              href="/dashboard"
              aria-label="Open resident view"
              className={`${buttonClasses('quiet', 'sm')} px-2.5 text-xs`}
            >
              <IdCardIcon className="h-4 w-4" />
              <span>Resident</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className={`${buttonClasses('dangerQuiet', 'sm')} px-2.5 text-xs`}
            >
              <LogOutIcon className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>

        <nav
          aria-label="Staff workspace"
          className="page-shell no-scrollbar flex gap-1 overflow-x-auto pb-2.5"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-current={activeTab === tab.key ? 'page' : undefined}
              className={`inline-flex min-w-[84px] flex-col items-center justify-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition ${
                activeTab === tab.key
                  ? 'bg-mint text-pine'
                  : 'text-muted hover:bg-mist hover:text-forest'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.icon}
                {typeof tab.count === 'number' && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[0.625rem] font-extrabold ${
                      activeTab === tab.key
                        ? 'bg-white text-pine'
                        : 'bg-mist text-muted'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <StageLayout className="pb-16" contentClassName="p-3 sm:p-5">
      <main className="page-shell py-5">
        {feedback && (
          <div
            role={feedback.type === 'error' ? 'alert' : 'status'}
            className={`mb-5 flex items-start gap-2.5 rounded-2xl border p-3.5 text-sm font-semibold ${
              feedback.type === 'error'
                ? 'border-[#f1cccc] bg-rejected-bg text-rejected-ink'
                : 'border-[#c4e3d5] bg-mint text-pine'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span className="flex-1">{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-bold uppercase tracking-wide underline underline-offset-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'requests' && (
          <section className="mb-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <ProfilePill
                name="Barangay staff"
                roleLabel="Administrator"
                statusLabel={
                  pendingRequests.length + pendingVerification.length > 0
                    ? `${pendingRequests.length + pendingVerification.length} need review`
                    : 'All caught up'
                }
                statusTone={
                  pendingRequests.length + pendingVerification.length > 0 ? 'gold' : 'green'
                }
              />
              <p className="text-xs font-semibold text-muted">
                Staff workspace · Barangay Maporong
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.7fr_0.95fr]">
              <StagePanel title="Needs your attention" icon="alert">
                {pendingRequests.slice(0, 3).map((request) => (
                  <TaskRow
                    key={request.id}
                    icon="request"
                    title={request.service_type}
                    description={`${request.full_name} · ${getRequestSlipNumber(request)}`}
                    action={
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        Review request
                      </Button>
                    }
                  />
                ))}
                {pendingVerification.length > 0 && (
                  <TaskRow
                    icon="users"
                    title={`${pendingVerification.length} resident record${pendingVerification.length === 1 ? '' : 's'} need verification`}
                    description="Open the resident registry to review and verify resident records."
                    action={
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setActiveTab('residents')}
                      >
                        Review residents
                      </Button>
                    }
                  />
                )}
                {pendingRequests.length === 0 && pendingVerification.length === 0 && (
                  <TaskRow
                    icon="check"
                    title="All caught up"
                    description="There are no pending requests or resident records to verify."
                  />
                )}
              </StagePanel>

              <div className="grid gap-4 sm:grid-cols-2">
                <FeatureCard
                  icon="request"
                  title="Review service requests"
                  description={`${pendingRequests.length} pending for review · ${readyRequests.length} ready for pickup.`}
                  tone="forest"
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => setActiveTab('requests')}
                    >
                      Open request queue
                    </Button>
                  }
                />
                <FeatureCard
                  icon="news"
                  title="Share a barangay update"
                  description="Create or update a notice for residents in the online noticeboard."
                  tone="sky"
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => setActiveTab('announcements')}
                    >
                      Open announcements
                    </Button>
                  }
                />
              </div>

              <StagePanel title="Workspace modules" icon="home">
                <div className="grid gap-2.5">
                  <ShortcutButton
                    icon="request"
                    title="Requests"
                    description="Review, update, and print request slips."
                    onClick={() => setActiveTab('requests')}
                  />
                  <ShortcutButton
                    icon="users"
                    title="Residents"
                    description="Search, verify, and maintain resident records."
                    onClick={() => setActiveTab('residents')}
                  />
                  <ShortcutButton
                    icon="news"
                    title="Announcements"
                    description="Publish updates for residents."
                    onClick={() => setActiveTab('announcements')}
                  />
                  <ShortcutButton
                    icon="calendar"
                    title="Request calendar"
                    description="Browse request activity by date."
                    onClick={() => setActiveTab('calendar')}
                  />
                </div>
              </StagePanel>
            </div>

            <div className="mt-4">
              <AnnouncementBar
                title={
                  announcements.find((announcement) => announcement.published)?.title ||
                  'No published announcements yet'
                }
                description={
                  announcements.find((announcement) => announcement.published)
                    ? 'The latest notice currently published to residents.'
                    : announcementsReady
                      ? 'There are no published notices yet.'
                      : 'The online noticeboard is being set up.'
                }
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveTab('announcements')}
                  >
                    Open announcements
                  </Button>
                }
              />
            </div>
          </section>
        )}

        {/* Stats */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Resident records',
              value: residents.length,
              note: `${pendingVerification.length} awaiting verification`,
              icon: <UsersIcon className="h-5 w-5" />,
              tone: 'bg-mint text-pine',
            },
            {
              label: 'Active requests',
              value: activeRequests.length,
              note: `${pendingRequests.length} pending review`,
              icon: <ClipboardIcon className="h-5 w-5" />,
              tone: 'bg-sky text-[#3a6478]',
            },
            {
              label: 'Ready for pickup',
              value: readyRequests.length,
              note: 'Waiting at the barangay desk',
              icon: <CheckCircleIcon className="h-5 w-5" />,
              tone: 'bg-mint text-pine',
            },
            {
              label: 'Published notices',
              value: announcements.filter((announcement) => announcement.published).length,
              note: `${announcements.length} total announcements`,
              icon: <BellIcon className="h-5 w-5" />,
              tone: 'bg-[#fdf3de] text-[#8a6116]',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[20px] border-2 border-line bg-white p-5 shadow-card"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted">
                  {stat.label}
                </p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.tone}`}>
                  {stat.icon}
                </span>
              </div>
              <p className="mt-3 font-display text-3xl font-extrabold tracking-tight text-forest">
                {stat.value}
              </p>
              <p className="body-sm mt-1">{stat.note}</p>
            </div>
          ))}
        </section>

        {refreshing && (
          <p className="mt-3 text-xs font-semibold text-muted">Refreshing records…</p>
        )}

        {/* ------------------------------------------------------------- Requests */}
        {activeTab === 'requests' && (
          <section className="mt-5 overflow-hidden rounded-[20px] border-2 border-line bg-white shadow-card">
            <div className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="heading-2">Service request queue</h2>
                <p className="body-sm mt-1">
                  Review details, approve, reject, and print the request slip.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    value={requestSearch}
                    onChange={(event) => setRequestSearch(event.target.value)}
                    placeholder="Search name or slip"
                    aria-label="Search requests"
                    className="input-base pl-9 sm:w-56"
                  />
                </div>
                <div className="flex rounded-xl border border-line bg-mist p-1">
                  {(
                    [
                      ['active', 'Active'],
                      ['pending', 'Pending'],
                      ['ready', 'Ready'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRequestFilter(key)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        requestFilter === key
                          ? 'bg-white text-forest shadow-subtle'
                          : 'text-muted hover:text-forest'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<CheckCircleIcon className="h-5 w-5" />}
                  title="Nothing waiting in this view"
                  description={
                    requests.length
                      ? 'No requests match this filter. Try the active queue or clear the search.'
                      : 'New document requests from residents will appear here as soon as they are submitted.'
                  }
                />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {filteredRequests.map((request) => (
                  <li key={request.id} className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-extrabold text-forest">
                            {request.full_name}
                          </p>
                          <StatusBadge status={request.status} />
                          <Badge tone="sky">{request.service_type}</Badge>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-muted">
                          <span className="font-mono text-[0.6875rem] font-bold text-pine">
                            {getRequestSlipNumber(request)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {formatDate(request.created_at)}
                          </span>
                          {request.request_for && <span>For: {request.request_for}</span>}
                        </div>
                        {request.purpose && (
                          <p className="mt-2 line-clamp-2 max-w-2xl text-sm font-medium text-forest/70">
                            “{request.purpose}”
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => updateRequestStatus(request, 'ready')}
                            disabled={busyRequestId === request.id}
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Mark ready
                          </Button>
                        )}
                        {request.status === 'ready' && (
                          <Button
                            size="sm"
                            onClick={() => updateRequestStatus(request, 'received')}
                            disabled={busyRequestId === request.id}
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Mark received
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <FileTextIcon className="h-4 w-4" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ------------------------------------------------------------ Residents */}
        {activeTab === 'residents' && (
          <section className="mt-5 overflow-hidden rounded-[20px] border-2 border-line bg-white shadow-card">
            <div className="border-b border-line p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="heading-2">Resident registry</h2>
                  <p className="body-sm mt-1">
                    Includes residents with and without a portal account.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={residentImportRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={importResidentRoster}
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => residentImportRef.current?.click()}
                    disabled={residentBusy}
                  >
                    <UploadIcon className="h-4 w-4" />
                    Import CSV
                  </Button>
                  <Button size="sm" onClick={openNewResidentForm} disabled={residentBusy}>
                    <PlusIcon className="h-4 w-4" />
                    Add resident
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
                {[
                  ['Female', demographics.female],
                  ['Male', demographics.male],
                  ['Other / undisclosed', demographics.other],
                  ['Age 0–17', demographics.under18],
                  ['Age 18–59', demographics.adult],
                  ['Age 60+', demographics.senior],
                ].map(([label, count]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-line bg-subtle px-3 py-2.5"
                  >
                    <p className="text-[0.625rem] font-bold uppercase tracking-wide text-muted">
                      {label}
                    </p>
                    <p className="mt-0.5 font-display text-xl font-extrabold text-forest">
                      {count}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    value={residentSearch}
                    onChange={(event) => setResidentSearch(event.target.value)}
                    placeholder="Search name, address, age, or gender"
                    aria-label="Search residents"
                    className="input-base pl-9"
                  />
                </div>
                <p className="text-xs font-semibold text-muted">
                  CSV columns: Name, Address, Age, Gender.
                </p>
              </div>
            </div>

            {filteredResidents.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<UsersIcon className="h-5 w-5" />}
                  title={residents.length ? 'No residents match your search' : 'No residents yet'}
                  description={
                    residents.length
                      ? 'Try a shorter search term, or clear the search field.'
                      : 'Add a resident manually or import a CSV roster. Portal registrations appear here automatically.'
                  }
                  action={
                    !residents.length ? (
                      <Button size="sm" onClick={openNewResidentForm}>
                        <PlusIcon className="h-4 w-4" />
                        Add first resident
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left">
                  <thead className="border-b border-line bg-subtle text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted">
                    <tr>
                      <th className="px-5 py-3">Resident</th>
                      <th className="px-5 py-3">Gender</th>
                      <th className="px-5 py-3">Age group</th>
                      <th className="px-5 py-3">Address</th>
                      <th className="px-5 py-3">Account</th>
                      <th className="px-5 py-3">Verification</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredResidents.map((resident) => (
                      <tr key={resident.id} className="transition hover:bg-subtle">
                        <td className="px-5 py-3.5 text-sm font-bold text-forest">
                          {resident.full_name}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-forest/70">
                          {resident.gender || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-forest/70">
                          {resident.age === null
                            ? '—'
                            : resident.age < 18
                              ? '0–17'
                              : resident.age < 60
                                ? '18–59'
                                : '60+'}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-forest/70">
                          {resident.address}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge tone={resident.profile_id ? 'sky' : 'neutral'}>
                            {resident.profile_id ? 'Has account' : 'No account'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge tone={resident.is_verified ? 'green' : 'gold'}>
                            {resident.is_verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openEditResidentForm(resident)}
                              disabled={residentBusy}
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            {!resident.is_verified && (
                              <Button
                                size="sm"
                                onClick={() => approveResident(resident)}
                                disabled={residentBusy}
                              >
                                <ShieldCheckIcon className="h-3.5 w-3.5" />
                                Verify
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* --------------------------------------------------------- Announcements */}
        {activeTab === 'announcements' && (
          <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
            <form
              onSubmit={saveAnnouncement}
              className="h-fit rounded-[20px] border-2 border-line bg-white p-5 shadow-card lg:sticky lg:top-36"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="heading-2">
                  {announcementForm.id ? 'Edit announcement' : 'New announcement'}
                </h2>
                {announcementForm.id && (
                  <Button variant="ghost" size="sm" onClick={resetAnnouncementForm}>
                    Cancel edit
                  </Button>
                )}
              </div>
              <p className="body-sm mt-1">
                Published announcements appear on the public landing page immediately.
              </p>

              {!announcementsReady && (
                <div className="mt-3 rounded-xl border border-[#f2dfb6] bg-pending-bg p-3 text-xs font-semibold leading-relaxed text-pending-ink">
                  The announcements table is not available yet. Apply{' '}
                  <code className="font-mono">
                    20261105120000_security_hardening_and_announcements.sql
                  </code>{' '}
                  in Supabase, then refresh this page.
                </div>
              )}

              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="announcement-title" className="label-md block text-forest">
                    Title <span className="text-rejected-ink">*</span>
                  </label>
                  <input
                    id="announcement-title"
                    type="text"
                    required
                    maxLength={160}
                    value={announcementForm.title}
                    onChange={(event) =>
                      setAnnouncementForm((previous) => ({
                        ...previous,
                        title: event.target.value,
                      }))
                    }
                    placeholder="e.g. Barangay assembly this Saturday"
                    className="input-base mt-1.5"
                  />
                </div>

                <div>
                  <label
                    htmlFor="announcement-category"
                    className="label-md block text-forest"
                  >
                    Category
                  </label>
                  <select
                    id="announcement-category"
                    value={announcementForm.category}
                    onChange={(event) =>
                      setAnnouncementForm((previous) => ({
                        ...previous,
                        category: event.target.value,
                      }))
                    }
                    className="input-base mt-1.5"
                  >
                    {ANNOUNCEMENT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="announcement-body" className="label-md block text-forest">
                    Announcement text <span className="text-rejected-ink">*</span>
                  </label>
                  <textarea
                    id="announcement-body"
                    required
                    rows={7}
                    maxLength={4000}
                    value={announcementForm.body}
                    onChange={(event) =>
                      setAnnouncementForm((previous) => ({
                        ...previous,
                        body: event.target.value,
                      }))
                    }
                    placeholder="Write the details residents need to know."
                    className="input-base mt-1.5 resize-y"
                  />
                  <p className="mt-1 text-right text-xs font-medium text-muted">
                    {announcementForm.body.length}/4000
                  </p>
                </div>

                <label className="flex items-start gap-2.5 rounded-xl border border-line bg-subtle p-3">
                  <input
                    type="checkbox"
                    checked={announcementForm.published}
                    onChange={(event) =>
                      setAnnouncementForm((previous) => ({
                        ...previous,
                        published: event.target.checked,
                      }))
                    }
                    className="mt-0.5 h-4 w-4 accent-[#267653]"
                  />
                  <span>
                    <span className="block text-sm font-bold text-forest">Published</span>
                    <span className="block text-xs font-medium text-muted">
                      Uncheck to keep this as a draft without showing it publicly.
                    </span>
                  </span>
                </label>

                {announcementError && (
                  <p
                    role="alert"
                    className="rounded-xl border border-[#f1cccc] bg-rejected-bg p-3 text-sm font-semibold text-rejected-ink"
                  >
                    {announcementError}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={announcementBusy || !announcementsReady}
                >
                  {announcementBusy
                    ? 'Saving…'
                    : announcementForm.id
                      ? 'Save changes'
                      : 'Publish announcement'}
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="heading-2">All announcements</h2>
                  <p className="body-sm mt-1">
                    Newest first. Drafts are visible only in this workspace.
                  </p>
                </div>
                <Badge tone="neutral">{announcements.length} total</Badge>
              </div>

              {announcements.length === 0 ? (
                <div className="rounded-[20px] border-2 border-line bg-white p-5 shadow-card">
                  <EmptyState
                    icon={<BellIcon className="h-5 w-5" />}
                    title="No announcements yet"
                    description="Use the form to publish the first update to the community noticeboard."
                  />
                </div>
              ) : (
                announcements.map((announcement) => (
                  <article
                    key={announcement.id}
                    className="rounded-[20px] border-2 border-line bg-white p-5 shadow-card"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={announcement.published ? 'green' : 'gold'}>
                        {announcement.published ? 'Published' : 'Draft'}
                      </Badge>
                      <Badge tone="sky">{announcement.category}</Badge>
                      <span className="ml-auto text-xs font-semibold text-muted">
                        {formatDate(announcement.published_at)}
                      </span>
                    </div>

                    <h3 className="heading-3 mt-2.5">{announcement.title}</h3>
                    <p className="body-sm mt-1.5 whitespace-pre-wrap break-words">
                      {announcement.body}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => editAnnouncement(announcement)}
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="dangerSoft"
                        onClick={() => setAnnouncementToDelete(announcement)}
                        disabled={announcementBusy}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {/* -------------------------------------------------------------- Calendar */}
        {activeTab === 'calendar' && (
          <section className="mt-5 rounded-[20px] border-2 border-line bg-white p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="heading-2">Request calendar</h2>
                <p className="body-sm mt-1">
                  Every request is recorded by the date it was submitted.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  aria-label="Previous month"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <p className="min-w-[150px] text-center font-display text-base font-extrabold text-forest">
                  {currentDate.toLocaleString('en-PH', { month: 'long' })} {year}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  aria-label="Next month"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-[0.625rem] font-bold uppercase tracking-[0.1em] text-muted sm:gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1.5 sm:gap-2">
              {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="min-h-[64px] rounded-xl bg-subtle/60 sm:min-h-[86px]"
                />
              ))}

              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const dayRequests = getRequestsForDate(day);
                const hasRequests = dayRequests.length > 0;

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => {
                      setSelectedDateLabel(
                        new Date(year, month, day).toLocaleDateString('en-PH', {
                          dateStyle: 'full',
                        }),
                      );
                      setSelectedDateRequests(dayRequests);
                    }}
                    className={`flex min-h-[64px] flex-col justify-between rounded-xl border p-2 text-left transition sm:min-h-[86px] ${
                      hasRequests
                        ? 'border-[#c4e3d5] bg-mint/60 hover:bg-mint'
                        : 'border-line bg-white hover:bg-subtle'
                    }`}
                    aria-label={`${day} ${currentDate.toLocaleString('en-PH', {
                      month: 'long',
                    })} — ${dayRequests.length} request(s)`}
                  >
                    <span className="text-xs font-extrabold text-forest">{day}</span>
                    {hasRequests && (
                      <span className="inline-flex w-fit items-center rounded-full bg-pine px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide text-white">
                        {dayRequests.length} req
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-muted">
              <ClockIcon className="h-4 w-4 text-pine" />
              Click a date to inspect the requests recorded that day.
            </p>
          </section>
        )}
      </main>
      </StageLayout>

      {/* ------------------------------------------------------------- Modals */}

      {/* Request details */}
      <Modal
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        title={selectedRequest ? `Request ${getRequestSlipNumber(selectedRequest)}` : 'Request'}
        description={selectedRequest ? selectedRequest.service_type : undefined}
        size="md"
        footer={
          selectedRequest ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setSlipRequest(selectedRequest);
                  setSelectedRequest(null);
                }}
              >
                <PrinterIcon className="h-4 w-4" />
                View slip
              </Button>
              {selectedRequest.status === 'pending' && (
                <Button
                  variant="dangerSoft"
                  onClick={() => {
                    setRequestToReject(selectedRequest);
                    setRejectionReason('');
                    setRejectionError('');
                    setSelectedRequest(null);
                  }}
                >
                  Reject request
                </Button>
              )}
              {selectedRequest.status === 'pending' && (
                <Button
                  onClick={() => updateRequestStatus(selectedRequest, 'ready')}
                  disabled={busyRequestId === selectedRequest.id}
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Approve & mark ready
                </Button>
              )}
              {selectedRequest.status === 'ready' && (
                <Button
                  onClick={() => updateRequestStatus(selectedRequest, 'received')}
                  disabled={busyRequestId === selectedRequest.id}
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Mark received
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selectedRequest.status} />
              <Badge tone="sky">{selectedRequest.service_type}</Badge>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              {[
                ['Resident', selectedRequest.full_name],
                ['Age', selectedRequest.age ?? '—'],
                ['Sex', selectedRequest.sex || '—'],
                ['Civil status', selectedRequest.civil_status || '—'],
                ['Birth date', selectedRequest.birthday || '—'],
                ['Birth place', selectedRequest.birth_place || '—'],
                ['Address', selectedRequest.address || '—'],
                ['Contact', selectedRequest.cp_no || '—'],
                ['Height', selectedRequest.height || '—'],
                ['Weight', selectedRequest.weight || '—'],
                ['Requested for', selectedRequest.request_for || 'Self'],
                ['Submitted', formatDate(selectedRequest.created_at)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-line bg-subtle px-3 py-2.5"
                >
                  <dt className="text-[0.625rem] font-bold uppercase tracking-[0.1em] text-muted">
                    {label}
                  </dt>
                  <dd className="mt-0.5 break-words text-sm font-semibold text-forest">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            {selectedRequest.business && (
              <div className="rounded-xl border border-line bg-subtle px-3 py-2.5">
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.1em] text-muted">
                  Business · Capital
                </p>
                <p className="mt-0.5 text-sm font-semibold text-forest">
                  {selectedRequest.business} · {selectedRequest.capital || '—'}
                </p>
              </div>
            )}

            <div className="rounded-xl border border-[#cfe7f1] bg-sky px-3.5 py-3">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.1em] text-[#3a6478]">
                Purpose
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-[#22414f]">
                {selectedRequest.purpose || 'No purpose provided.'}
              </p>
            </div>

            {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
              <div className="rounded-xl border border-[#f1cccc] bg-rejected-bg px-3.5 py-3">
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.1em] text-rejected-ink">
                  Rejection feedback sent to resident
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-[#7c3535]">
                  {selectedRequest.rejection_reason}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject request */}
      {requestToReject && (
        <Modal
          open
          onClose={() => {
            if (!savingRejection) {
              setRequestToReject(null);
              setRejectionReason('');
              setRejectionError('');
            }
          }}
          title="Reject request"
          description={`${requestToReject.full_name} · ${requestToReject.service_type}`}
          tone="danger"
          size="md"
          busy={savingRejection}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setRequestToReject(null)}
                disabled={savingRejection}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                type="submit"
                form="reject-request-form"
                disabled={savingRejection || !rejectionReason.trim()}
              >
                {savingRejection ? 'Submitting…' : 'Submit rejection'}
              </Button>
            </>
          }
        >
          <form id="reject-request-form" onSubmit={rejectRequest} className="space-y-3">
            <label htmlFor="rejection-reason" className="label-md block text-forest">
              Reason for rejection <span className="text-rejected-ink">*</span>
            </label>
            <textarea
              id="rejection-reason"
              autoFocus
              required
              maxLength={1000}
              rows={5}
              value={rejectionReason}
              onChange={(event) => {
                setRejectionReason(event.target.value);
                setRejectionError('');
              }}
              placeholder="Explain what needs to be corrected or provided. This message is shown to the resident."
              className="input-base resize-y"
            />
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium leading-relaxed text-muted">
                The resident sees this in their request history.
              </p>
              <span className="shrink-0 text-xs text-muted">{rejectionReason.length}/1000</span>
            </div>
            {rejectionError && (
              <p
                role="alert"
                className="rounded-xl border border-[#f1cccc] bg-rejected-bg p-3 text-sm font-semibold text-rejected-ink"
              >
                {rejectionError}
              </p>
            )}
          </form>
        </Modal>
      )}

      {/* Request slip */}
      <Modal
        open={Boolean(slipRequest)}
        onClose={() => setSlipRequest(null)}
        title="Request slip"
        description={slipRequest ? getRequestSlipNumber(slipRequest) : undefined}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={downloadSlip}>
              <DownloadIcon className="h-4 w-4" />
              Download PNG
            </Button>
            <Button onClick={printSlip}>
              <PrinterIcon className="h-4 w-4" />
              Print slip
            </Button>
          </>
        }
      >
        {slipRequest && (
          <div className="rounded-xl border border-line bg-subtle p-3">
            <div ref={slipRef} className="bg-white">
              <RequestSlip request={slipRequest} />
            </div>
          </div>
        )}
      </Modal>

      {/* Print-only slip copy */}
      {slipRequest && (
        <div className="print-slip-area">
          <RequestSlip request={slipRequest} />
        </div>
      )}

      {/* Calendar day */}
      <Modal
        open={Boolean(selectedDateRequests)}
        onClose={() => setSelectedDateRequests(null)}
        title="Requests on this date"
        description={selectedDateLabel}
        size="md"
      >
        {selectedDateRequests && selectedDateRequests.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon className="h-5 w-5" />}
            title="No requests on this date"
            description="No document requests were submitted on this day."
          />
        ) : (
          <ul className="space-y-2.5">
            {selectedDateRequests?.map((request) => (
              <li
                key={request.id}
                className="flex flex-col gap-2 rounded-xl border border-line bg-subtle p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-forest">{request.full_name}</p>
                  <p className="text-xs font-semibold text-muted">
                    {request.service_type} · {getRequestSlipNumber(request)}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={request.status} />
                  </div>
                  {request.status === 'rejected' && request.rejection_reason && (
                    <p className="mt-2 rounded-lg border border-[#f1cccc] bg-rejected-bg p-2 text-xs font-medium leading-relaxed text-rejected-ink">
                      {request.rejection_reason}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSlipRequest(request);
                    setSelectedDateRequests(null);
                  }}
                >
                  <FileTextIcon className="h-4 w-4" />
                  View slip
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* Resident add/edit */}
      <Modal
        open={showResidentForm}
        onClose={() => {
          if (!residentBusy) setShowResidentForm(false);
        }}
        title={editingResident ? 'Edit resident' : 'Add resident'}
        description={
          editingResident?.profile_id
            ? 'Changes also update the linked resident account.'
            : 'Update the resident registry details.'
        }
        size="md"
        busy={residentBusy}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowResidentForm(false)}
              disabled={residentBusy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="resident-form"
              disabled={residentBusy}
            >
              {residentBusy ? 'Saving…' : editingResident ? 'Save changes' : 'Add resident'}
            </Button>
          </>
        }
      >
        <form id="resident-form" onSubmit={saveResident} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="resident-name" className="label-md block text-forest">
              Full name <span className="text-rejected-ink">*</span>
            </label>
            <input
              id="resident-name"
              required
              value={residentForm.full_name}
              onChange={(event) =>
                setResidentForm({ ...residentForm, full_name: event.target.value })
              }
              className="input-base mt-1.5"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="resident-address" className="label-md block text-forest">
              Address <span className="text-rejected-ink">*</span>
            </label>
            <input
              id="resident-address"
              required
              value={residentForm.address}
              onChange={(event) =>
                setResidentForm({ ...residentForm, address: event.target.value })
              }
              className="input-base mt-1.5"
            />
          </div>
          <div>
            <label htmlFor="resident-age" className="label-md block text-forest">
              Age
            </label>
            <input
              id="resident-age"
              type="number"
              min={0}
              max={120}
              value={residentForm.age}
              onChange={(event) =>
                setResidentForm({ ...residentForm, age: event.target.value })
              }
              className="input-base mt-1.5"
            />
          </div>
          <div>
            <label htmlFor="resident-gender" className="label-md block text-forest">
              Gender
            </label>
            <select
              id="resident-gender"
              value={residentForm.gender}
              onChange={(event) =>
                setResidentForm({ ...residentForm, gender: event.target.value })
              }
              className="input-base mt-1.5"
            >
              <option value="">Not provided</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          {editingResident && (
            <div className="flex flex-col gap-2 rounded-xl border border-[#f1cccc] bg-rejected-bg/60 p-3.5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold leading-relaxed text-rejected-ink">
                Removing a record does not delete the resident&apos;s portal login.
              </p>
              <Button
                size="sm"
                variant="dangerSoft"
                disabled={residentBusy}
                onClick={() => {
                  setShowResidentForm(false);
                  setResidentToDelete(editingResident);
                }}
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Delete record
              </Button>
            </div>
          )}
        </form>
      </Modal>

      {/* Resident delete */}
      <Modal
        open={Boolean(residentToDelete)}
        onClose={() => {
          if (!residentBusy) setResidentToDelete(null);
        }}
        title="Delete resident record?"
        tone="danger"
        size="sm"
        busy={residentBusy}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setResidentToDelete(null)}
              disabled={residentBusy}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={deleteResident} disabled={residentBusy}>
              {residentBusy ? 'Deleting…' : 'Delete record'}
            </Button>
          </>
        }
      >
        <p className="body-md">
          Remove <strong className="text-forest">{residentToDelete?.full_name}</strong> from
          the resident registry? This deletes the registry record only; it does not delete
          their portal login account.
        </p>
      </Modal>

      {/* Announcement delete */}
      <Modal
        open={Boolean(announcementToDelete)}
        onClose={() => {
          if (!announcementBusy) setAnnouncementToDelete(null);
        }}
        title="Delete announcement?"
        tone="danger"
        size="sm"
        busy={announcementBusy}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setAnnouncementToDelete(null)}
              disabled={announcementBusy}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={deleteAnnouncement} disabled={announcementBusy}>
              {announcementBusy ? 'Deleting…' : 'Delete announcement'}
            </Button>
          </>
        }
      >
        <p className="body-md">
          Delete <strong className="text-forest">{announcementToDelete?.title}</strong>? It
          will disappear from the public landing page immediately.
        </p>
      </Modal>

      {notice && (
        <FeedbackModal
          title={notice.title}
          message={notice.message}
          type="error"
          onClose={() => setNotice(null)}
        />
      )}
    </div>
  );
}
