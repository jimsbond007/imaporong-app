'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

interface Resident {
  id: string;
  full_name: string;
  address: string;
  is_verified: boolean;
  bid_number?: string;
}

interface ServiceRequest {
  id: string;
  resident_id: string;
  full_name: string;
  service_type: string;
  purpose: string;
  status: string;
  age: number;
  address?: string;
  sex?: string;
  civil_status?: string;
  request_for?: string;
  created_at: string;
  received_at?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'residents' | 'requests' | 'calendar'>('residents');
  const [residents, setResidents] = useState<Resident[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [archivedRequests, setArchivedRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

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
      const { data: allProfiles } = await supabase.from('profiles').select('*');
      const { data: allRequests } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (allProfiles && allRequests) {
        setResidents(allProfiles.filter(p => !p.is_verified) as Resident[]);
        
        // Active requests strictly exclude received/archived items
        const activeList = allRequests.filter(r => r.status !== 'received') as ServiceRequest[];
        const archivedList = allRequests.filter(r => r.status === 'received') as ServiceRequest[];
        
        setRequests(activeList);
        setArchivedRequests(archivedList);

        const today = new Date().toDateString();
        setStats({
          totalRegistered: allProfiles.length,
          pendingResidents: allProfiles.filter(p => !p.is_verified).length,
          activeRequests: activeList.filter(r => r.status === 'pending').length,
          // Count only active ready/claimed requests for today's active completed stats
          processedToday: activeList.filter(r => 
            (r.status === 'ready' || r.status === 'claimed') && 
            new Date(r.created_at).toDateString() === today
          ).length
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const approveResident = async (id: string) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const bid = "MPRNG-2026-" + randomNum;
    const { error } = await supabase.from('profiles').update({ is_verified: true, bid_number: bid }).eq('id', id);
    if (!error) fetchData();
  };

  const updateRequestStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('service_requests').update({ status: newStatus }).eq('id', id);
    if (!error) {
      fetchData();
      setSelectedRequest(null);
    }
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

  const deleteResident = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}?`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Delete this request record permanently?")) return;
    const { error } = await supabase.from('service_requests').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
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

  if (loading) return <div className="p-20 text-center font-black text-blue-900 animate-pulse">LOADING ADMIN PORTAL...</div>;

  return (
    <div className="p-6 md:p-10 text-black bg-slate-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto pb-20">
        
        {/* HEADER */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-blue-900 uppercase tracking-tighter italic">Maporong Admin</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Barangay Information System</p>
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
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Residents</p>
            <p className="text-2xl font-black">{stats.totalRegistered}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border-l-4 border-l-orange-500 border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Pending</p>
            <p className="text-2xl font-black text-orange-600">{stats.pendingResidents}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border-l-4 border-l-blue-600 border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Requests</p>
            <p className="text-2xl font-black text-blue-600">{stats.activeRequests}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border-l-4 border-l-green-600 border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Completed (Active)</p>
            <p className="text-2xl font-black text-green-600">{stats.processedToday}</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-200 p-1.5 rounded-2xl w-fit mb-8 shadow-inner flex-wrap gap-1">
          <button onClick={() => setActiveTab('residents')} className={`px-6 py-2.5 rounded-xl font-black text-[11px] uppercase transition-all ${activeTab === 'residents' ? 'bg-white shadow-md text-blue-900' : 'text-slate-500'}`}>Verify Accounts</button>
          <button onClick={() => setActiveTab('requests')} className={`px-6 py-2.5 rounded-xl font-black text-[11px] uppercase transition-all ${activeTab === 'requests' ? 'bg-white shadow-md text-blue-900' : 'text-slate-500'}`}>Service Requests</button>
          <button onClick={() => setActiveTab('calendar')} className={`px-6 py-2.5 rounded-xl font-black text-[11px] uppercase transition-all ${activeTab === 'calendar' ? 'bg-white shadow-md text-blue-900' : 'text-slate-500'}`}>Monthly Calendar</button>
        </div>

        {/* TAB 1: RESIDENTS */}
        {activeTab === 'residents' && (
          <div className="bg-white border rounded-[32px] overflow-hidden shadow-xl border-slate-100">
            {residents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-bold text-sm">
                No pending resident account verifications.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b tracking-widest">
                  <tr><th className="p-6">Full Name</th><th className="p-6">Address</th><th className="p-6 text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {residents.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="p-6 font-bold text-slate-800">{p.full_name}</td>
                      <td className="p-6 text-slate-500 text-sm">{p.address}</td>
                      <td className="p-6 text-right flex justify-end gap-3">
                        <button onClick={() => deleteResident(p.id, p.full_name)} className="text-red-400 hover:text-red-600 font-black text-[10px] uppercase px-3 py-1">Delete</button>
                        <button onClick={() => approveResident(p.id)} className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-green-100 hover:bg-green-700 active:scale-95 transition">Approve</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
                      <td className="p-6 font-bold text-slate-800">{r.full_name}</td>
                      <td className="p-6">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-blue-100">{r.service_type}</span>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${r.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {r.status}
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
                        <button onClick={() => setSelectedRequest(r)} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase hover:bg-blue-600 transition-all shadow-md active:scale-95">Details</button>
                        <button onClick={() => deleteRequest(r.id)} className="text-slate-300 hover:text-red-500 p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
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

        {/* MODAL: VIEW DETAILS */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
              
              <div className="bg-blue-900 p-6 md:p-8 text-white flex justify-between items-center shrink-0">
                <h3 className="font-black uppercase tracking-tighter text-2xl">Processing Details</h3>
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
                    <p className="text-2xl font-black text-blue-600">
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
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0 space-y-3">
                {selectedRequest.status === 'pending' && (
                  <button 
                    onClick={() => updateRequestStatus(selectedRequest.id, 'ready')}
                    className="w-full bg-blue-600 text-white py-4 md:py-5 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl active:scale-95 transition-all"
                  >
                    Approve & Mark Ready
                  </button>
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
                    <div key={req.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                      <div>
                        <p className="font-black text-slate-800 text-sm">{req.full_name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">{req.service_type}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${req.status === 'received' ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>
                        {req.status}
                      </span>
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

      </div>
    </div>
  );
}