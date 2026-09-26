'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldAlert, 
  Globe, 
  RefreshCw, 
  Shield, 
  LifeBuoy, 
  Radio, 
  ChevronDown,
  Clock,
  Menu,
  LogOut,
  User,
  HeartPulse
} from 'lucide-react';
import { UserRole, LanguageCode } from '@/lib/types';
import { useAuth } from '@/lib/auth/AuthContext';

interface HeaderProps {
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole = 'authority',
  onRoleChange,
  onToggleMobileMenu,
}) => {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<LanguageCode>('en');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLastUpdated(
        now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) +
          ', ' +
          now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }) +
          ' IST'
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const getRoleFromPath = (): UserRole => {
    if (pathname?.startsWith('/citizen')) return 'citizen';
    if (pathname?.startsWith('/response')) return 'response';
    return 'authority';
  };

  const activeRole = currentRole || getRoleFromPath();

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AO';

  return (
    <header className="bg-[#0B192C] text-white border-b border-slate-800 shadow-2xl sticky top-0 z-50">
      <div className="max-w-[1700px] mx-auto px-4 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* 1. Mobile Menu Toggle & Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white lg:hidden"
              title="Toggle Menu Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="p-2.5 bg-sky-600 rounded-xl shadow-lg border border-sky-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                  NEER <span className="text-sky-400 text-xs font-bold px-2 py-0.5 rounded bg-sky-950 border border-sky-800">Govt of India</span>
                </h1>
              </div>
              <p className="text-xs text-slate-300 font-semibold tracking-wide">
                FlashFlood Prediction & Response System
              </p>
            </div>
          </div>

          {/* 2. Role-Specific Dedicated Portal Badge */}
          <div className="flex items-center self-start lg:self-center">
            {pathname?.startsWith('/ambulance') ? (
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 shadow-md">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <HeartPulse className="w-4 h-4 text-rose-400" />
                <div className="text-left">
                  <span className="text-xs font-black tracking-wide block uppercase text-white">Emergency Medical Fleet</span>
                  <span className="text-[10px] text-rose-300/90 font-medium">Triage Desk & Hospital Network</span>
                </div>
              </div>
            ) : activeRole === 'citizen' ? (
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <LifeBuoy className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <span className="text-xs font-black tracking-wide block uppercase text-white">Citizen Portal</span>
                  <span className="text-[10px] text-emerald-400/90 font-medium">Public Safety & Emergency Network</span>
                </div>
              </div>
            ) : activeRole === 'response' ? (
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 shadow-md">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <Radio className="w-4 h-4 text-amber-400" />
                <div className="text-left">
                  <span className="text-xs font-black tracking-wide block uppercase text-white">Response Fleet Portal</span>
                  <span className="text-[10px] text-amber-400/90 font-medium">Field Operations & Dispatch Desk</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-sky-950/80 border border-sky-500/40 text-sky-300 shadow-md">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <Shield className="w-4 h-4 text-sky-400" />
                <div className="text-left">
                  <span className="text-xs font-black tracking-wide block uppercase text-white">Disaster Authority Command</span>
                  <span className="text-[10px] text-sky-400/90 font-medium">Integrated Decision & Monitoring System</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Controls: Timestamp, Language, User Menu */}
          <div className="flex flex-wrap items-center gap-3 text-xs self-end lg:self-center">
            
            {/* Timestamp */}
            <div className="hidden xl:flex flex-col text-right pr-2 border-r border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3 text-sky-400" />
                System Time
              </span>
              <span className="font-mono text-sky-300 font-semibold text-[11px]">
                {lastUpdated || '17 Sep 2026, 02:00:32 IST'}
              </span>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as LanguageCode)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="en" className="bg-slate-900 text-white">English (EN)</option>
                <option value="hi" className="bg-slate-900 text-white">हिन्दी (HI)</option>
                <option value="bn" className="bg-slate-900 text-white">বাংলা (BN)</option>
                <option value="ta" className="bg-slate-900 text-white">தமிழ் (TA)</option>
                <option value="te" className="bg-slate-900 text-white">తెలుగు (TE)</option>
                <option value="mr" className="bg-slate-900 text-white">मराठी (MR)</option>
                <option value="gu" className="bg-slate-900 text-white">ગુજરાતી (GU)</option>
              </select>
            </div>

            {/* Refresh Sync */}
            <button
              onClick={handleRefresh}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-all flex items-center gap-1"
              title="Sync Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* User Profile Dropdown Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-200 font-semibold transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-sky-700 border border-sky-400 flex items-center justify-center text-white font-bold text-[10px]">
                    {userInitials}
                  </div>
                  <span className="hidden sm:inline">{user?.name || 'Authorized User'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-slate-200">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="font-bold text-white text-xs">{user?.name}</p>
                      <p className="text-[10px] text-slate-400">{user?.department}</p>
                      <p className="text-[9px] text-sky-400 font-mono mt-0.5">{user?.email}</p>
                    </div>
                    <div className="py-1 space-y-0.5">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-red-950/60 hover:text-red-300 text-red-400 rounded font-bold flex items-center gap-2 transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-400" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
