'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Resident {
  full_name: string;
  address: string;
  bid_number: string;
  is_verified: boolean;
}

export default function MyIDPage() {
  const [searchName, setSearchName] = useState('');
  const [resident, setResident] = useState<Resident | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const findResident = async () => {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('full_name', searchName)
      .eq('is_verified', true)
      .single();

    if (fetchError || !data) {
      setError("Resident not found or not yet approved.");
      setResident(null);
    } else {
      setResident(data as Resident);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white p-8 text-slate-900">
      <div className="max-w-md mx-auto">
        {/* Header with Maporong Colors */}
        <div className="text-center mb-10">
          <div className="flex justify-center gap-1 mb-4">
             <div className="w-8 h-2 bg-green-600 rounded-full"></div>
             <div className="w-8 h-2 bg-orange-500 rounded-full"></div>
             <div className="w-8 h-2 bg-blue-600 rounded-full"></div>
             <div className="w-8 h-2 bg-yellow-400 rounded-full"></div>
          </div>
          <h1 className="text-3xl font-black text-green-800 uppercase tracking-tight">Barangay Maporong</h1>
          <p className="text-orange-600 font-bold">Resident ID Portal</p>
        </div>

        {/* Search Box */}
        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-green-100 shadow-xl mb-8">
          <input 
            type="text"
            placeholder="Enter Full Name..."
            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none text-black mb-4"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <button 
            onClick={findResident}
            className="w-full bg-green-700 hover:bg-green-800 text-white py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95"
          >
            {loading ? 'Searching...' : 'Generate My ID'}
          </button>
        </div>

        {error && <p className="text-red-500 text-center font-bold mb-4">{error}</p>}

        {resident && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* THE MAPORONG ID CARD */}
            <div id="id-card" className="w-[360px] h-[220px] bg-white rounded-xl shadow-2xl border-2 border-slate-200 relative overflow-hidden flex flex-col">
              
              {/* Top Banner (Green & Orange) */}
              <div className="h-3 bg-green-600 w-full"></div>
              <div className="h-1 bg-orange-500 w-full"></div>
              
              <div className="p-4 flex-1 relative">
                {/* Yellow Accent Circle */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-100 rounded-full opacity-50 z-0"></div>
                
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[9px] font-bold text-blue-800 uppercase">Province of Albay</p>
                        <h2 className="text-md font-black text-green-800">BRGY. MAPORONG</h2>
                      </div>
                      <div className="w-10 h-10 bg-slate-100 rounded-full border border-yellow-400 flex items-center justify-center text-[8px] font-bold">LOGO</div>
                   </div>

                   <div className="mt-6">
                      <p className="text-[8px] uppercase text-slate-400 font-bold">Official Resident</p>
                      <h3 className="text-xl font-bold text-slate-900 border-b-2 border-orange-500 inline-block uppercase">
                        {resident.full_name}
                      </h3>
                   </div>

                   <div className="mt-6 flex justify-between items-end">
                      <div>
                        <p className="text-[8px] uppercase text-slate-400 font-bold">Resident ID (BID)</p>
                        <p className="text-lg font-mono font-black text-blue-700">{resident.bid_number}</p>
                      </div>
                      <div className="text-[10px] font-bold text-green-700">VALID 2026</div>
                   </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => window.print()}
              className="mt-8 bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-800 transition flex items-center gap-2"
            >
              Print ID Card
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #id-card, #id-card * { visibility: visible; }
          #id-card { position: absolute; left: 50%; top: 20%; transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}