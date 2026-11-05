'use client';
import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
 const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else router.push('/dashboard');
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
            <input 
              type="password" required
              className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-green-600 outline-none text-black"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
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