'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

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
  age: number; // Age is now directly in the request
  created_at: string;
}

export default function AdminPage() {
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'residents' | 'requests'>('residents');
  const [residents, setResidents] = useState<Resident[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
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
      
      // Fetch requests - Age is now part of the standard select
      const { data: allRequests } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (allProfiles && allRequests) {
        setResidents(allProfiles.filter(p => !p.is_verified) as Resident[]);
        setRequests(allRequests as ServiceRequest[]);

        const today = new Date().toDateString();
        setStats({
          totalRegistered: allProfiles.length,
          pendingResidents: allProfiles.filter(p => !p.is_verified).length,
          activeRequests: allRequests.filter(r => r.status === 'pending').length,
          processedToday: allRequests.filter(r => 
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const deleteResident = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}?`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Delete this request?")) return;
    const { error } = await supabase.from('service_requests').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchData();
  };

  if (loading) return <div className="p-20 text-center font-black text-blue-900 animate-pulse">LOADING...</div>;

  return (
    <div className="p-6 md:p-10 text-black bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto pb-20">
        
        <header className="mb-8 text-center md:text-left">
          <h1 className="text-4xl font-black text-blue-900 uppercase tracking-tighter italic">Maporong Admin</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Barangay Information System</p>
        </header>

        {/* --- STATS --- */}
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
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Requests</p>
            <p className="text-2xl font-black text-blue-600">{stats.activeRequests}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border-l-4 border-l-green-600 border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Completed</p>
            <p className="text-2xl font-black text-green-600">{stats.processedToday}</p>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex bg-slate-200 p-1.5 rounded-2xl w-fit mb-8 shadow-inner">
          <button onClick={() => setActiveTab('residents')} className={`px-8 py-2.5 rounded-xl font-black text-[11px] uppercase transition-all ${activeTab === 'residents' ? 'bg-white shadow-md text-blue-900' : 'text-slate-500'}`}>Verify Accounts</button>
          <button onClick={() => setActiveTab('requests')} className={`px-8 py-2.5 rounded-xl font-black text-[11px] uppercase transition-all ${activeTab === 'requests' ? 'bg-white shadow-md text-blue-900' : 'text-slate-500'}`}>Service Requests</button>
        </div>

        {activeTab === 'residents' ? (
          <div className="bg-white border rounded-[32px] overflow-hidden shadow-xl border-slate-100">
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
          </div>
        ) : (
          <div className="bg-white border rounded-[32px] overflow-hidden shadow-xl border-slate-100">
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
                    <td className="p-6 text-right flex justify-end items-center gap-4">
                      <button onClick={() => setSelectedRequest(r)} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase hover:bg-blue-600 transition-all shadow-md active:scale-95">View Details</button>
                      <button onClick={() => deleteRequest(r.id)} className="text-slate-300 hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- MODAL (POPUP) --- */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {/* Added max-h-[90vh] and flex flex-col to keep the header/footer visible */}
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
              
              {/* HEADER: shrink-0 keeps it at the top */}
              <div className="bg-blue-900 p-6 md:p-8 text-white flex justify-between items-center shrink-0">
                <h3 className="font-black uppercase tracking-tighter text-2xl">Processing</h3>
                <button onClick={() => setSelectedRequest(null)} className="text-white/50 hover:text-white text-2xl">×</button>
              </div>
              
              {/* SCROLLABLE CONTENT: This is where the long purpose text lives */}
              <div className="p-8 md:p-10 space-y-8 overflow-y-auto flex-1">
                <div className="flex justify-between items-end border-b pb-6 border-slate-100">
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

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Document</label>
                    <p className="font-black text-slate-700 uppercase text-xs">{selectedRequest.service_type}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Date</label>
                    <p className="font-black text-slate-700 uppercase text-xs">{new Date(selectedRequest.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-[30px] border border-blue-100">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 block text-center">
                    Encoded Purpose
                  </label>
                  <p className="text-blue-900 leading-relaxed font-bold text-center text-sm italic uppercase tracking-tighter break-all">
                    &quot;{selectedRequest.purpose?.substring(0, 100) || "No details provided"}&quot;
                  </p>
                  {selectedRequest.purpose && selectedRequest.purpose.length > 100 && (
                    <p className="text-[8px] text-center mt-2 text-blue-300 font-bold uppercase italic">
                      (Limit: 100 characters)
                    </p>
                  )}
                </div>
              </div>

              {/* FOOTER: Fixed at the bottom */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0 space-y-3">
                {selectedRequest.status === 'pending' && (
                  <button 
                    onClick={() => updateRequestStatus(selectedRequest.id, 'ready')}
                    className="w-full bg-blue-600 text-white py-4 md:py-5 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl active:scale-95 transition-all"
                  >
                    Approve & Mark Ready
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
      </div> {/* This closes max-w-6xl */}
    </div>
  );
}