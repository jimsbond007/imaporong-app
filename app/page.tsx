'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState(''); // ✅ ADDED
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      // LOGIN
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        alert(error.message);
      } else if (data?.user) {
        // FETCH ROLE
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }

    } else {
      // SIGN UP WITH ADDRESS
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            address: address,
            full_name: email.split('@')[0],
            role: 'resident'
          }
        }
      });

      if (error) {
        alert(error.message);
      } else {
        alert("Registration successful! Please check your email.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth">
      
      {/* NAVIGATION */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-green-800 rounded-full flex items-center justify-center text-white font-black italic shadow-lg">M</div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic text-green-900">iMaporong</h1>
        </div>
        <div className="flex gap-6 items-center">
          <a href="#portal" className="bg-green-800 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md">
            Resident Portal
          </a>
        </div>
      </nav>

      {/* HERO */}
      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            Official Barangay Digital Portal
          </span>
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-green-900 mt-4 mb-6 leading-[0.9]">
            GROWTH. <br />
            CULTURE. <br />
            <span className="text-orange-500 italic text-5xl md:text-7xl underline decoration-yellow-400">
              HARVEST.
            </span>
          </h2>
          <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8 max-w-md">
            Welcome to Barangay Maporong. Apply for documents, generate IDs, and stay updated with your community.
          </p>
          <a href="#portal" className="inline-block bg-green-800 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-transform">
            Get Started →
          </a>
        </div>

        <div className="relative h-[400px] md:h-[550px] bg-slate-50 rounded-[4rem] overflow-hidden border-8 border-white shadow-2xl">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 500">
            <circle cx="350" cy="50" r="120" fill="#facc15" fillOpacity="0.4" />
            <path d="M-50 300 Q100 200 250 350 T500 300 V500 H-50 Z" fill="#14532d" />
            <path d="M-50 350 Q120 280 280 400 T550 350 V500 H-50 Z" fill="#ea580c" fillOpacity="0.7" />
          </svg>
        </div>
      </main>

      {/* AUTH */}
      <section id="portal" className="bg-slate-100 py-24 px-6 flex justify-center">
        <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl border-b-8 border-green-800">
          
          <div className="text-center mb-10">
            <h3 className="text-3xl font-black uppercase tracking-tighter italic">
              {isLogin ? 'Resident Login' : 'Resident Sign Up'}
            </h3>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">

            {/* EMAIL */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4">
                Email Address
              </label>
              <input
                type="email"
                placeholder="resident@maporong.com"
                className="w-full p-5 bg-slate-50 rounded-2xl font-bold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* ✅ ADDRESS (ONLY SIGNUP) */}
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">
                  Home Address
                </label>
                <input
                  type="text"
                  placeholder="Purok, Street, Maporong"
                  className="w-full p-5 bg-slate-50 rounded-2xl font-bold"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            )}

            {/* PASSWORD */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full p-5 bg-slate-50 rounded-2xl font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-800 text-white py-5 rounded-2xl font-black uppercase text-xs mt-4"
            >
              {loading ? 'Processing...' : isLogin ? 'Login to Portal' : 'Register Account'}
            </button>
          </form>

          {/* TOGGLE */}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-6 text-[10px] font-black uppercase text-slate-400"
          >
            {isLogin ? "New resident? Create an account" : "Already have an account? Login"}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 text-center text-slate-400 text-xs">
        Barangay Maporong Official Portal © 2026
      </footer>
    </div>
  );
}