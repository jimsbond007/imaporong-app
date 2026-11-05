'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { toPng } from 'html-to-image';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import RequestSlip, { getRequestSlipNumber } from '../../components/RequestSlip';

interface Resident {
  id: string;
  profile_id: string | null;
  full_name: string;
  address: string;
  age: number | null;
  gender: string | null;
  is_verified: boolean;
  bid_number?: string;
}

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

interface ServiceRequest {
  id: string;
  resident_id: string;
  full_name: string;
  service_type: string;
  purpose: string;
  status: string;
  rejection_reason?: string | null;
  age: number;
  address?: string;
  sex?: string;
  civil_status?: string;
  birthday?: string;
  birth_place?: string;
  height?: string;
  weight?: string;
  business?: string;
  capital?: string;
  cp_no?: string;
  slip_number?: string;
  request_for?: string;
  created_at: string;
  received_at?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [requestToReject, setRequestToReject] = useState<ServiceRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [savingRejection, setSavingRejection] = useState(false);
  const [slipRequest, setSlipRequest] = useState<ServiceRequest | null>(null);
  const slipRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'residents' | 'requests' | 'calendar'>('residents');
  const [residents, setResidents] = useState<Resident[]>([]);
  const [residentSearch, setResidentSearch] = useState('');
  const [showResidentForm, setShowResidentForm] = useState(false);
  const [editingResidentId, setEditingResidentId] = useState<string | null>(null);
  const [residentForm, setResidentForm] = useState({ full_name: '', address: '', age: '', gender: '' });
  const [residentFeedback, setResidentFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [residentLoading, setResidentLoading] = useState(false);
  const residentImportRef = useRef<HTMLInputElement>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [archivedRequests, setArchivedRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateRequests, setSelectedDateRequests] = useState<ServiceRequest[] | null>(null);
  const [selectedDateLabel, setSelectedDateLabel] = useState<string>('');

  const [stats, setStats] = useState({
    totalRegistered: 0,
    pendingResidents: 0,
    activeRequests: 0,
    processedToday: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [residentResult, requestResult] = await Promise.all([
        supabase.from('residents').select('*').order('full_name'),
        supabase.from('service_requests').select('*').order('created_at', { ascending: false }),
      ]);

      if (residentResult.error) {
        console.error('Resident registry fetch failed:', residentResult.error);
        setResidentFeedback({
          type: 'error',
          message: `Could not load the resident registry. Apply the resident registry migration in Supabase. ${residentResult.error.message}`,
        });
      } else {
        setResidents((residentResult.data || []) as Resident[]);
        setResidentFeedback(null);
        setStats((current) => ({
          ...current,
          totalRegistered: residentResult.data?.length || 0,
          pendingResidents: (residentResult.data || []).filter(p => !p.is_verified).length,
        }));
      }

      if (requestResult.error) {
        console.error('Service request fetch failed:', requestResult.error);
        return;
      }

      if (requestResult.data) {
        const allRequests = requestResult.data;

        // Rejected requests leave the active queue but remain available in history.
        const activeList = allRequests.filter(
          r => r.status !== 'received' && r.status !== 'rejected'
        ) as ServiceRequest[];
        const archivedList = allRequests.filter(
          r => r.status === 'received' || r.status === 'rejected'
        ) as ServiceRequest[];
        
        setRequests(activeList);
        setArchivedRequests(archivedList);

        const today = new Date().toDateString();
        setStats((current) => ({
          ...current,
          activeRequests: activeList.filter(r => r.status === 'pending').length,
          // Count only active ready/claimed requests for today's active completed stats
          processedToday: activeList.filter(r => 
            (r.status === 'ready' || r.status === 'claimed') && 
            new Date(r.created_at).toDateString() === today
          ).length
        }));
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setResidentFeedback({
        type: 'error',
        message: 'Could not load resident records. Please try again or contact the administrator.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const verifyAdminAccess = async () => {
      // 1. Make sure the visitor is signed in.
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/auth');
        return;
      }

      // 2. Make sure the signed-in user actually has an admin role.
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (cancelled) return;

      const isAdmin = !error && profile && (profile.role === 'admin' || profile.is_admin === true);

      if (!isAdmin) {
        setAccessDenied(true);
        return;
      }

      // 3. Only load admin data after authorization succeeds.
      await fetchData();
    };

    verifyAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const approveResident = async (resident: Resident) => {
    if (resident.profile_id) {
      const bidNumber = `MPRNG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true, bid_number: bidNumber })
        .eq('id', resident.profile_id);
      if (error) {
        console.error('Failed to verify resident account:', error);
        setResidentFeedback({ type: 'error', message: `Could not verify resident: ${error.message}` });
        return;
      }
    } else {
      const { error } = await supabase
        .from('residents')
        .update({ is_verified: true })
        .eq('id', resident.id);
      if (error) {
        console.error('Failed to verify resident record:', error);
        setResidentFeedback({ type: 'error', message: `Could not verify resident: ${error.message}` });
        return;
      }
    }

    await fetchData();
    setResidentFeedback({ type: 'success', message: `${resident.full_name} is verified as a bona fide resident.` });
  };

  const deleteResident = async (resident: Resident) => {
    if (!window.confirm(`Permanently remove ${resident.full_name} from the resident registry?`)) return;

    if (resident.profile_id) {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', resident.profile_id);
      if (profileError) {
        console.error('Failed to remove resident profile:', profileError);
        setResidentFeedback({ type: 'error', message: `Could not remove resident: ${profileError.message}` });
        return;
      }
    }

    const { error } = await supabase.from('residents').delete().eq('id', resident.id);
    if (error) {
      console.error('Failed to remove resident record:', error);
      setResidentFeedback({ type: 'error', message: `Could not remove resident: ${error.message}` });
      return;
    }

    await fetchData();
  };

  const openNewResidentForm = () => {
    setEditingResidentId(null);
    setResidentForm({ full_name: '', address: '', age: '', gender: '' });
    setResidentFeedback(null);
    setShowResidentForm(true);
  };

  const openEditResidentForm = (resident: Resident) => {
    setEditingResidentId(resident.id);
    setResidentForm({
      full_name: resident.full_name,
      address: resident.address,
      age: resident.age?.toString() || '',
      gender: resident.gender || '',
    });
    setResidentFeedback(null);
    setShowResidentForm(true);
  };

  const saveResident = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const age = residentForm.age.trim() ? Number(residentForm.age) : null;
    if (age !== null && (!Number.isInteger(age) || age < 0 || age > 120)) {
      setResidentFeedback({ type: 'error', message: 'Enter a valid age between 0 and 120.' });
      return;
    }

    setResidentLoading(true);
    setResidentFeedback(null);
    const values = {
      full_name: residentForm.full_name.trim(),
      address: residentForm.address.trim(),
      age,
      gender: residentForm.gender || null,
    };

    let error;
    if (editingResidentId) {
      const resident = residents.find((record) => record.id === editingResidentId);
      if (resident?.profile_id) {
        const result = await supabase.from('profiles').update(values).eq('id', resident.profile_id);
        error = result.error;
      } else {
        const result = await supabase.from('residents').update(values).eq('id', editingResidentId);
        error = result.error;
      }
    } else {
      const result = await supabase.from('residents').insert(values);
      error = result.error;
    }
    setResidentLoading(false);

    if (error) {
      console.error('Failed to save resident record:', error);
      setResidentFeedback({ type: 'error', message: `Could not save resident: ${error.message}` });
      return;
    }

    setShowResidentForm(false);
    const successMessage = editingResidentId ? 'Resident record updated.' : 'Resident record added.';
    setEditingResidentId(null);
    await fetchData();
    setResidentFeedback({ type: 'success', message: successMessage });
  };

  const importResidentRoster = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setResidentFeedback(null);
    try {
      const text = (await file.text()).replace(/^\uFEFF/, '');
      const rows = text.split(/\r?\n/).filter((row) => row.trim()).map(parseCsvRow);
      if (rows.length < 2) {
        setResidentFeedback({ type: 'error', message: 'The CSV must include a header row and at least one resident.' });
        return;
      }

      const headers = rows[0].map((header) => header.trim().toLowerCase().replace(/[\s_-]+/g, ''));
      const nameIndex = headers.findIndex((header) => ['name', 'fullname', 'residentname'].includes(header));
      const addressIndex = headers.findIndex((header) => ['address', 'homeaddress', 'purok'].includes(header));
      const ageIndex = headers.findIndex((header) => header === 'age');
      const genderIndex = headers.findIndex((header) => ['gender', 'sex'].includes(header));
      if (nameIndex < 0 || addressIndex < 0) {
        setResidentFeedback({
          type: 'error',
          message: 'CSV needs Name and Address columns. Age and Gender columns are optional.',
        });
        return;
      }

      const seen = new Set(residents.map((resident) =>
        `${resident.full_name.trim().toLowerCase()}|${resident.address.trim().toLowerCase()}`
      ));
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
          errors.push(`Row ${rowNumber}: gender must be Female, Male, Other, or Prefer not to say.`);
          return;
        }

        const identity = `${full_name.toLowerCase()}|${address.toLowerCase()}`;
        if (seen.has(identity)) return;
        seen.add(identity);
        entries.push({ full_name, address, age, gender });
      });

      if (errors.length) {
        setResidentFeedback({
          type: 'error',
          message: `Import stopped without adding records. ${errors.slice(0, 3).join(' ')}${errors.length > 3 ? ` Plus ${errors.length - 3} more issue(s).` : ''}`,
        });
        return;
      }
      if (!entries.length) {
        setResidentFeedback({ type: 'error', message: 'No new residents found in the CSV.' });
        return;
      }

      setResidentLoading(true);
      const { error } = await supabase.from('residents').insert(entries);
      setResidentLoading(false);
      if (error) {
        console.error('Failed to import resident roster:', error);
        setResidentFeedback({ type: 'error', message: `Could not import roster: ${error.message}` });
        return;
      }

      await fetchData();
      setResidentFeedback({ type: 'success', message: `Imported ${entries.length} resident record(s).` });
    } catch (error) {
      console.error('Failed to read resident roster:', error);
      setResidentFeedback({ type: 'error', message: 'Could not read the file. Please upload a valid CSV roster.' });
    } finally {
      setResidentLoading(false);
    }
  };

  const updateRequestStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('service_requests').update({ status: newStatus }).eq('id', id);
    if (!error) {
      fetchData();
      setSelectedRequest(null);
    }
  };

  const openRejectDialog = (request: ServiceRequest) => {
    setRequestToReject(request);
    setRejectionReason('');
    setRejectionError('');
  };

  const closeRejectDialog = () => {
    if (savingRejection) return;
    setRequestToReject(null);
    setRejectionReason('');
    setRejectionError('');
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
      console.error('Failed to reject service request:', error);
      setRejectionError(`Could not reject this request: ${error.message}`);
      setSavingRejection(false);
      return;
    }

    if (selectedRequest?.id === requestToReject.id) setSelectedRequest(null);
    setRequestToReject(null);
    setRejectionReason('');
    setSavingRejection(false);
    await fetchData();
  };

  const openRequestDetails = (request: ServiceRequest) => {
    setSelectedRequest(request);
  };

  // Mark Request as Received: moves it out of active tables and into calendar storage
  const markAsReceived = async (id: string) => {
    const timestamp = new Date().toISOString();
    const { error } = await supabase
      .from('service_requests')
      .update({ status: 'received', received_at: timestamp })
      .eq('id', id);

    if (error) {
      alert("Error archiving request: " + error.message);
    } else {
      fetchData();
      setSelectedRequest(null);
    }
  };

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const allCombinedRequests = [...requests, ...archivedRequests];

  const getRequestsForDate = (day: number) => {
    const targetDateStr = new Date(year, month, day).toDateString();
    return allCombinedRequests.filter(
      r => new Date(r.created_at).toDateString() === targetDateStr
    );
  };

  const handleDayClick = (day: number) => {
    const dateObj = new Date(year, month, day);
    const dayRequests = getRequestsForDate(day);
    setSelectedDateLabel(dateObj.toLocaleDateString(undefined, { dateStyle: 'full' }));
    setSelectedDateRequests(dayRequests);
  };

  const searchTerm = residentSearch.trim().toLowerCase();
  const filteredResidents = residents.filter((resident) =>
    [resident.full_name, resident.address, resident.gender || '', resident.age?.toString() || '']
      .some((value) => value.toLowerCase().includes(searchTerm))
  );
  const residentDemographics = {
    female: residents.filter((resident) => resident.gender?.toLowerCase() === 'female').length,
    male: residents.filter((resident) => resident.gender?.toLowerCase() === 'male').length,
    otherGender: residents.filter((resident) =>
      resident.gender && !['female', 'male'].includes(resident.gender.toLowerCase())
    ).length,
    noGender: residents.filter((resident) => !resident.gender).length,
    under18: residents.filter((resident) => resident.age !== null && resident.age < 18).length,
    adult: residents.filter((resident) => resident.age !== null && resident.age >= 18 && resident.age < 60).length,
    senior: residents.filter((resident) => resident.age !== null && resident.age >= 60).length,
    noAge: residents.filter((resident) => resident.age === null).length,
  };

  const openSlip = (request: ServiceRequest) => {
    setSelectedRequest(null);
    setSelectedDateRequests(null);
    setSlipRequest(request);
  };

  const downloadSlip = async () => {
    if (!slipRef.current || !slipRequest) return;

    try {
      const dataUrl = await toPng(slipRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Request-Slip-${getRequestSlipNumber(slipRequest)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download request slip:', err);
      alert('Could not generate the slip image. Please try printing instead.');
    }
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 font-sans">
        <div role="alert" className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-red-100">
          <div className="bg-red-600 p-8 text-center">
            <h1 className="text-2xl font-black text-white uppercase tracking-widest">Access Denied</h1>
            <p className="text-red-100 text-sm font-bold mt-2">Administrator access only</p>
          </div>

          <div className="p-8 text-center space-y-6">
            <p className="text-slate-600 font-bold leading-relaxed">
              Your account does not have administrator permissions. You cannot view the admin portal.
            </p>
            <p className="text-slate-400 text-xs font-bold leading-relaxed">
              If you believe this is a mistake, please contact the barangay administrator.
            </p>
            <button
              onClick={() => router.replace('/dashboard')}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 uppercase text-xs tracking-widest"
            >
              Back to Resident Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-20 text-center font-black text-blue-900 animate-pulse">LOADING ADMIN PORTAL...</div>;

  return (
    <div className="p-6 md:p-10 text-black bg-slate-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto pb-20">
        
        {/* HEADER */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/maporong-logo.png"
              alt="Barangay Maporong"
              width={120}
              height={75}
              priority
              className="h-12 w-auto object-contain"
            />
            <div>
              <h1 className="text-4xl font-black text-blue-900 uppercase tracking-tighter italic">Admin</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Barangay Information System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-xl font-black text-[11px] uppercase transition-all shadow-md active:scale-95"
            >
              Switch to Resident Page
            </button>
          </div>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <button
            type="button"
            onClick={() => setActiveTab('residents')}
            aria-label={`View statistics for ${stats.totalRegistered} resident records`}
            className="rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:border-green-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Residents · View statistics</p>
            <p className="text-2xl font-black font-display">{stats.totalRegistered}</p>
          </button>
          <div className="bg-white p-6 rounded-3xl shadow-sm border-l-4 border-l-orange-500 border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Pending</p>
            <p className="text-2xl font-black font-display text-orange-600">{stats.pendingResidents}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border-l-4 border-l-blue-600 border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Requests</p>
            <p className="text-2xl font-black font-display text-blue-600">{stats.activeRequests}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border-l-4 border-l-green-600 border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Completed (Active)</p>
            <p className="text-2xl font-black font-display text-green-600">{stats.processedToday}</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-200 p-1.5 rounded-2xl w-fit mb-8 shadow-inner flex-wrap gap-1">
          <button onClick={() => setActiveTab('residents')} className={`px-6 py-2.5 rounded-xl font-black text-[11px] uppercase transition-all ${activeTab === 'residents' ? 'bg-white shadow-md text-blue-900' : 'text-slate-500'}`}>Resident Registry</button>
          <button onClick={() => setActiveTab('requests')} className={`px-6 py-2.5 rounded-xl font-black text-[11px] uppercase transition-all ${activeTab === 'requests' ? 'bg-white shadow-md text-blue-900' : 'text-slate-500'}`}>Service Requests</button>
          <button onClick={() => setActiveTab('calendar')} className={`px-6 py-2.5 rounded-xl font-black text-[11px] uppercase transition-all ${activeTab === 'calendar' ? 'bg-white shadow-md text-blue-900' : 'text-slate-500'}`}>Monthly Calendar</button>
        </div>

        {/* TAB 1: RESIDENTS */}
        {activeTab === 'residents' && (
          <div className="bg-white border rounded-[32px] overflow-hidden shadow-xl border-slate-100">
            <div className="p-6 md:p-8">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black font-display text-blue-900">Resident Statistics</h2>
                  <p className="mt-1 text-sm text-slate-500">Registry includes residents with and without portal accounts.</p>
                </div>
                <p className="text-xs font-bold text-slate-500">{stats.pendingResidents} pending bona fide verification</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Female', residentDemographics.female, 'text-pink-700'],
                  ['Male', residentDemographics.male, 'text-blue-700'],
                  ['Other / undisclosed', residentDemographics.otherGender + residentDemographics.noGender, 'text-slate-700'],
                  ['Age 0–17', residentDemographics.under18, 'text-indigo-700'],
                  ['Age 18–59', residentDemographics.adult, 'text-green-700'],
                  ['Age 60+', residentDemographics.senior, 'text-orange-700'],
                  ['Age not provided', residentDemographics.noAge, 'text-slate-500'],
                  ['Total residents', residents.length, 'text-blue-900'],
                ].map(([label, count, color]) => (
                  <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
                    <p className={`mt-1 text-2xl font-black font-display ${color}`}>{count}</p>
                  </div>
                ))}
              </div>

              {residentFeedback && (
                <p role={residentFeedback.type === 'error' ? 'alert' : 'status'} className={`mt-5 rounded-xl border p-4 text-sm font-semibold ${residentFeedback.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                  {residentFeedback.message}
                </p>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-black font-display text-slate-800">Resident Records</h3>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={residentImportRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={importResidentRoster}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => residentImportRef.current?.click()}
                    disabled={residentLoading}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wide text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Import CSV
                  </button>
                  <button
                    type="button"
                    onClick={openNewResidentForm}
                    className="rounded-xl bg-green-700 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white hover:bg-green-800"
                  >
                    Add Resident
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">Roster import expects CSV columns: Name, Address, Age, Gender. Excel spreadsheets can be saved as CSV.</p>

              {showResidentForm && (
                <form onSubmit={saveResident} className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-green-100 bg-green-50/50 p-4 md:grid-cols-2">
                  <h4 className="md:col-span-2 text-sm font-black text-green-900">
                    {editingResidentId ? 'Edit resident record' : 'Add resident without an account'}
                  </h4>
                  <label className="text-xs font-bold text-slate-600">
                    Full name
                    <input
                      required
                      value={residentForm.full_name}
                      onChange={(event) => setResidentForm({ ...residentForm, full_name: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Address
                    <input
                      required
                      value={residentForm.address}
                      onChange={(event) => setResidentForm({ ...residentForm, address: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Age
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={residentForm.age}
                      onChange={(event) => setResidentForm({ ...residentForm, age: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Gender
                    <select
                      value={residentForm.gender}
                      onChange={(event) => setResidentForm({ ...residentForm, gender: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                    >
                      <option value="">Not provided</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </label>
                  <div className="flex gap-2 md:col-span-2 md:justify-end">
                    <button type="button" onClick={() => setShowResidentForm(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black uppercase text-slate-600">Cancel</button>
                    <button type="submit" disabled={residentLoading} className="rounded-xl bg-green-700 px-4 py-2.5 text-xs font-black uppercase text-white disabled:opacity-50">
                      {residentLoading ? 'Saving...' : 'Save Resident'}
                    </button>
                  </div>
                </form>
              )}

              <label className="mt-5 block">
                <span className="sr-only">Search residents</span>
                <input
                  type="search"
                  value={residentSearch}
                  onChange={(event) => setResidentSearch(event.target.value)}
                  placeholder="Search by name, address, age, or gender..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-green-600"
                />
              </label>

              {filteredResidents.length === 0 ? (
                <div className="p-10 text-center text-sm font-semibold text-slate-400">
                  {residents.length ? 'No residents match your search.' : 'No resident records yet. Add a resident or import a CSV roster.'}
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[780px] text-left">
                    <thead className="border-b bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="p-4">Resident</th>
                        <th className="p-4">Gender</th>
                        <th className="p-4">Age group</th>
                        <th className="p-4">Address</th>
                        <th className="p-4">Account</th>
                        <th className="p-4">Verification</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResidents.map((resident) => (
                        <tr key={resident.id} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="p-4 font-bold text-slate-800">{resident.full_name}</td>
                          <td className="p-4 text-sm text-slate-600">{resident.gender || '—'}</td>
                          <td className="p-4 text-sm text-slate-600">
                            {resident.age === null ? '—' : resident.age < 18 ? '0–17' : resident.age < 60 ? '18–59' : '60+'}
                          </td>
                          <td className="p-4 text-sm text-slate-600">{resident.address}</td>
                          <td className="p-4">
                            <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${resident.profile_id ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                              {resident.profile_id ? 'Has account' : 'No account'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${resident.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {resident.is_verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => openEditResidentForm(resident)} className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50">Edit</button>
                              {!resident.is_verified && (
                                <button type="button" onClick={() => approveResident(resident)} className="rounded-lg bg-green-700 px-3 py-2 text-[10px] font-black uppercase text-white hover:bg-green-800">Verify</button>
                              )}
                              <button type="button" onClick={() => deleteResident(resident)} className="rounded-lg px-2 py-2 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SERVICE REQUESTS */}
        {activeTab === 'requests' && (
          <div className="bg-white border rounded-[32px] overflow-hidden shadow-xl border-slate-100">
            {requests.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-bold text-sm">
                No active service requests.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b tracking-widest">
                  <tr><th className="p-6">Resident</th><th className="p-6">Service</th><th className="p-6">Status</th><th className="p-6 text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="p-6 font-bold text-slate-800">
                        <div>{r.full_name}</div>
                        <div className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                          {getRequestSlipNumber(r)}
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-blue-100">{r.service_type}</span>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${r.status === 'ready' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {r.status === 'rejected' ? 'Rejected' : r.status}
                        </span>
                      </td>
                      <td className="p-6 text-right flex justify-end items-center gap-2">
                        {r.status === 'ready' && (
                          <button 
                            onClick={() => markAsReceived(r.id)} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-md transition-all active:scale-95"
                          >
                            Mark Received
                          </button>
                        )}
                        <button onClick={() => openSlip(r)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-700 transition-all shadow-md active:scale-95">Slip</button>
                        <button onClick={() => openRequestDetails(r)} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase hover:bg-blue-600 transition-all shadow-md active:scale-95">Details</button>
                        {r.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => openRejectDialog(r)}
                            aria-label={`Reject request from ${r.full_name}`}
                            title="Reject request"
                            className="text-slate-300 hover:text-red-600 p-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: MONTHLY CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="bg-white border rounded-[32px] p-6 md:p-8 shadow-xl border-slate-100">
            {/* Calendar Controls */}
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl font-black text-xs uppercase transition-colors"
              >
                &lt; Prev Month
              </button>
              <h2 className="text-2xl font-black text-blue-900 uppercase italic tracking-tight">
                {currentDate.toLocaleString('default', { month: 'long' })} {year}
              </h2>
              <button 
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl font-black text-xs uppercase transition-colors"
              >
                Next Month &gt;
              </button>
            </div>

            {/* Grid Days Header */}
            <div className="grid grid-cols-7 gap-2 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest mb-2">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            {/* Grid Body */}
            <div className="grid grid-cols-7 gap-2">
              {[...Array(firstDayOfMonth)].map((_, i) => (
                <div key={`empty-${i}`} className="h-24 bg-slate-50/50 rounded-2xl"></div>
              ))}

              {[...Array(daysInMonth)].map((_, i) => {
                const dayNum = i + 1;
                const dayReqs = getRequestsForDate(dayNum);
                const hasRequests = dayReqs.length > 0;

                return (
                  <div 
                    key={`day-${dayNum}`}
                    onClick={() => handleDayClick(dayNum)}
                    className={`h-24 p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${hasRequests ? 'bg-blue-50/80 border-blue-200 hover:bg-blue-100' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                  >
                    <span className="font-black text-slate-800 text-xs">{dayNum}</span>
                    {hasRequests && (
                      <div className="bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-lg text-center shadow-sm">
                        {dayReqs.length} {dayReqs.length === 1 ? 'Req' : 'Reqs'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODAL: REJECT REQUEST */}
        {requestToReject && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeRejectDialog();
            }}
          >
            <form
              onSubmit={rejectRequest}
              role="dialog"
              aria-modal="true"
              aria-labelledby="reject-request-title"
              className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-center gap-4 bg-rose-700 px-6 py-5 text-white">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl font-black" aria-hidden="true">
                  !
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="reject-request-title" className="text-xl font-black uppercase tracking-tight">
                    Reject Request
                  </h2>
                  <p className="mt-1 truncate text-sm font-medium text-rose-100">
                    {requestToReject.full_name} · {requestToReject.service_type}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeRejectDialog}
                  disabled={savingRejection}
                  aria-label="Close rejection dialog"
                  className="rounded-lg px-2 text-2xl text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3 p-6">
                <label htmlFor="rejection-reason" className="block text-sm font-bold text-slate-700">
                  Reason for rejection
                  <span className="ml-1 text-rose-600" aria-hidden="true">*</span>
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
                  placeholder="Explain what needs to be corrected or provided. This message will be visible to the resident."
                  className="w-full resize-y rounded-xl border-2 border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-rose-500"
                />
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs leading-relaxed text-slate-500">
                    The resident will see this explanation in their request history.
                  </p>
                  <span className="shrink-0 text-xs text-slate-400">{rejectionReason.length}/1000</span>
                </div>
                {rejectionError && (
                  <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                    {rejectionError}
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeRejectDialog}
                  disabled={savingRejection}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRejection || !rejectionReason.trim()}
                  className="rounded-xl bg-rose-700 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md transition-colors hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingRejection ? 'Submitting...' : 'Submit Rejection'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL: VIEW DETAILS */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
              
              <div className="bg-blue-900 p-6 md:p-8 text-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-black uppercase tracking-tighter text-2xl">Processing Details</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mt-1">
                    {getRequestSlipNumber(selectedRequest)}
                  </p>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="text-white/50 hover:text-white text-2xl">×</button>
              </div>
              
              <div className="p-8 md:p-10 space-y-6 overflow-y-auto flex-1">
                <div className="flex justify-between items-end border-b pb-4 border-slate-100">
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Full Name</label>
                    <p className="text-2xl font-black text-slate-800 leading-tight">{selectedRequest.full_name}</p>
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Age</label>
                    <p className="text-2xl font-black font-display text-blue-600">
                      {selectedRequest.age || '—'}<span className="text-[10px] ml-1 uppercase">Yrs</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b pb-4 border-slate-100">
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Sex</label>
                    <p className="font-bold text-slate-700 uppercase text-xs">{selectedRequest.sex || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Civil Status</label>
                    <p className="font-bold text-slate-700 uppercase text-xs">{selectedRequest.civil_status || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-b pb-4 border-slate-100">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Address</label>
                  <p className="font-bold text-slate-700 uppercase text-xs">{selectedRequest.address || 'N/A'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b pb-4 border-slate-100">
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Document</label>
                    <p className="font-black text-slate-700 uppercase text-xs">{selectedRequest.service_type}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Requested Date</label>
                    <p className="font-black text-slate-700 uppercase text-xs">{new Date(selectedRequest.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedRequest.request_for && (
                  <div className="border-b pb-4 border-slate-100">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Requesting For</label>
                    <p className="font-bold text-slate-700 uppercase text-xs">{selectedRequest.request_for}</p>
                  </div>
                )}

                <div className="bg-blue-50 p-6 rounded-[30px] border border-blue-100">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 block text-center">
                    Purpose
                  </label>
                  <p className="text-blue-900 leading-relaxed font-bold text-center text-sm italic uppercase tracking-tighter break-words">
                    &quot;{selectedRequest.purpose || "No details provided"}&quot;
                  </p>
                </div>

                {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-rose-600">
                      Rejection feedback sent to resident
                    </label>
                    <p className="break-words text-sm font-medium leading-relaxed text-rose-900">
                      {selectedRequest.rejection_reason}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0 space-y-3">
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, 'ready')}
                      className="w-full bg-blue-600 text-white py-4 md:py-5 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl active:scale-95 transition-all"
                    >
                      Approve & Mark Ready
                    </button>
                  </>
                )}
                {selectedRequest.status === 'ready' && (
                  <button 
                    onClick={() => markAsReceived(selectedRequest.id)}
                    className="w-full bg-emerald-600 text-white py-4 md:py-5 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-emerald-700 shadow-xl active:scale-95 transition-all"
                  >
                    Mark Received & Archive Record
                  </button>
                )}
                <button 
                  onClick={() => openSlip(selectedRequest)}
                  className="w-full bg-indigo-600 text-white py-4 md:py-5 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl active:scale-95 transition-all"
                >
                  View / Print Request Slip
                </button>
                <button 
                  onClick={() => setSelectedRequest(null)} 
                  className="w-full bg-white border border-slate-200 text-slate-400 py-3 md:py-4 rounded-[24px] font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CALENDAR DATE INSPECTOR */}
        {selectedDateRequests && (
          <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
              <div className="bg-blue-900 p-6 text-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-black uppercase tracking-tighter text-xl">Date Records</h3>
                  <p className="text-xs text-blue-200 font-bold">{selectedDateLabel}</p>
                </div>
                <button onClick={() => setSelectedDateRequests(null)} className="text-white/50 hover:text-white text-2xl">×</button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {selectedDateRequests.length === 0 ? (
                  <p className="text-center text-slate-400 font-bold py-8 text-xs">No document requests recorded on this date.</p>
                ) : (
                  selectedDateRequests.map((req) => (
                    <div key={req.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 text-sm truncate">{req.full_name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">{req.service_type}</p>
                        <p className="text-[9px] text-emerald-700 font-black uppercase tracking-wider mt-1">{getRequestSlipNumber(req)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${req.status === 'received' ? 'bg-slate-200 text-slate-700' : req.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                          {req.status === 'rejected' ? 'Rejected' : req.status}
                        </span>
                        {req.status === 'rejected' && req.rejection_reason && (
                          <p className="basis-full rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-900 sm:basis-auto sm:max-w-xs">
                            <span className="font-black uppercase tracking-wide">Reason: </span>
                            {req.rejection_reason}
                          </p>
                        )}
                        <button onClick={() => openSlip(req)} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-md transition-all active:scale-95">
                          View / Print
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                <button 
                  onClick={() => setSelectedDateRequests(null)}
                  className="w-full bg-white border border-slate-200 text-slate-600 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: REQUEST SLIP */}
        {slipRequest && (
          <div className="fixed inset-0 bg-blue-950/50 backdrop-blur-sm flex items-start justify-center z-[60] p-4 overflow-y-auto">
            <div className="w-full max-w-2xl my-6 bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-blue-900 p-5 md:p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="font-black uppercase tracking-tighter text-xl">Request Slip</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mt-1">
                    {getRequestSlipNumber(slipRequest)}
                  </p>
                </div>
                <button onClick={() => setSlipRequest(null)} className="text-white/60 hover:text-white text-2xl">×</button>
              </div>

              <div className="p-4 md:p-6 bg-slate-100">
                <div className="shadow-xl">
                  <div ref={slipRef} className="bg-white">
                    <RequestSlip request={slipRequest} />
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95"
                >
                  Print Slip
                </button>
                <button
                  onClick={downloadSlip}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95"
                >
                  Download PNG
                </button>
                <button
                  onClick={() => setSlipRequest(null)}
                  className="sm:flex-none sm:px-6 bg-white border border-slate-200 text-slate-500 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Print-only copy. globals.css hides everything else while printing. */}
        {slipRequest && (
          <div className="print-slip-area">
            <RequestSlip request={slipRequest} />
          </div>
        )}

      </div>
    </div>
  );
}