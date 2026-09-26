'use client';

import React, { useState, useEffect } from 'react';
import { 
  workflowService, 
  TargetingData, 
  ResponseTeamData, 
  IncidentData, 
  ResponseAssignmentData,
  CitizenData 
} from '@/lib/services/workflowService';
import { LocationItem } from '@/lib/types';
import { TargetedAlertModal } from './TargetedAlertModal';
import { CitizensListModal } from './CitizensListModal';
import { 
  ChevronRight, 
  ChevronLeft, 
  Radio, 
  Users, 
  Truck, 
  LifeBuoy, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Clock, 
  ShieldCheck, 
  Send, 
  Loader2, 
  RefreshCw, 
  Navigation, 
  ExternalLink,
  Flame,
  ArrowRight,
  Maximize2,
  HeartPulse,
  Siren,
  Stethoscope
} from 'lucide-react';
import { useRealtimeSync } from '@/lib/services/realtimeSync';

interface CommandOperationsDrawerProps {
  selectedLocation: LocationItem;
  currentRiskScore: number;
  alertStatus: string;
  rainfallRate: number;
}

export function CommandOperationsDrawer({
  selectedLocation,
  currentRiskScore,
  alertStatus,
  rainfallRate
}: CommandOperationsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'TEAMS' | 'CITIZENS' | 'DISPATCHES'>('TEAMS');
  
  // Data states
  const [targetingData, setTargetingData] = useState<TargetingData>({
    target_location: selectedLocation.name,
    primary_count: 0,
    primary_citizens: [],
    nearby_count: 0,
    nearby_citizens: [],
    total_recipients: 0,
    teams_count: 0,
    response_teams: [],
    active_sos_count: 0,
    active_incidents: []
  });
  
  const [assignments, setAssignments] = useState<ResponseAssignmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isCitizensModalOpen, setIsCitizensModalOpen] = useState(false);

  // Quick dispatch dialog state
  const [dispatchingTeam, setDispatchingTeam] = useState<ResponseTeamData | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  // Load real targeting & assignments data
  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const [targeting, asgns] = await Promise.all([
          workflowService.getTargetingData(selectedLocation.name),
          workflowService.getAssignments()
        ]);
        if (isMounted) {
          setTargetingData(targeting);
          setAssignments(asgns || []);
        }
      } catch (err) {
        console.error('Failed to load operations drawer data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
  fetchData();
    return () => { isMounted = false; };
  }, [selectedLocation.name, refreshKey]);

  // Real-time synchronization across Authority, Citizen, Fleet, and Ambulance portals
  useRealtimeSync({
    onEvent: () => {
      setRefreshKey(k => k + 1);
    }
  });

  // Classify units into Rescue Teams and Emergency Ambulances
  const ambulanceUnits = targetingData.response_teams.filter(t => 
    (t.team_type || t.type || '').toLowerCase().includes('ambulance') || 
    (t.team_type || t.type || '').toLowerCase().includes('medical')
  );

  const rescueUnits = targetingData.response_teams.filter(t => 
    !(t.team_type || t.type || '').toLowerCase().includes('ambulance') && 
    !(t.team_type || t.type || '').toLowerCase().includes('medical')
  );

  const getStatusCounts = (units: ResponseTeamData[]) => {
    let available = 0, assigned = 0, en_route = 0, on_scene = 0;
    units.forEach(u => {
      const s = (u.progress_status || u.status || 'Available').toUpperCase();
      if (s.includes('EN_ROUTE') || s.includes('EN ROUTE')) en_route++;
      else if (s.includes('ON_SCENE') || s.includes('ON SCENE') || s.includes('ARRIVED') || s.includes('RESCUE') || s.includes('ON SITE')) on_scene++;
      else if (s.includes('ASSIGNED') || s.includes('ACCEPTED') || s.includes('PENDING') || s.includes('BUSY')) assigned++;
      else available++;
    });
    return { available, assigned, en_route, on_scene, total: units.length };
  };

  const rescueCounts = getStatusCounts(rescueUnits);
  const ambulanceCounts = getStatusCounts(ambulanceUnits);

  // Handle Quick Dispatch
  const handleExecuteDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchingTeam || !selectedIncidentId) return;

    setIsDispatching(true);
    try {
      const res = await workflowService.createAssignment({
        incident_id: selectedIncidentId,
        team_id: dispatchingTeam.id,
        assigned_by: 'Authority Command Dispatcher',
        notes: dispatchNotes || `Dispatched ${dispatchingTeam.name} to sector.`
      });

      if (res.success) {
        setDispatchingTeam(null);
        setSelectedIncidentId('');
        setDispatchNotes('');
        setRefreshKey(k => k + 1);
      }
    } catch (err) {
      console.error('Dispatch error:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  // Helper for team status badge
  const renderTeamStatusBadge = (status: string, progress?: string | null) => {
    const s = (progress || status || 'Available').toUpperCase();
    if (s.includes('EN_ROUTE') || s.includes('EN ROUTE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          EN ROUTE 🔵
        </span>
      );
    }
    if (s.includes('ON_SCENE') || s.includes('ARRIVED') || s.includes('ON SCENE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
          ON SCENE 🟣
        </span>
      );
    }
    if (s.includes('ASSIGNED') || s.includes('ACCEPTED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          ASSIGNED 🟡
        </span>
      );
    }
    if (s.includes('OFFLINE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          OFFLINE ⚪
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
        AVAILABLE 🟢
      </span>
    );
  };

  return (
    <>
      {/* Floating Edge Toggle Handle (Always Visible on the Right) */}
      {!isOpen && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-[#0B192C] hover:bg-slate-800 text-white px-3.5 py-4 rounded-l-2xl shadow-2xl border-l-2 border-t-2 border-b-2 border-amber-500/80 transition-all group"
            title="Open Tactical Operations & Dispatch Command"
          >
            <ChevronLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-black flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                TACTICAL OPS
              </span>
              <span className="text-xs font-extrabold text-white">
                Teams & Citizens
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-300">
                <span className="bg-emerald-900/80 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                  {targetingData.teams_count} Teams
                </span>
                {targetingData.active_sos_count > 0 && (
                  <span className="bg-red-900/80 text-red-300 px-1.5 py-0.2 rounded font-mono font-bold">
                    {targetingData.active_sos_count} SOS
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Slide-out Operations Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="bg-[#0B192C] text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-2">
                <span>Tactical Command Drawer</span>
              </h2>
              <p className="text-[11px] text-slate-300">
                Coordinating for: <strong className="text-amber-400">{selectedLocation.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setRefreshKey(k => k + 1)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Refresh real-time data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Collapse drawer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Priority Action: Send Targeted Alert */}
        <div className="p-3 bg-gradient-to-r from-amber-500/10 via-red-500/10 to-transparent border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              <span>Emergency Broadcast Ready</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Target {targetingData.primary_count} registered citizens & {targetingData.teams_count} units
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAlertModalOpen(true)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Alert</span>
          </button>
        </div>

        {/* Live Operational Status Breakdown: Rescue Units vs Ambulances */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
              <span className="flex items-center gap-1 text-blue-700">
                <Truck className="w-3.5 h-3.5" /> Rescue Units
              </span>
              <span className="font-mono text-xs">{rescueCounts.total}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center font-mono">
              <div className="bg-emerald-50 text-emerald-700 rounded p-1">
                <div className="font-black text-xs">{rescueCounts.available}</div>
                <div className="text-[7.5px] uppercase font-bold">Avail</div>
              </div>
              <div className="bg-amber-50 text-amber-700 rounded p-1">
                <div className="font-black text-xs">{rescueCounts.assigned}</div>
                <div className="text-[7.5px] uppercase font-bold">Asgn</div>
              </div>
              <div className="bg-blue-50 text-blue-700 rounded p-1">
                <div className="font-black text-xs">{rescueCounts.en_route}</div>
                <div className="text-[7.5px] uppercase font-bold">EnRt</div>
              </div>
              <div className="bg-purple-50 text-purple-700 rounded p-1">
                <div className="font-black text-xs">{rescueCounts.on_scene}</div>
                <div className="text-[7.5px] uppercase font-bold">Scene</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
              <span className="flex items-center gap-1 text-rose-600">
                <HeartPulse className="w-3.5 h-3.5" /> Ambulances
              </span>
              <span className="font-mono text-xs">{ambulanceCounts.total}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center font-mono">
              <div className="bg-emerald-50 text-emerald-700 rounded p-1">
                <div className="font-black text-xs">{ambulanceCounts.available}</div>
                <div className="text-[7.5px] uppercase font-bold">Avail</div>
              </div>
              <div className="bg-amber-50 text-amber-700 rounded p-1">
                <div className="font-black text-xs">{ambulanceCounts.assigned}</div>
                <div className="text-[7.5px] uppercase font-bold">Asgn</div>
              </div>
              <div className="bg-blue-50 text-blue-700 rounded p-1">
                <div className="font-black text-xs">{ambulanceCounts.en_route}</div>
                <div className="text-[7.5px] uppercase font-bold">EnRt</div>
              </div>
              <div className="bg-purple-50 text-purple-700 rounded p-1">
                <div className="font-black text-xs">{ambulanceCounts.on_scene}</div>
                <div className="text-[7.5px] uppercase font-bold">Scene</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('TEAMS')}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'TEAMS'
                ? 'border-blue-600 text-blue-700 bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Units ({targetingData.teams_count})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CITIZENS')}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'CITIZENS'
                ? 'border-blue-600 text-blue-700 bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Citizens ({targetingData.primary_count + (targetingData.nearby_count || 0)})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DISPATCHES')}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'DISPATCHES'
                ? 'border-blue-600 text-blue-700 bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Missions ({assignments.length})</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* TAB 1: RESPONSE TEAMS & AMBULANCES */}
          {activeTab === 'TEAMS' && (
            <div className="space-y-4">
              {/* 1. Dedicated Ambulances Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-700 font-bold px-1">
                  <span className="flex items-center gap-1.5 text-rose-600">
                    <HeartPulse className="w-3.5 h-3.5" />
                    <span>EMERGENCY AMBULANCES & MEDICAL FLEET</span>
                  </span>
                  <span className="font-mono text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                    {ambulanceUnits.length} Units
                  </span>
                </div>

                {ambulanceUnits.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    No ambulance units stationed in this sector.
                  </div>
                ) : (
                  ambulanceUnits.map((unit) => (
                    <div 
                      key={unit.id}
                      className="p-3 bg-rose-50/40 hover:bg-rose-50/70 border border-rose-200/80 rounded-xl space-y-2 transition-all shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                            <span className="text-rose-600 font-mono">{unit.id}</span>
                            <span>— {unit.name}</span>
                          </div>
                          <div className="text-[10px] font-bold text-rose-700 mt-0.5">
                            {unit.team_type || unit.type || 'ALS Mountain Ambulance'}
                          </div>
                        </div>

                        <div>
                          {renderTeamStatusBadge(unit.status, unit.progress_status)}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-1 bg-white p-2 rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Base / Hub:</span>
                          <span className="font-bold text-slate-800">{unit.base_location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Vehicle / Crew:</span>
                          <span className="font-medium text-slate-700">{unit.vehicle_type || '4x4 High-Clearance'} ({unit.crew_size || 2} crew)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Contact / VHF:</span>
                          <span className="font-mono text-slate-700">{unit.contact_phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400 font-medium">Equipped for trauma & cold water shock</span>
                        <button
                          type="button"
                          onClick={() => {
                            setDispatchingTeam(unit);
                            setSelectedIncidentId(targetingData.active_incidents[0]?.id || '');
                          }}
                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <HeartPulse className="w-3 h-3 text-white" />
                          <span>Dispatch Medical</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 2. Rescue Teams Section */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-[11px] text-slate-700 font-bold px-1">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <Truck className="w-3.5 h-3.5" />
                    <span>SDRF / NDRF RESCUE UNITS</span>
                  </span>
                  <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    {rescueUnits.length} Units
                  </span>
                </div>

                {rescueUnits.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    No rescue teams stationed in this sector.
                  </div>
                ) : (
                  rescueUnits.map((unit) => (
                    <div 
                      key={unit.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl space-y-2 transition-all shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                            <span className="font-mono text-slate-500">{unit.id}</span>
                            <span>— {unit.name}</span>
                          </div>
                          <div className="text-[10px] font-bold text-blue-700 mt-0.5">
                            {unit.team_type || unit.type || 'Rescue Unit'}
                          </div>
                        </div>

                        <div>
                          {renderTeamStatusBadge(unit.status, unit.progress_status)}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-1 bg-white p-2 rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Base Location:</span>
                          <span className="font-bold text-slate-800">{unit.base_location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Vehicle / Crew:</span>
                          <span className="font-medium text-slate-700">{unit.vehicle_type || 'Rescue 4x4'} ({unit.crew_size || 4} crew)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Leader / Phone:</span>
                          <span className="font-mono text-slate-700">{unit.leader_name} • {unit.contact_phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400 font-medium">Inflatable boats & ropes on board</span>
                        <button
                          type="button"
                          onClick={() => {
                            setDispatchingTeam(unit);
                            setSelectedIncidentId(targetingData.active_incidents[0]?.id || '');
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Navigation className="w-3 h-3 text-amber-400" />
                          <span>Dispatch Rescue</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CITIZENS & AFFECTED POPULATION */}
          {activeTab === 'CITIZENS' && (
            <div className="space-y-4">
              {/* Summary Cards Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">Registered Population</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                    {targetingData.primary_count}
                  </span>
                  <span className="text-[10px] text-slate-500">{selectedLocation.name}</span>
                </div>

                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">In Flood Risk Zone</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                    {currentRiskScore >= 70 ? targetingData.primary_count : Math.ceil(targetingData.primary_count * 0.6)}
                  </span>
                  <span className="text-[10px] text-slate-500">{alertStatus} Zone</span>
                </div>

                <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-red-700 block">Active SOS Signals</span>
                  <span className="text-xl font-black text-red-600 font-mono mt-0.5 block">
                    {targetingData.active_sos_count}
                  </span>
                  <span className="text-[10px] text-slate-500">Immediate distress</span>
                </div>

                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Alerts Dispatched</span>
                  <span className="text-xl font-black text-emerald-700 font-mono mt-0.5 block">
                    {assignments.length > 0 ? assignments.length : 1}
                  </span>
                  <span className="text-[10px] text-slate-500">Live notifications</span>
                </div>
              </div>

              {/* View Full Table CTA */}
              <button
                type="button"
                onClick={() => setIsCitizensModalOpen(true)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Users className="w-4 h-4 text-blue-400" />
                <span>View All {targetingData.primary_count} Registered Citizens</span>
                <Maximize2 className="w-3.5 h-3.5 ml-auto text-slate-400" />
              </button>

              {/* Citizen List Preview */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                  Households in Critical Drainage Terraces:
                </span>

                {targetingData.primary_citizens.slice(0, 4).map((c) => (
                  <div key={c.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{c.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{c.village || c.block}</span>
                        <span>•</span>
                        <span>{c.family_count || 1} family</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-600 block">{c.phone}</span>
                      {c.medical_needs && c.medical_needs !== 'None' && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                          Medical Priority
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Away Resident Excluded From Evacuation Orders */}
                <div className="p-2.5 bg-slate-100/90 border border-slate-200 rounded-xl space-y-1 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">Rameshwar Prasad</span>
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">
                      HOMETOWN RESIDENT (AWAY)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Hometown: Chamoli • Current: Nagpur, MH</span>
                    <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Excluded from physical evacuation
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE DISPATCHES & SOS QUEUE */}
          {activeTab === 'DISPATCHES' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
                <span>ACTIVE OPERATIONAL DISPATCHES</span>
                <span className="font-mono">{assignments.length} Total</span>
              </div>

              {assignments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                  <p className="font-bold text-slate-700 text-xs">No Active Dispatches in Queue</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Use the &quot;Teams&quot; tab to dispatch available units to reported incidents.
                  </p>
                </div>
              ) : (
                assignments.map((asgn) => {
                  const status = asgn.status.toUpperCase();
                  return (
                    <div 
                      key={asgn.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[10px] text-slate-400 block">MISSION #{asgn.id}</span>
                          <h4 className="font-extrabold text-slate-900 text-xs mt-0.5">
                            {asgn.incident_title || 'Emergency Distress Response'}
                          </h4>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-red-500" />
                            <span>{asgn.incident_location || selectedLocation.name}</span>
                          </span>
                        </div>

                        <div>
                          {status === 'EN_ROUTE' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                              EN ROUTE 🚙
                            </span>
                          ) : status === 'ON_SCENE' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300">
                              ON SCENE 📍
                            </span>
                          ) : status === 'ACCEPTED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                              ACCEPTED 🟡
                            </span>
                          ) : status === 'COMPLETED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              COMPLETED ✅
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-800">
                              PENDING ⏳
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Team Assignment Bar */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-slate-500">Responding Fleet:</span>
                          <span className="text-blue-700">{asgn.team_name || asgn.team_id}</span>
                        </div>
                        {asgn.notes && (
                          <div className="text-[10px] text-slate-600 italic">
                            &quot;{asgn.notes}&quot;
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                          <span>Dispatched: {new Date(asgn.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Authority Direct Stage Actions */}
                      {status !== 'COMPLETED' && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          {status === 'ON_SCENE' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await workflowService.updateAssignmentStatus(asgn.id, 'COMPLETED', 'Mission verified complete by Authority Command');
                                setRefreshKey(k => k + 1);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-colors"
                            >
                              ✓ Verify Complete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </div>

      {/* Quick Dispatch Dialog */}
      {dispatchingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Dispatch Unit: {dispatchingTeam.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDispatchingTeam(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteDispatch} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-800 block text-[11px] uppercase mb-1">
                  Assign to Emergency Incident / SOS Signal:
                </label>
                {targetingData.active_incidents.length === 0 ? (
                  <div className="p-3 bg-slate-100 rounded-xl text-slate-500 text-xs">
                    No active SOS distress reports in {selectedLocation.name}. Unit can be placed on tactical sector patrol.
                  </div>
                ) : (
                  <select
                    value={selectedIncidentId}
                    onChange={(e) => setSelectedIncidentId(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Incident to Respond --</option>
                    {targetingData.active_incidents.map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        [{inc.priority}] {inc.title} ({inc.location_name})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-800 block text-[11px] uppercase mb-1">
                  Tactical Dispatch Instructions:
                </label>
                <textarea
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Deploy inflatable rescue boat to lower riverbank terraces immediately."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDispatchingTeam(null)}
                  className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDispatching || !selectedIncidentId}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isDispatching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  <span>Confirm Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Targeted Alert Modal */}
      <TargetedAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        selectedLocation={selectedLocation}
        currentRiskScore={currentRiskScore}
        alertStatus={alertStatus}
        rainfallRate={rainfallRate}
        targetingData={targetingData}
        onAlertBroadcasted={() => {
          setRefreshKey(k => k + 1);
        }}
      />

      {/* Citizens Table Modal */}
      <CitizensListModal
        isOpen={isCitizensModalOpen}
        onClose={() => setIsCitizensModalOpen(false)}
        locationName={selectedLocation.name}
        citizens={[
          ...targetingData.primary_citizens,
          ...(targetingData.nearby_citizens || [])
        ]}
        activeIncidents={targetingData.active_incidents}
        riskLevel={alertStatus}
      />
    </>
  );
}
