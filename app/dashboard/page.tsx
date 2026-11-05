'use client';

import { Fragment, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';
import { getRequestSlipNumber } from '../../components/RequestSlip';

interface Profile {
  full_name: string;
  address: string;
  bid_number: string;
  is_verified: boolean;
  role: string;
}

interface ServiceRequest {
  id: string;
  service_type: string;
  status: string;
  rejection_reason?: string | null;
  slip_number?: string;
  created_at: string;
  resident_hidden_at?: string | null;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingImage, setSavingImage] = useState(false);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [showIdModal, setShowIdModal] = useState(false);
  const idCardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth');
          return;
        }

        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !userProfile) {
          console.error('Could not verify the signed-in user role:', profileError);
          await supabase.auth.signOut();
          router.replace('/auth');
          return;
        }

        if (userProfile.role !== 'admin' && userProfile.role !== 'resident') {
          console.error('Signed-in user has an unsupported role:', userProfile.role);
          await supabase.auth.signOut();
          router.replace('/auth');
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
        setRequests(userRequests || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleHideCompletedRequest = async (request: ServiceRequest) => {
    if (!window.confirm('Remove this completed request from your history? It will remain visible in the administrator calendar.')) {
      return;
    }

    setDeletingRequestId(request.id);
    const { error } = await supabase.rpc('hide_completed_request_from_resident', {
      p_request_id: request.id,
    });

    if (error) {
      console.error('Could not remove completed request from resident history:', error);
      alert(`Could not remove this request from your history: ${error.message}`);
      setDeletingRequestId(null);
      return;
    }

    setRequests((current) => current.filter((item) => item.id !== request.id));
    setDeletingRequestId(null);
  };

  const handleSaveImage = async () => {
    if (!idCardRef.current) return;
    setSavingImage(true);

    try {
      const dataUrl = await toPng(idCardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Maporong-ID-${profile?.full_name?.replace(/\s+/g, '_') || 'Resident'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to export ID image:", error);
      alert("Could not generate ID image. Please try printing instead.");
    } finally {
      setSavingImage(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'completed') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s === 'rejected' || s === 'cancelled') return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-amber-100 text-amber-800 border-amber-200'; // Default to pending/processing
  };

  // Check if current user is an admin
  const isAdminUser = profile?.role === 'admin';

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 font-black text-green-800 text-2xl animate-pulse">
        LOADING DASHBOARD...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12 font-sans">
      {/* Navigation */}
      <nav className="bg-green-800 p-5 text-white flex justify-between items-center shadow-lg mb-8 print:hidden border-b-4 border-yellow-500">
        <Image
          src="/maporong-logo.png"
          alt="Barangay Maporong"
          width={120}
          height={75}
          priority
          className="h-12 w-auto rounded-md bg-white p-1 object-contain"
        />
        
        <div className="flex items-center gap-3">
          {isAdminUser && (
            <span className="rounded-lg bg-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-wide">
              Admin preview
            </span>
          )}

          {isAdminUser && (
            <button
              onClick={() => router.push('/admin')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-black text-xs uppercase transition-all shadow-md active:scale-95 flex items-center gap-1"
            >
              Switch to Admin
            </button>
          )}

          <button 
            onClick={handleLogout} 
            className="bg-orange-600 px-6 py-2 rounded-lg font-black text-xs uppercase hover:bg-yellow-500 transition-all active:scale-95"
          >
            LOGOUT
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 md:p-6 print:hidden">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Welcome & ID Action */}
          <div className="bg-white p-8 rounded-[40px] shadow-xl border-b-8 border-green-700 flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-black text-green-900 mb-2 tracking-tighter uppercase">
                Mabalos, {profile?.full_name?.split(' ')[0] || 'Resident'}!
              </h2>
              <p className="text-xs text-slate-500 mb-6 font-semibold">
                Status: {profile?.is_verified ? 'Verified Resident' : 'Unverified Account'}
              </p>
            </div>
            
            {profile?.is_verified ? (
              <button 
                onClick={() => setShowIdModal(true)} 
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-blue-700 transition-all active:scale-95"
              >
                Print Resident ID
              </button>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-amber-800 text-[11px] font-bold text-center">
                Account verification required for Resident ID output.
              </div>
            )}
          </div>
          
          {/* Services Banner */}
          <div className="md:col-span-2 bg-green-900 p-8 rounded-[40px] text-white relative overflow-hidden shadow-xl flex flex-col justify-center">
            <div className="z-10">
              <h3 className="text-4xl font-black tracking-tighter italic uppercase leading-none">Services</h3>
              <p className="text-xs text-green-200 mt-2 max-w-md font-medium">Request official barangay clearances, indigency certificates, and residency documents online.</p>
              {isAdminUser ? (
                <p className="mt-6 text-xs font-semibold text-green-100">
                  Request submission is available to resident accounts.
                </p>
              ) : (
                <button
                  onClick={() => router.push('/dashboard/request')}
                  className="mt-6 bg-yellow-500 text-black px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-orange-500 transition-all active:scale-95"
                >
                  Request Form →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-[40px] shadow-xl overflow-hidden">
          <div className="bg-slate-900 p-6">
            <h3 className="text-white font-black uppercase tracking-widest text-xs">Request Status History</h3>
          </div>
          
          {requests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium text-sm">
              No document requests submitted yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-[10px] font-black text-slate-400 uppercase">
                    <th className="p-6">Document</th>
                    <th className="p-6">Slip No.</th>
                    <th className="p-6">Status</th>
                    <th className="p-6">Date</th>
                    <th className="p-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <Fragment key={r.id}>
                      <tr className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="p-6 font-black text-slate-800 uppercase">{r.service_type}</td>
                        <td className="p-6 font-mono text-xs font-black text-green-800">{getRequestSlipNumber(r)}</td>
                        <td className="p-6">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusBadge(r.status)}`}>
                            {r.status === 'rejected' ? 'Rejected' : r.status}
                          </span>
                        </td>
                        <td className="p-6 text-slate-400 text-sm">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="p-6 text-right">
                          {r.status === 'received' && (
                            <button
                              type="button"
                              onClick={() => handleHideCompletedRequest(r)}
                              disabled={deletingRequestId === r.id}
                              className="rounded-lg border border-rose-200 px-3 py-2 text-[10px] font-black uppercase text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                              {deletingRequestId === r.id ? 'Removing...' : 'Remove'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {r.status === 'rejected' && r.rejection_reason && (
                        <tr className="border-b last:border-0">
                          <td colSpan={5} className="px-6 pb-5">
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                              <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-rose-700">
                                Admin feedback — why this request was rejected
                              </p>
                              <p className="whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-rose-900">
                                {r.rejection_reason}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ATM Card Modal */}
      {showIdModal && profile && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-4">
          <div className="flex flex-wrap justify-center gap-4 mb-8 print:hidden">
            <button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all">
              Print ID
            </button>
            <button 
              onClick={handleSaveImage} 
              disabled={savingImage}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-500 text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all"
            >
              {savingImage ? 'Generating...' : 'Save as Image'}
            </button>
            <button onClick={() => setShowIdModal(false)} className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-black text-xs uppercase transition-all">
              Close
            </button>
          </div>

          {/* Card Component */}
          <div ref={idCardRef} id="printable-id" className="w-[450px] h-[280px] bg-white rounded-[1rem] shadow-2xl overflow-hidden relative flex flex-col border border-slate-200 shrink-0">
            {/* Header Area */}
            <div className="relative h-[40%] w-full bg-[#14532d] overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 450 112" preserveAspectRatio="none">
                <path d="M0 0 L450 0 L450 85 Q225 115 0 85 Z" fill="#14532d" />
                <circle cx="410" cy="25" r="70" fill="#facc15" fillOpacity="0.2" />
                <path d="M0 0 L140 0 L0 110 Z" fill="#ea580c" fillOpacity="0.4" />
                <path d="M450 0 L310 0 L450 95 Z" fill="#2563eb" fillOpacity="0.3" />
                {[...Array(12)].map((_, i) => (
                  <path key={i} d={`M${i * 38} 0 L${i * 38 + 19} 18 L${(i + 1) * 38} 0 Z`} fill={i % 2 === 0 ? '#facc15' : '#ea580c'} />
                ))}
              </svg>
              
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center pt-3">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-90">Republic of the Philippines</p>
                <h4 className="text-4xl font-black uppercase tracking-tight italic text-yellow-400 leading-none drop-shadow-md">MAPORONG</h4>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-1 text-white/90">Resident Identification Card</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 px-8 py-3 flex flex-col justify-between items-center text-center">
              <div className="w-full">
                <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-0.5">Full Name</span>
                <p className="text-3xl font-black text-slate-900 uppercase leading-none tracking-tight">{profile.full_name}</p>
              </div>

              <div className="flex justify-between items-center w-full mt-1">
                <div className="bg-slate-50 px-4 py-2 rounded-xl border-2 border-slate-100">
                  <span className="text-[7px] font-black text-blue-600 uppercase block mb-0.5">BID Number</span>
                  <p className="text-sm font-black text-slate-800 font-mono tracking-tighter">{profile.bid_number}</p>
                </div>

                <div className="text-right max-w-[50%]">
                  <span className="text-[7px] font-black text-green-700 uppercase block mb-0.5">Residence</span>
                  <p className="text-[9px] font-bold text-slate-500 uppercase italic leading-tight">{profile.address}</p>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-8 pb-4 flex justify-between items-end">
              <div className="w-2/5">
                <div className="border-b-2 border-slate-900 mb-1"></div>
                <p className="text-[8px] font-black text-slate-900 uppercase tracking-wider">Resident Signature</p>
              </div>
              
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-green-800 shadow-sm relative">
                <div className="absolute inset-0 rounded-full border border-dashed border-green-800/30 animate-spin-slow"></div>
                <span className="text-green-800 font-black text-[7px] tracking-tighter">MAPORONG</span>
              </div>
            </div>

            <div className="h-2.5 bg-green-900 w-full"></div>
          </div>

          <style jsx global>{`
            @media print {
              #printable-id {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                position: fixed;
                left: 50%; top: 50%;
                transform: translate(-50%, -50%) scale(1.3);
                box-shadow: none !important;
                border: none !important;
              }
              body * { visibility: hidden; }
              #printable-id, #printable-id * { visibility: visible; }
            }
            .animate-spin-slow {
              animation: spin 8s linear infinite;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}