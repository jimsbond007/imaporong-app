'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function RequestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    birthday: '',
    age: '',
    address: '',
    purpose: '',
    service_type: 'Barangay Clearance',
    request_for: ''
  });

  // Calculate age dynamically from birthday
  const calculateAge = (birthDateString: string): string => {
    if (!birthDateString) return '';
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age.toString() : '';
  };

  // Auto-fill profile details if user is logged in
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, birthday, age, address')
        .eq('id', user.id)
        .single();

      if (profile) {
        const birthdayVal = profile.birthday || '';
        const computedAge = profile.age ? profile.age.toString() : calculateAge(birthdayVal);

        setFormData((prev) => ({
          ...prev,
          full_name: profile.full_name || '',
          birthday: birthdayVal,
          age: computedAge,
          address: profile.address || '',
        }));
      }
    };

    fetchProfile();
  }, [router]);

  // Handle birthday change and update age automatically
  const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBirthday = e.target.value;
    const computedAge = calculateAge(newBirthday);
    setFormData((prev) => ({
      ...prev,
      birthday: newBirthday,
      age: computedAge || prev.age
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const { error } = await supabase.from('service_requests').insert([
        { 
          ...formData, 
          resident_id: user.id,
          age: parseInt(formData.age, 10) || null,
          request_for: formData.request_for.trim() || null,
          status: 'pending'
        }
      ]);

      if (error) {
        setFeedback({ type: 'error', message: error.message });
      } else {
        setFeedback({ type: 'success', message: 'Request submitted successfully! Redirecting...' });
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 font-sans">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-green-700 p-6 text-white">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="text-sm font-bold opacity-80 hover:opacity-100 transition-opacity mb-2 block"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tight">Document Request</h1>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div className={`p-4 mx-8 mt-6 rounded-2xl text-xs font-bold ${feedback.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {feedback.message}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 gap-4">
          
          {/* Service Type */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Type of Certificate/Service</label>
            <select 
              className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
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
              <input 
                type="text" 
                required 
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.full_name} 
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
              <input 
                type="number" 
                required 
                min="1"
                max="120"
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.age} 
                onChange={(e) => setFormData({ ...formData, age: e.target.value })} 
              />
            </div>
          </div>

          {/* Birthday */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Birthday</label>
            <input 
              type="date" 
              required 
              className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
              value={formData.birthday} 
              onChange={handleBirthdayChange} 
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Current Address</label>
            <input 
              type="text" 
              required 
              className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
              value={formData.address} 
              onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
            />
          </div>

          {/* Purpose with Max Character Count */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Purpose of Request</label>
              <span className="text-[10px] font-bold text-slate-400">{formData.purpose.length}/100</span>
            </div>
            <input 
              type="text" 
              required 
              maxLength={100}
              placeholder="e.g. Local Employment, Scholarship" 
              className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
              value={formData.purpose} 
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} 
            />
          </div>

          {/* For Whom (Optional) */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">For Whom (Optional)</label>
            <input 
              type="text" 
              placeholder="Leave blank if for yourself" 
              className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
              value={formData.request_for} 
              onChange={(e) => setFormData({ ...formData, request_for: e.target.value })} 
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 mt-4"
          >
            {loading ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
          </button>
        </form>
      </div>
    </div>
  );
}
