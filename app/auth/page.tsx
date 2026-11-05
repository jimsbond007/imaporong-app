'use client';
import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
 const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
   const [age, setAge] = useState('');
   const [gender, setGender] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      // 1. Sign Up the User
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
      } else if (data.user) {
        // 2. Create the Resident Profile automatically
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            full_name: fullName,
            address,
            age: Number(age),
            gender,
            role: 'resident',
            is_verified: false,
          }
        ]);
        if (profileError) {
          console.error('Failed to create resident profile:', profileError);
          alert(`Your account was created, but the resident profile could not be saved: ${profileError.message}`);
        } else {
          alert("Registration successful! You can now log in.");
          setIsSignUp(false);
        }
      }
    } else {
      // Log In
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert(error.message);
      } else if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile) {
          console.error('Could not load signed-in user role:', profileError);
          await supabase.auth.signOut();
          alert('Your account role could not be verified. Please contact the barangay administrator.');
        } else if (profile.role === 'admin') {
          router.replace('/admin');
        } else if (profile.role === 'resident') {
          router.replace('/dashboard');
        } else {
          await supabase.auth.signOut();
          alert('This account does not have an authorized portal role.');
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Top Header Design */}
        <div className="bg-green-700 p-8 text-center">
          <Image
            src="/maporong-logo.png"
            alt="Barangay Maporong"
            width={120}
            height={75}
            priority
            className="mx-auto h-12 w-auto rounded-md bg-white p-1 object-contain"
          />
          <p className="text-orange-300 text-sm font-bold mt-2">
            {isSignUp ? 'Create Resident Account' : 'Resident Login'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="p-8 space-y-4">
          {isSignUp && (
  <>
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
      <input 
        type="text" required
        className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none text-black"
        value={fullName} onChange={(e) => setFullName(e.target.value)}
      />
    </div>
    
    {/* NEW ADDRESS FIELD */}
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase">Home Address</label>
      <input 
        type="text" required
        className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none text-black"
        placeholder="Purok 1, Maporong"
        value={address} onChange={(e) => setAddress(e.target.value)}
      />
    </div>
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
      <input
        type="number"
        min="0"
        max="120"
        required
        className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none text-black"
        value={age}
        onChange={(e) => setAge(e.target.value)}
      />
    </div>
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
      <select
        required
        className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none text-black"
        value={gender}
        onChange={(e) => setGender(e.target.value)}
      >
        <option value="" disabled>Select gender</option>
        <option value="Female">Female</option>
        <option value="Male">Male</option>
        <option value="Other">Other</option>
        <option value="Prefer not to say">Prefer not to say</option>
      </select>
    </div>
  </>
)}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
            <input 
              type="email" required
              className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none text-black"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full rounded-xl border-2 border-slate-100 p-3 pr-12 text-black outline-none focus:border-green-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  {showPassword ? (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 8.5 4.5 9.5 6.2a1.5 1.5 0 010 1.6 15.8 15.8 0 01-3.1 3.5M6.2 6.2a16.5 16.5 0 00-3.7 5 1.5 1.5 0 000 1.6C3.5 14.5 6.8 19 12 19c1 0 2-.2 2.9-.5" />
                    </>
                  ) : (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.2-7 9.5-7 9.5 7 9.5 7-3.2 7-9.5 7-9.5-7-9.5-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 mt-4"
          >
            {loading ? 'Processing...' : isSignUp ? 'REGISTER' : 'LOGIN'}
          </button>

          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-sm text-slate-500 font-bold mt-4 hover:text-orange-600"
          >
            {isSignUp ? 'Already have an account? Log In' : 'No account yet? Register here'}
          </button>
        </form>
      </div>
    </div>
  );
}