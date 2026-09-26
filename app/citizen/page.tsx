'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { useAuth } from '@/lib/auth/AuthContext';
import { workflowService, AlertData, CitizenData } from '@/lib/services/workflowService';
import { 
  LifeBuoy, 
  MapPin, 
  Search, 
  Bell, 
  PhoneCall, 
  ShieldCheck, 
  Building2, 
  User, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Siren,
  ShieldAlert
} from 'lucide-react';
import { useRealtimeSync } from '@/lib/services/realtimeSync';

export default function CitizenHomePage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user } = useAuth();
  const [profile, setProfile] = useState<CitizenData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [locationName, setLocationName] = useState<string>('Chamoli Basin, Uttarakhand');
  const [loading, setLoading] = useState<boolean>(true);

  const loadCitizenData = async () => {
    try {
      const [prof, alertList] = await Promise.all([
        workflowService.getMyCitizenProfile(),
        workflowService.getAlerts()
      ]);
      if (prof) {
        setProfile(prof);
        if (prof.address || prof.district) {
          setLocationName([prof.address, prof.district, prof.state].filter(Boolean).join(', ') || 'Chamoli Basin, Uttarakhand');
        }
      }
      if (alertList && alertList.length > 0) {
        setAlerts(alertList.filter(a => a.status === 'Active' || a.status === 'Approved'));
      }
    } catch (e) {
      console.error('Error loading citizen data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCitizenData();
  }, []);

  useRealtimeSync({
    onEvent: (evt) => {
      if (evt.type === 'ALERT_DISPATCHED') {
        loadCitizenData();
      }
    }
  });

  const activeEmergencyAlert = alerts.find(a => a.severity === 'Emergency' || a.severity === 'Warning');

  const citizenDisplayName = profile?.name || user?.name || 'Citizen Resident';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="citizen" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="citizen" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-4 md:p-6 max-w-[1300px] mx-auto space-y-6">
          
          {/* Urgent Live Emergency Alert Banner */}
          {activeEmergencyAlert && (
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-5 shadow-2xl border-2 border-red-400">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-white text-red-700 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      CRITICAL EVACUATION WARNING
                    </span>
                    <span className="text-xs text-red-100 font-mono">
                      Target Area: {activeEmergencyAlert.location_name}
                    </span>
                  </div>
                  <h2 className="text-lg md:text-xl font-black tracking-tight">
                    {activeEmergencyAlert.title}
                  </h2>
                  <p className="text-xs text-red-100 max-w-2xl leading-relaxed">
                    {activeEmergencyAlert.message}
                  </p>
                  <div className="text-[11px] font-bold text-amber-200 flex items-center gap-1.5 pt-1">
                    <AlertTriangle className="w-4 h-4 text-amber-300" />
                    <span>Directive: {activeEmergencyAlert.recommended_action}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                  <Link
                    href="/citizen/shelters"
                    className="px-4 py-2.5 bg-white hover:bg-slate-100 text-red-600 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>View Nearest High Ground Shelters</span>
                  </Link>
                  <Link
                    href="/citizen/alerts"
                    className="px-4 py-2 bg-red-950/60 hover:bg-red-900 border border-red-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Acknowledge Official Alert</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Welcome & Location Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Citizen Safety Portal
                </span>
                <DataBadge label="CONNECTED" variant="live" />
              </div>
              <h1 className="text-2xl font-black text-slate-900">
                Welcome, {citizenDisplayName}
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Registered Location:</span>
                <span className="font-semibold text-slate-800">{locationName}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Area Susceptibility</span>
                <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                  Moderate Risk (48%)
                </span>
              </div>
              <Link
                href="/citizen/profile"
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                title="Edit Registered Location"
              >
                <User className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Emergency 1-Click SOS Highlight Card */}
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-5 md:p-6 shadow-xl border border-red-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Emergency Assistance
                </span>
                <span className="text-xs font-semibold text-red-100">Direct link to NDRF / SDRF Command</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">
                Are you trapped or facing rising floodwater?
              </h2>
              <p className="text-xs text-red-100 max-w-xl">
                Broadcast an instant SOS distress alert. Your location is sent directly to authority rescue teams with no complicated forms required.
              </p>
            </div>

            <Link
              href="/citizen/emergency"
              className="bg-white hover:bg-red-50 text-red-600 font-black px-6 py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider shrink-0"
            >
              <PhoneCall className="w-5 h-5 animate-pulse text-red-600" />
              <span>Open Emergency SOS</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Active Area Alerts Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Active Authority Alerts For Your Area
                </h2>
              </div>
              <Link href="/citizen/alerts" className="text-xs text-sky-600 hover:underline font-bold flex items-center gap-1">
                <span>View All Alerts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {alerts.length > 0 ? (
              <div className="space-y-2.5">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                          alert.severity === 'Emergency' ? 'bg-red-600 text-white' :
                          alert.severity === 'Warning' ? 'bg-amber-500 text-white' : 'bg-sky-600 text-white'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="font-extrabold text-slate-900">{alert.title}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{alert.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Issued: {new Date(alert.created_at).toLocaleString('en-IN')} • Affected: {alert.location_name}
                      </p>
                    </div>
                    <Link
                      href="/citizen/alerts"
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-[11px] self-start md:self-center shrink-0"
                    >
                      Instructions
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No active critical emergency alerts issued for your registered jurisdiction at this moment.</span>
              </div>
            )}
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <Link
              href="/citizen/check-area"
              className="bg-white border border-slate-200 hover:border-emerald-500/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Check My Area
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Look up village or district flood susceptibility ratings and GIS factor breakdown.
                </p>
              </div>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-3">
                Check Risk <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href="/citizen/shelters"
              className="bg-white border border-slate-200 hover:border-emerald-500/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Nearby Shelters
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Find designated high-ground flood relief camps with capacity and shelter status.
                </p>
              </div>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-3">
                Find Shelters <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href="/citizen/guidelines"
              className="bg-white border border-slate-200 hover:border-emerald-500/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Safety Guidelines
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Do's and don'ts before, during, and after flood inundation to protect your family.
                </p>
              </div>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-3">
                Read Protocols <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href="/citizen/profile"
              className="bg-white border border-slate-200 hover:border-emerald-500/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  My Profile
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Update home location, mobile number for SMS broadcast warnings, and family contact details.
                </p>
              </div>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-3">
                Manage Profile <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

          </div>

          {/* National Helpline Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">National Disaster Helpline (Toll-Free 24x7)</span>
                <span className="text-[11px] text-slate-400">Emergency Response Support System (ERSS)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="tel:112" className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow transition-all">
                Call 112
              </a>
              <a href="tel:1078" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow transition-all">
                Call 1078 (NDMA)
              </a>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
