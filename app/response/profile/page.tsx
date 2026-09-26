'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { useAuth } from '@/lib/auth/AuthContext';
import { workflowService, ResponseTeamData } from '@/lib/services/workflowService';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Radio, 
  Save, 
  CheckCircle2, 
  Loader2,
  Shield 
} from 'lucide-react';

export default function ResponseProfilePage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user } = useAuth();
  const [team, setTeam] = useState<ResponseTeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [leaderName, setLeaderName] = useState('');
  const [phone, setPhone] = useState('');
  const [baseLocation, setBaseLocation] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const myTeam = await workflowService.getMyResponseTeam();
        if (myTeam) {
          setTeam(myTeam);
          setLeaderName(myTeam.leader_name || '');
          setPhone(myTeam.contact_phone || '');
          setBaseLocation(myTeam.base_location || '');
        } else {
          setLeaderName(user?.name || 'Inspector R. Gogoi');
          setPhone('+91 98640 99887');
          setBaseLocation('Guwahati Water Base, Assam');
        }
      } catch (e) {
        console.error('Failed to load response profile:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessToast(null);

    const teamId = team?.id || 'TEAM-NDRF-01';
    await workflowService.updateResponseTeam(teamId, {
      leader_name: leaderName,
      contact_phone: phone,
      base_location: baseLocation
    });

    setSaving(false);
    setSuccessToast('Response unit credentials and dispatch contact updated in database.');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="response" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="response" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-4 md:p-6 max-w-[800px] mx-auto space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                <User className="w-6 h-6 text-amber-600" />
                Response Unit Tactical Profile
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Official command registry, tactical radio contacts, and operational sector base.
              </p>
            </div>
            <DataBadge label="NDMA COMMAND LINK" variant="live" />
          </div>

          {successToast && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center gap-2 text-xs text-emerald-900 font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600" />
              <p className="text-xs">Loading unit profile...</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <form onSubmit={handleSave} className="space-y-4 text-xs">
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Unit Identification</span>
                  <span className="text-base font-black text-slate-900 block">{team?.name || user?.name || '1st NDRF Battalion Alpha Team'}</span>
                  <span className="text-xs font-mono text-slate-500 block">Unit ID: #{team?.id || 'TEAM-NDRF-01'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Unit Leader / Officer-in-Charge *</label>
                    <input
                      type="text"
                      required
                      value={leaderName}
                      onChange={(e) => setLeaderName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Emergency Dispatch Contact / Mobile *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Sector Station Location *</label>
                  <input
                    type="text"
                    required
                    value={baseLocation}
                    onChange={(e) => setBaseLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Account Email</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || 'response@ndrf.gov.in'}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Profile to Database...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Response Profile</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
