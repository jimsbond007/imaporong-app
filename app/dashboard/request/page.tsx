'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { getRequestSlipNumber } from '../../../components/RequestSlip';

export default function RequestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [submittedSlip, setSubmittedSlip] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    sex: 'Male',
    civil_status: 'Single',
    birthday: '',
    age: '',
    address: '',
    height: '',
    weight: '',
    business: '',
    capital: '',
    cp_no: '',
    birth_place: '',
    purpose: '',
    service_type: 'Barangay Clearance',
    request_for: ''
  });

  const calculateAge = (birthDateString: string): string => {
    if (!birthDateString) return '';
    const today = new Date();
    const birthDate = new Date(`${birthDateString}T00:00:00`);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age.toString() : '';
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      // Only select columns that exist on the profiles table.
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, address')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFormData((prev) => ({
          ...prev,
          full_name: profile.full_name || '',
          address: profile.address || '',
        }));
      }
    };

    fetchProfile();
  }, [router]);

  const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBirthday = e.target.value;
    setFormData((prev) => ({
      ...prev,
      birthday: newBirthday,
      age: calculateAge(newBirthday)
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

      const { data: insertedRows, error } = await supabase
        .from('service_requests')
        .insert([
          {
            full_name: formData.full_name.trim(),
            sex: formData.sex,
            civil_status: formData.civil_status,
            birthday: formData.birthday,
            age: parseInt(formData.age, 10) || null,
            address: formData.address.trim(),
            height: formData.height.trim() || null,
            weight: formData.weight.trim() || null,
            business: formData.business.trim() || null,
            capital: formData.capital.trim() || null,
            cp_no: formData.cp_no.trim() || null,
            birth_place: formData.birth_place.trim() || null,
            purpose: formData.purpose.trim(),
            service_type: formData.service_type,
            request_for: formData.request_for.trim() || null,
            resident_id: user.id,
            status: 'pending'
          }
        ])
        .select('id, slip_number, created_at');

      if (error) {
        console.error('Failed to submit service request:', error);
        const missingSetup = ['42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205'].includes(error.code)
          || /does not exist|could not find/i.test(error.message);
        setFeedback({
          type: 'error',
          message: missingSetup
            ? 'The request database is missing required fields or slip-number setup. Ask the administrator to apply all SQL files in supabase/migrations in order, then reload this page.'
            : error.message,
        });
        return;
      }

      const inserted = insertedRows?.[0];

      // The database trigger normally generates this. Keep a safe fallback
      // for databases that have the column but not the trigger yet.
      const slipNumber = getRequestSlipNumber({
        id: inserted?.id,
        slip_number: inserted?.slip_number,
        created_at: inserted?.created_at,
      });

      if (inserted?.id && inserted.slip_number !== slipNumber) {
        const { error: updateError } = await supabase
          .from('service_requests')
          .update({ slip_number: slipNumber })
          .eq('id', inserted.id);

        if (updateError) {
          console.error('Failed to save request slip number:', updateError);
        }
      }

      setSubmittedSlip(slipNumber);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">

        <div className="bg-green-700 p-6 text-white">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-bold opacity-80 hover:opacity-100 transition-opacity mb-2 block"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tight">Document Request</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-200 mt-1">
            Barangay Maporong Request Slip
          </p>
        </div>

        {submittedSlip ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-3xl font-black">
              ✓
            </div>
            <div>
              <h2 className="text-2xl font-black text-green-900 uppercase tracking-tight">Request Submitted</h2>
              <p className="text-slate-500 text-sm font-bold mt-2">Your request slip number is</p>
              <p className="mt-3 inline-block bg-slate-50 border-2 border-dashed border-green-700 px-6 py-3 rounded-2xl font-mono text-xl font-black text-green-900">
                {submittedSlip}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-4 leading-relaxed">
                Please keep this number. The barangay administrator can view, print, and download your request slip.
              </p>
            </div>
            <button
              onClick={() => {
                setSubmittedSlip(null);
                setFeedback(null);
              }}
              className="w-full bg-white border-2 border-green-700 text-green-800 hover:bg-green-50 font-black py-4 rounded-xl transition-all uppercase text-xs tracking-widest"
            >
              Submit Another Request
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 uppercase text-xs tracking-widest"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">

            {feedback && (
              <div className={`md:col-span-2 p-4 rounded-2xl text-xs font-bold ${feedback.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                {feedback.message}
              </div>
            )}

            {/* Service Type */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Service Requested</label>
              <select
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
              >
                <option>Barangay Clearance</option>
                <option>Certificate of Indigency</option>
                <option>Residency Certificate</option>
                <option>Barangay ID Card</option>
                <option>Business Clearance</option>
              </select>
            </div>

            {/* Name & Age */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
              <input
                type="text"
                required
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Age (auto)</label>
              <input
                type="text"
                readOnly
                placeholder="Computed from birth date"
                className="w-full p-3 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-500 outline-none"
                value={formData.age}
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
              <input
                type="text"
                required
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            {/* Height & Weight */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Height</label>
              <input
                type="text"
                placeholder={`e.g. 5'6"`}
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Weight</label>
              <input
                type="text"
                placeholder="e.g. 60 kg"
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>

            {/* Business & Capital */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Business (Optional)</label>
              <input
                type="text"
                placeholder="Business name"
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.business}
                onChange={(e) => setFormData({ ...formData, business: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Capital (Optional)</label>
              <input
                type="text"
                placeholder="e.g. PHP 50,000"
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.capital}
                onChange={(e) => setFormData({ ...formData, capital: e.target.value })}
              />
            </div>

            {/* CP No. & Birth Place */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">CP No. (Optional)</label>
              <input
                type="tel"
                placeholder="09XXXXXXXXX"
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.cp_no}
                onChange={(e) => setFormData({ ...formData, cp_no: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Birth Place (Optional)</label>
              <input
                type="text"
                placeholder="City / Municipality"
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.birth_place}
                onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
              />
            </div>

            {/* Birth Date & Civil Status */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Birth Date</label>
              <input
                type="date"
                required
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.birthday}
                onChange={handleBirthdayChange}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Civil Status</label>
              <select
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.civil_status}
                onChange={(e) => setFormData({ ...formData, civil_status: e.target.value })}
              >
                <option>Single</option>
                <option>Married</option>
                <option>Widowed</option>
                <option>Separated</option>
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
              <select
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
              >
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>

            {/* Purpose */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Purpose of Request</label>
                <span className="text-[10px] font-bold text-slate-400">{formData.purpose.length}/200</span>
              </div>
              <input
                type="text"
                required
                maxLength={200}
                placeholder="e.g. Local Employment, Scholarship"
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              />
            </div>

            {/* For Whom (Optional) */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">For Whom (Optional)</label>
              <input
                type="text"
                placeholder="Leave blank if for yourself"
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none transition-colors"
                value={formData.request_for}
                onChange={(e) => setFormData({ ...formData, request_for: e.target.value })}
              />
            </div>

            <p className="md:col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              A request slip number will be generated automatically after submission.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="md:col-span-2 w-full bg-green-700 hover:bg-green-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 mt-2"
            >
              {loading ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
