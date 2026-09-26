'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { useAuth } from '@/lib/auth/AuthContext';
import { workflowService, CitizenData } from '@/lib/services/workflowService';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Bell, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { INDIA_STATES, INDIA_DISTRICTS } from '@/lib/data/indiaLocations';

export default function CitizenProfilePage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('Assam');
  const [district, setDistrict] = useState('Kamrup Metropolitan');
  const [address, setAddress] = useState('Guwahati East');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [smsAlerts, setSmsAlerts] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const prof = await workflowService.getMyCitizenProfile();
        if (prof) {
          setName(prof.name || user?.name || '');
          setPhone(prof.phone || '');
          setEmail(prof.email || user?.email || '');
          setState(prof.state || 'Assam');
          setDistrict(prof.district || 'Kamrup Metropolitan');
          setAddress(prof.address || 'Guwahati East');
          setEmergencyContact(prof.emergency_contacts || '');
          setSmsAlerts(prof.alert_sms_enabled !== 0);
        } else if (user) {
          setName(user.name || '');
          setEmail(user.email || '');
        }
      } catch (e) {
        console.error('Failed to load citizen profile:', e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await workflowService.updateMyCitizenProfile({
      name,
      phone,
      state,
      district,
      address,
      emergency_contacts: emergencyContact,
      alert_sms_enabled: smsAlerts ? 1 : 0
    });

    setSaving(false);
    if (res.success) {
      setSuccessMsg('Resident profile and registered home location saved to central database.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message || 'Failed to update profile.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="citizen" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="citizen" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-4 md:p-6 max-w-[800px] mx-auto space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                <User className="w-6 h-6 text-emerald-600" />
                Resident Profile & Emergency Settings
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your essential details, home jurisdiction, and automated alert preferences.
              </p>
            </div>
            <DataBadge label="CENTRAL DB CONNECTED" variant="live" />
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
              <p className="text-xs font-medium">Loading citizen profile...</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center gap-2 text-xs text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-3.5 flex items-center gap-2 text-xs text-red-900 font-bold">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kalita"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mobile Number (Emergency Contact) *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98640 12345"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Account Email</label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-500 font-mono cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Managed by authentication security credentials</span>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Registered Home / Village Location
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    This location is automatically attached when you trigger 1-Click SOS distress signals if GPS is unavailable.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="e.g. Assam"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">District</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="e.g. Kamrup Metropolitan"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Residential Address / Landmark</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. House 42, Near Guwahati High School, Pandu"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    Next of Kin / Family Emergency Contact
                  </h3>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Relative Name & Contact Number</label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="e.g. Sunita Kalita (Spouse) - +91 98640 54321"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={(e) => setSmsAlerts(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">
                        Subscribe to Localized SMS & WhatsApp Early Warnings
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Receive official NDMA flood crest and evacuation alerts on your mobile phone.
                      </span>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Profile to Database...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save & Update Profile</span>
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
