'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, UserSession } from '@/lib/auth/AuthContext';
import { ShieldAlert, User, Phone, MapPin, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'CITIZEN' | 'RESPONSE' | 'AUTHORITY'>('CITIZEN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [department, setDepartment] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
          department: department || (role === 'CITIZEN' ? 'Resident Citizen' : role === 'RESPONSE' ? 'NDRF Response Unit' : 'Disaster Management'),
          organization: role === 'CITIZEN' ? 'General Public' : role === 'RESPONSE' ? 'NDRF' : 'NDMA / SDMA',
          phone,
          location: location || 'Guwahati, Assam'
        })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        setSuccess(true);
        const sessionData: UserSession = data;
        localStorage.setItem('neer_auth_session', JSON.stringify(sessionData));
        setTimeout(() => {
          if (role === 'CITIZEN') {
            window.location.href = '/citizen';
          } else if (role === 'RESPONSE') {
            window.location.href = '/response';
          } else {
            window.location.href = '/';
          }
        }, 1200);
      } else {
        setError(data.detail || 'Registration failed. Please check your inputs.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060D17] text-slate-100 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden font-sans">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-md w-full space-y-6 z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-sky-600/20 border border-sky-500/40 rounded-2xl shadow-xl">
            <ShieldAlert className="w-9 h-9 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              NEER <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-400">Govt of India</span>
            </h1>
            <p className="text-slate-400 text-xs font-medium tracking-wide">
              Create Portal Account
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl space-y-5">
          {/* Role selector tabs */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('CITIZEN')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  role === 'CITIZEN'
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => setRole('RESPONSE')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  role === 'RESPONSE'
                    ? 'bg-amber-600 border-amber-400 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Response Fleet
              </button>
              <button
                type="button"
                onClick={() => setRole('AUTHORITY')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  role === 'AUTHORITY'
                    ? 'bg-sky-600 border-sky-400 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Authority
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-950/80 border border-red-700/60 rounded-xl p-3 flex items-start gap-2.5 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-950/80 border border-emerald-700/60 rounded-xl p-3 flex items-start gap-2.5 text-emerald-200 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Registration successful! Redirecting to your portal...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1">
                {role === 'CITIZEN' ? 'Full Name *' : role === 'RESPONSE' ? 'Team Name / Unit Lead *' : 'Officer Name *'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'CITIZEN' ? 'e.g. Ramesh Kalita' : role === 'RESPONSE' ? 'e.g. NDRF Unit 04' : 'e.g. Anand Sen'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Email Address *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@domain.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Mobile Number *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98640 12345"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">
                {role === 'CITIZEN' ? 'Home / Registered Location *' : role === 'RESPONSE' ? 'Station Base Location *' : 'Jurisdiction Location *'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Guwahati East, Kamrup Metro, Assam"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Password *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-9 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className={`w-full font-bold py-2.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 ${
                role === 'CITIZEN'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : role === 'RESPONSE'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-sky-600 hover:bg-sky-500 text-white'
              }`}
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Create {role === 'CITIZEN' ? 'Citizen' : role === 'RESPONSE' ? 'Response Fleet' : 'Authority'} Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="border-t border-slate-800 pt-3 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-sky-400 hover:underline font-bold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
