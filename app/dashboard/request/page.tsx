'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function RequestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    birthday: '',
    age: '',
    address: '',
    purpose: '',
    service_type: 'Barangay Clearance',
    request_for: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/auth');

    const { error } = await supabase.from('service_requests').insert([
      { 
        ...formData, 
        resident_id: user.id,
        age: parseInt(formData.age) 
      }
    ]);

    if (error) {
      alert(error.message);
    } else {
      alert("Request submitted successfully!");
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-green-700 p-6 text-white">
          <button onClick={() => router.back()} className="text-sm font-bold opacity-80 mb-2">← Back to Dashboard</button>
          <h1 className="text-2xl font-black uppercase">Document Request</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 gap-4">
          {/* Service Type */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Type of Certificate/Service</label>
            <select 
              className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none"
              value={formData.service_type}
              onChange={(e) => setFormData({...formData, service_type: e.target.value})}
            >
              <option>Barangay Clearance</option>
              <option>Certificate of Indigency</option>
              <option>Residency Certificate</option>
              <option>Barangay ID Card</option>
            </select>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
              <input type="text" required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none"
                value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
              <input type="number" required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none"
                value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Birthday</label>
            <input type="date" required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none"
              value={formData.birthday} onChange={(e) => setFormData({...formData, birthday: e.target.value})} />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Current Address</label>
            <input type="text" required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none"
              value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Purpose of Request</label>
            <input type="text" required placeholder="e.g. Local Employment, Scholarship" className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none"
              value={formData.purpose} onChange={(e) => setFormData({...formData, purpose: e.target.value})} />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">For Whom (Optional)</label>
            <input type="text" placeholder="Leave blank if for yourself" className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none"
              value={formData.request_for} onChange={(e) => setFormData({...formData, request_for: e.target.value})} />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 mt-4"
          >
            {loading ? 'Submitting...' : 'SUBMIT REQUEST'}
          </button>
        </form>
      </div>
    </div>
  );
}