'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. In a real app, you'd use Supabase Auth to sign up the user first.
    // For this step, we are just inserting data into the profiles table.
    const { error } = await supabase
      .from('profiles')
      .insert([
        { 
          full_name: fullName, 
          address: address, 
          is_verified: false // Always false by default
        },
      ]);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Success! Your application is now pending Admin approval.");
      setFullName('');
      setAddress('');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Barangay Maporong</h2>
        <p className="text-gray-500 text-center mb-6">Resident Registration</p>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              type="text" 
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Dela Cruz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Purok / Street Address</label>
            <input 
              type="text" 
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Purok 1, Maporong"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-bold"
          >
            {loading ? 'Submitting...' : 'Register as Resident'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center text-sm font-medium ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}