'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image'; // Run: npm install html-to-image

interface Profile {
  full_name: string;
  address: string;
  bid_number: string;
  is_verified: boolean;
}

interface ServiceRequest {
  id: string;
  service_type: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIdModal, setShowIdModal] = useState(false);
  const idCardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) setProfile(profileData);
      const { data: requestData } = await supabase.from('service_requests').select('*').eq('resident_id', user.id).order('created_at', { ascending: false });
      if (requestData) setRequests(requestData);
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const handlePrint = () => { window.print(); };

  const handleSaveImage = async () => {
    if (idCardRef.current === null) return;
    
    const dataUrl = await toPng(idCardRef.current, { cacheBust: true });
    const link = document.createElement('a');
    link.download = `Maporong-ID-${profile?.full_name}.png`;
    link.href = dataUrl;
    link.click();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-green-800 text-2xl">LOADING...</div>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12 font-sans">
      <nav className="bg-green-800 p-5 text-white flex justify-between items-center shadow-lg mb-8 print:hidden border-b-4 border-yellow-500">
        <h1 className="font-black tracking-tighter uppercase text-2xl italic">iMaporong</h1>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/auth'))} className="bg-orange-600 px-6 py-2 rounded-lg font-black text-xs uppercase hover:bg-yellow-500 transition-all">LOGOUT</button>
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-6 print:hidden">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-[40px] shadow-xl border-b-8 border-green-700">
            <h2 className="text-3xl font-black text-green-900 mb-4 tracking-tighter uppercase">Mabalos, {profile?.full_name?.split(' ')[0]}!</h2>
            {profile?.is_verified && (
              <button onClick={() => setShowIdModal(true)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-blue-700 transition-all">
                Print Resident ID
              </button>
            )}
          </div>
          
          <div className="md:col-span-2 bg-green-900 p-8 rounded-[40px] text-white relative overflow-hidden shadow-xl flex flex-col justify-center">
              <div className="z-10">
                <h3 className="text-4xl font-black tracking-tighter italic uppercase leading-none">Services</h3>
                <button onClick={() => router.push('/dashboard/request')} className="mt-6 bg-yellow-500 text-black px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-orange-500 transition-all">
                    Request Form →
                </button>
              </div>
          </div>
        </div>

        <div className="bg-white rounded-[40px] shadow-xl overflow-hidden">
          <div className="bg-slate-900 p-6"><h3 className="text-white font-black uppercase tracking-widest text-xs">Request Status History</h3></div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-[10px] font-black text-slate-400 uppercase">
                <th className="p-6">Document</th>
                <th className="p-6">Status</th>
                <th className="p-6">Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="p-6 font-black text-slate-800 uppercase">{r.service_type}</td>
                    <td className="p-6 font-black uppercase text-[10px] text-green-600">{r.status}</td>
                    <td className="p-6 text-slate-400 text-sm">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* --- ATM SIZED FESTIVE ID --- */}
      {showIdModal && profile && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-4">
          <div className="flex flex-wrap justify-center gap-4 mb-8 print:hidden">
            <button onClick={handlePrint} className="bg-green-600 text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest">Print ID</button>
            <button onClick={handleSaveImage} className="bg-blue-600 text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest">Save as Image</button>
            <button onClick={() => setShowIdModal(false)} className="bg-white/10 text-white px-8 py-3 rounded-full font-black text-xs uppercase">Close</button>
          </div>

          {/* ATM CARD: 85.6mm x 53.98mm */}
          <div ref={idCardRef} id="printable-id" className="w-[450px] h-[280px] bg-white rounded-[1rem] shadow-2xl overflow-hidden relative flex flex-col border border-slate-200">
            
            {/* THICKER HEADER (40% height) */}
            <div className="relative h-[40%] w-full bg-[#14532d] overflow-hidden">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 450 112" preserveAspectRatio="none">
                    <path d="M0 0 L450 0 L450 85 Q225 115 0 85 Z" fill="#14532d" />
                    <circle cx="410" cy="25" r="70" fill="#facc15" fillOpacity="0.2" />
                    <path d="M0 0 L140 0 L0 110 Z" fill="#ea580c" fillOpacity="0.4" />
                    <path d="M450 0 L310 0 L450 95 Z" fill="#2563eb" fillOpacity="0.3" />
                    {/* Festive Bunting */}
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

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 px-8 py-3 flex flex-col justify-between items-center text-center">
                <div className="w-full">
                    <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-0.5">Full Name</span>
                    <p className="text-3xl font-black text-slate-900 uppercase leading-none tracking-tight">{profile.full_name}</p>
                </div>

                <div className="flex justify-between items-center w-full mt-1">
                    {/* Compact BID Number Badge */}
                    <div className="bg-slate-50 px-4 py-2 rounded-xl border-2 border-slate-100">
                        <span className="text-[7px] font-black text-blue-600 uppercase block mb-0.5">BID Number</span>
                        <p className="text-sm font-black text-slate-800 font-mono tracking-tighter">{profile.bid_number}</p>
                    </div>

                    {/* Address */}
                    <div className="text-right max-w-[50%]">
                        <span className="text-[7px] font-black text-green-700 uppercase block mb-0.5">Residence</span>
                        <p className="text-[9px] font-bold text-slate-500 uppercase italic leading-tight">{profile.address}</p>
                    </div>
                </div>
            </div>

            {/* FOOTER SIGNATURE & SEAL */}
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