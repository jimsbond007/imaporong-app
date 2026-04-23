'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  const { data, error } = isLogin 
    ? await supabase.auth.signInWithPassword({ email, password })
    : await supabase.auth.signUp({ email, password });

  if (error) {
    alert(error.message);
  } else if (data?.user) {
    // FETCH THE ROLE FROM PROFILES
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role === 'admin') {
      router.push('/admin'); // Redirect admins here
    } else {
      router.push('/dashboard'); // Residents go here
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

      {/* HERO SECTION */}
      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1">
          <span className="bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Official Baranggay Digital Portal</span>
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-green-900 mt-4 mb-6 leading-[0.9]">
            GROWTH. <br />
            CULTURE. <br />
            <span className="text-orange-500 italic text-5xl md:text-7xl underline decoration-yellow-400">HARVEST.</span>
          </h2>
          <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8 max-w-md">
            Welcome to **Barangay Maporong**. Our digital portal allows residents to apply for documents, generate official IDs, and stay updated with community progress.
          </p>
          <div className="flex gap-4">
            <a href="#portal" className="inline-block bg-green-800 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-transform">
              Get Started →
            </a>
          </div>
        </div>

        {/* ABSTRACT FESTIVE ART */}
        <div className="order-1 md:order-2 relative h-[400px] md:h-[550px] bg-slate-50 rounded-[4rem] overflow-hidden border-8 border-white shadow-2xl">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 500" preserveAspectRatio="none">
            <circle cx="350" cy="50" r="120" fill="#facc15" fillOpacity="0.4" />
            <path d="M-50 300 Q100 200 250 350 T500 300 V500 H-50 Z" fill="#14532d" />
            <path d="M-50 350 Q120 280 280 400 T550 350 V500 H-50 Z" fill="#ea580c" fillOpacity="0.7" />
            <path d="M-50 400 Q150 350 300 450 T600 400 V500 H-50 Z" fill="#2563eb" fillOpacity="0.5" />
            {/* Abstract Leaves/Plants */}
            <path d="M300 350 Q320 320 350 350 T380 350" stroke="white" strokeWidth="4" fill="none" opacity="0.3" />
            <path d="M50 420 Q70 390 100 420 T150 420" stroke="white" strokeWidth="4" fill="none" opacity="0.3" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-white/50 text-center scale-110">
              <p className="text-5xl font-black text-green-900 leading-none mb-2 italic tracking-tighter">2026</p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Digital Harvest</p>
            </div>
          </div>
        </div>
      </main>

      {/* ABOUT & INFO SECTION */}
      <section className="bg-white py-24 px-6 max-w-7xl mx-auto grid md:grid-cols-3 gap-12 border-t border-slate-100">
          <div>
            <h4 className="text-green-800 font-black uppercase text-xs tracking-widest mb-4">Our Mission</h4>
            <p className="text-slate-500 text-sm font-bold leading-relaxed">To provide seamless digital access to barangay services while preserving our rich cultural heritage through modern technology.</p>
          </div>
          <div>
            <h4 className="text-orange-600 font-black uppercase text-xs tracking-widest mb-4">Digital Identity</h4>
            <p className="text-slate-500 text-sm font-bold leading-relaxed">Every resident receives a unique BID Number and a festive digital ID, making verification fast and easy for all local services.</p>
          </div>
          <div>
            <h4 className="text-blue-600 font-black uppercase text-xs tracking-widest mb-4">Request Hub</h4>
            <p className="text-slate-500 text-sm font-bold leading-relaxed">Apply for Barangay Clearances, Indigency, and Residency Certificates directly from your dashboard 24/7.</p>
          </div>
      </section>

      {/* AUTH PORTAL SECTION */}
      <section id="portal" className="bg-slate-100 py-24 px-6 flex justify-center">
        <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl border-b-8 border-green-800">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 italic">
              {isLogin ? 'Resident Login' : 'Resident Sign Up'}
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Maporong Digital Services</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Email Address</label>
              <input 
                type="email" 
                placeholder="resident@maporong.com"
                className="w-full p-5 bg-slate-50 rounded-2xl border-none ring-2 ring-transparent focus:ring-green-800 outline-none transition-all font-bold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full p-5 bg-slate-50 rounded-2xl border-none ring-2 ring-transparent focus:ring-green-800 outline-none transition-all font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-800 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-orange-600 transition-all mt-4"
            >
              {loading ? 'Processing...' : isLogin ? 'Login to Portal' : 'Register Account'}
            </button>
          </form>

          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-green-800 transition-colors"
          >
            {isLogin ? "New resident? Create an account" : "Already have an account? Login"}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-white text-center border-t border-slate-100">
        <div className="flex justify-center gap-3 mb-6">
          <div className="w-2 h-2 rounded-full bg-green-800"></div>
          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
        </div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em]">Barangay Maporong Official Portal © 2026</p>
      </footer>
    </div>
  );
}