'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { useAuth } from '@/lib/auth/AuthContext';
import { workflowService, ResponseTeamData } from '@/lib/services/workflowService';
import { 
  Package, 
  Users, 
  Truck, 
  Radio, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Wrench
} from 'lucide-react';

export default function ResponseTeamResourcesPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user } = useAuth();
  const [team, setTeam] = useState<ResponseTeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form states
  const [teamName, setTeamName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [baseLocation, setBaseLocation] = useState('');
  const [crewSize, setCrewSize] = useState<number>(8);
  const [vehicleType, setVehicleType] = useState('Inflatable Rescue Boat (IRB-400)');
  const [vehicleNumber, setVehicleNumber] = useState('AS-01-NDRF-4421');
  const [equipmentList, setEquipmentList] = useState('Lifejackets (24), 40HP OBM Motor, Medical First-Aid Kits, Water Pumps, Satellite Radios');
  const [readinessStatus, setReadinessStatus] = useState<ResponseTeamData['status']>('Available');

  useEffect(() => {
    async function loadTeam() {
      setLoading(true);
      try {
        const myTeam = await workflowService.getMyResponseTeam();
        if (myTeam) {
          setTeam(myTeam);
          setTeamName(myTeam.name || '');
          setLeaderName(myTeam.leader_name || '');
          setContactPhone(myTeam.contact_phone || '');
          setBaseLocation(myTeam.base_location || '');
          setCrewSize(myTeam.crew_size || 8);
          setVehicleType(myTeam.vehicle_type || 'Inflatable Rescue Boat (IRB-400)');
          setVehicleNumber(myTeam.vehicle_number || 'AS-01-NDRF-4421');
          setEquipmentList(myTeam.equipment || 'Lifejackets, OBM Motor, First Aid');
          setReadinessStatus(myTeam.status || 'Available');
        } else {
          setTeamName(user?.name || '1st NDRF Battalion Alpha Team');
          setLeaderName('Inspector R. Gogoi');
          setContactPhone('+91 98640 99887');
          setBaseLocation('Guwahati Sector Hub, Assam');
        }
      } catch (e) {
        console.error('Failed to load team data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessToast(null);

    const teamId = team?.id || 'TEAM-NDRF-01';
    const success = await workflowService.updateResponseTeam(teamId, {
      name: teamName,
      leader_name: leaderName,
      contact_phone: contactPhone,
      base_location: baseLocation,
      crew_size: crewSize,
      vehicle_type: vehicleType,
      vehicle_number: vehicleNumber,
      equipment: equipmentList,
      status: readinessStatus
    });

    setSaving(false);
    if (success) {
      setSuccessToast('Team roster, vehicle assets, and equipment status updated in central database.');
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="response" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="response" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-4 md:p-6 max-w-[1000px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-amber-600" />
                Team Roster, Vehicle & Resource Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Maintain crew personnel count, rescue vehicles, gear inventory, and operational readiness.
              </p>
            </div>
            <DataBadge label="FLEET ASSETS" variant="live" />
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
              <p className="text-xs font-medium">Fetching team resource profile from database...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Card 1: Team & Crew Roster */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Users className="w-5 h-5 text-amber-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Unit Information & Crew Roster
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Response Unit Name *</label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Team Commander / Leader *</label>
                    <input
                      type="text"
                      required
                      value={leaderName}
                      onChange={(e) => setLeaderName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Radio / Mobile *</label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Base Sector Station *</label>
                    <input
                      type="text"
                      required
                      value={baseLocation}
                      onChange={(e) => setBaseLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Crew Size (Active Rescuers)</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={crewSize}
                      onChange={(e) => setCrewSize(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Readiness State</label>
                    <select
                      value={readinessStatus}
                      onChange={(e) => setReadinessStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
                    >
                      <option value="Available">Available (Ready to Deploy)</option>
                      <option value="Assigned">Assigned (Mission In Progress)</option>
                      <option value="Busy">Busy (Refueling / Resting)</option>
                      <option value="Offline">Offline (Shift Ended)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: Vehicles & Boats */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Truck className="w-5 h-5 text-amber-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Assigned Vehicle / Boat Asset
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vehicle / Craft Classification</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                    >
                      <option value="Inflatable Rescue Boat (IRB-400)">Inflatable Rescue Boat (IRB-400)</option>
                      <option value="Rigid Inflatable Boat (RIB-600)">Rigid Inflatable Boat (RIB-600)</option>
                      <option value="4x4 All-Terrain Emergency Rescue Truck">4x4 All-Terrain Rescue Truck</option>
                      <option value="Amphibious Evacuation Carrier">Amphibious Evacuation Carrier</option>
                      <option value="Mobile Medical Van">Mobile Medical Van</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Asset Registration Number</label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Gear & Equipment Checklist */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Wrench className="w-5 h-5 text-amber-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Rescue Equipment & Safety Gear Manifest
                  </h2>
                </div>

                <div className="text-xs">
                  <label className="block font-bold text-slate-700 mb-1">Equipped Gear & Supplies</label>
                  <textarea
                    rows={3}
                    value={equipmentList}
                    onChange={(e) => setEquipmentList(e.target.value)}
                    placeholder="List all available lifebuoys, ropes, satellite transmitters, oxygen cylinders..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synchronizing Fleet Profile with Authority Command...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Update Team Manifest</span>
                  </>
                )}
              </button>

            </form>
          )}

        </main>
      </div>
    </div>
  );
}
