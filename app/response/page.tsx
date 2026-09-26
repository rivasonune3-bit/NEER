'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { useAuth } from '@/lib/auth/AuthContext';
import { workflowService, ResponseTeamData, IncidentData, AlertData } from '@/lib/services/workflowService';
import { 
  Radio, 
  LifeBuoy, 
  MapPin, 
  Compass, 
  Package, 
  Camera, 
  User, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  CheckCircle,
  Truck,
  Users,
  Loader2,
  ChevronRight
} from 'lucide-react';

export default function ResponseOverviewPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user } = useAuth();
  const [team, setTeam] = useState<ResponseTeamData | null>(null);
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [myTeam, allIncidents, allAlerts] = await Promise.all([
          workflowService.getMyResponseTeam(),
          workflowService.getIncidents(),
          workflowService.getAlerts()
        ]);

        if (myTeam) {
          setTeam(myTeam);
        } else {
          // Default fallback team info if logged in as general response
          setTeam({
            id: 'TEAM-NDRF-01',
            name: user?.name || '1st NDRF Battalion Alpha Team',
            leader_name: 'Inspector R. Gogoi',
            contact_phone: '+91 98640 99887',
            base_location: 'Guwahati Water Base, Assam',
            status: 'Available',
            vehicle_type: 'Inflatable Rescue Boat (IRB-400)',
            vehicle_number: 'AS-01-NDRF-4421',
            crew_size: 8,
            equipment: 'Lifejackets, OBM 40HP, First-Aid Kits, Satellite Radios'
          });
        }

        setIncidents(allIncidents || []);
        setAlerts((allAlerts || []).filter(a => a.status === 'Active').slice(0, 2));
      } catch (e) {
        console.error('Failed to load response fleet data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleStatusChange = async (newStatus: ResponseTeamData['status']) => {
    if (!team) return;
    setUpdatingStatus(true);
    await workflowService.updateResponseTeam(team.id, { status: newStatus });
    setTeam(prev => prev ? { ...prev, status: newStatus } : null);
    setUpdatingStatus(false);
  };

  const activeAssignments = incidents.filter(i => 
    i.status === 'Assigned' || i.status === 'In Progress'
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="response" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="response" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-4 md:p-6 max-w-[1300px] mx-auto space-y-6">
          
          {/* Fleet Header & Operational Status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Tactical Response Operations
                </span>
                <DataBadge label="FLEET CONNECTED" variant="live" />
              </div>
              <h1 className="text-2xl font-black text-slate-900">
                {team?.name || 'NDRF Response Unit'}
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Base Station:</span>
                <strong className="text-slate-800">{team?.base_location || 'Guwahati Sector'}</strong>
                <span className="mx-1">•</span>
                <span>Unit Lead:</span>
                <strong className="text-slate-800">{team?.leader_name || user?.name || 'Commander'}</strong>
              </p>
            </div>

            {/* Operational Readiness Status Controller */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 uppercase px-2">Operational State:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 w-full sm:w-auto">
                {(['Available', 'Assigned', 'Busy', 'Offline'] as const).map((st) => (
                  <button
                    key={st}
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      team?.status === st
                        ? st === 'Available'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : st === 'Assigned'
                          ? 'bg-sky-600 text-white shadow-sm'
                          : st === 'Busy'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-700 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Key Operational Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Missions</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                {activeAssignments.length} Active
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Assigned to unit</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Crew Deployment</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {team?.crew_size || 8} Personnel
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Water rescue certified</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle Asset</span>
              <span className="text-sm font-black text-slate-900 mt-1 truncate block">
                {team?.vehicle_type || 'Inflatable Boat'}
              </span>
              <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                {team?.vehicle_number || 'NDRF-BOAT-01'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Readiness Score</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                100% Operational
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Equipment fully inspected</span>
            </div>
          </div>

          {/* Active Assigned Incidents Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-red-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Active Mission Assignments
                </h2>
              </div>
              <Link href="/response/incidents" className="text-xs text-amber-700 hover:underline font-bold flex items-center gap-1">
                <span>View All Missions</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-600" />
                <p className="text-xs">Fetching assigned incidents from database...</p>
              </div>
            ) : activeAssignments.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-1">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">No Pending Emergency Dispatches</p>
                <p className="text-[11px] text-slate-500">Your unit is currently on standby in available readiness mode.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAssignments.slice(0, 3).map((inc) => (
                  <div key={inc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded font-black text-[10px] bg-red-600 text-white uppercase">
                          {inc.priority}
                        </span>
                        <span className="font-extrabold text-slate-900 text-sm">{inc.title}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{inc.description}</p>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" /> {inc.location_name}
                        </span>
                        <span>•</span>
                        <span>Caller: {inc.reported_by} ({inc.reported_phone})</span>
                      </p>
                    </div>

                    <Link
                      href="/response/incidents"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs self-start md:self-center shrink-0 shadow-sm flex items-center gap-1"
                    >
                      <span>Update Mission</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <Link
              href="/response/incidents"
              className="bg-white border border-slate-200 hover:border-amber-500/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-all">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  Assigned Incidents
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Track rescue status progression: Assigned → En Route → On Site → Completed.
                </p>
              </div>
              <span className="text-xs text-amber-700 font-bold flex items-center gap-1 mt-3">
                Mission Desk <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href="/response/map"
              className="bg-white border border-slate-200 hover:border-amber-500/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-all">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  Operations Map
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Interactive tactical map showing team coordinates and active incident markers.
                </p>
              </div>
              <span className="text-xs text-amber-700 font-bold flex items-center gap-1 mt-3">
                View Tactical Map <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href="/response/team"
              className="bg-white border border-slate-200 hover:border-amber-500/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-all">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  Team & Resources
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Manage crew personnel roster, boat/vehicle equipment, and readiness state.
                </p>
              </div>
              <span className="text-xs text-amber-700 font-bold flex items-center gap-1 mt-3">
                Manage Fleet <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href="/response/reports"
              className="bg-white border border-slate-200 hover:border-amber-500/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-all">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  Field Reports & Evidence
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Submit field observations, water depth readings, and photographic proof to Authority.
                </p>
              </div>
              <span className="text-xs text-amber-700 font-bold flex items-center gap-1 mt-3">
                Submit Evidence <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

          </div>

        </main>
      </div>
    </div>
  );
}
