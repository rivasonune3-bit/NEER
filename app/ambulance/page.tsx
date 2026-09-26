'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { 
  workflowService, 
  IncidentData, 
  ResponseTeamData, 
  ResponseAssignmentData 
} from '@/lib/services/workflowService';
import { useRealtimeSync, RealtimeEvent } from '@/lib/services/realtimeSync';
import { 
  HeartPulse, 
  MapPin, 
  Navigation, 
  Clock, 
  Phone, 
  AlertTriangle, 
  Check, 
  Loader2, 
  ShieldCheck, 
  Building2, 
  Radio, 
  RotateCcw, 
  Activity, 
  CheckCircle2, 
  ChevronRight, 
  Stethoscope,
  Siren,
  Hospital,
  AlertCircle
} from 'lucide-react';

interface AmbulanceProfile {
  id: string;
  name: string;
  type: string;
  crew: string;
  phone: string;
  station: string;
  equipment: string;
}

const AVAILABLE_AMBULANCES: AmbulanceProfile[] = [
  {
    id: 'AMB-001',
    name: 'Chamoli ALS Rapid Response Ambulance 1',
    type: 'Advanced Life Support (ALS) 4x4',
    crew: 'Dr. S. Negi (Trauma Specialist), Paramedic V. Joshi',
    phone: '+91 94120 10801',
    station: 'Gopeshwar District Hospital Hub',
    equipment: 'Ventilator, Multi-Para Monitor, Defibrillator, Extrication Board, High-Altitude O2'
  },
  {
    id: 'AMB-002',
    name: 'Joshimath Mountain Terrain Ambulance 2',
    type: 'All-Terrain 4x4 Rescue Ambulance',
    crew: 'Paramedic R. Rawat, EMT P. Bisht',
    phone: '+91 94120 10802',
    station: 'Joshimath Emergency Staging Post',
    equipment: 'Portable Defibrillator, Mountain Stretcher, Splint Kit, Hypothermia Blankets'
  },
  {
    id: 'MED-001',
    name: 'Chamoli District Mobile Medical Unit',
    type: 'Mobile Trauma & Surgical Unit',
    crew: 'Dr. A. Verma (Field Surgeon), Nurse Anita S.',
    phone: '+91 94120 10803',
    station: 'Chamoli Central Outpost',
    equipment: 'Surgical Tray, IV Fluids, Anti-Venom, Hemostatic Gauze, Telemedicine Link'
  }
];

export default function AmbulancePortalPage() {
  const [selectedUnit, setSelectedUnit] = useState<AmbulanceProfile>(AVAILABLE_AMBULANCES[0]);
  const [assignments, setAssignments] = useState<ResponseAssignmentData[]>([]);
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' } | null>(null);
  const [activeAlertAudio, setActiveAlertAudio] = useState(false);

  // Load all missions and assignments
  const loadData = useCallback(async () => {
    try {
      const [allAssignments, allIncidents] = await Promise.all([
        workflowService.getAssignments(),
        workflowService.getIncidents()
      ]);
      setAssignments(allAssignments || []);
      setIncidents(allIncidents || []);
    } catch (e) {
      console.error('Failed to load ambulance assignments:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization
  useRealtimeSync({
    onEvent: (event: RealtimeEvent) => {
      if (event.type === 'ALERT_DISPATCHED' || event.type === 'ASSIGNMENT_DISPATCHED' || event.type === 'ASSIGNMENT_STATUS_UPDATED') {
        loadData();
        if (event.type === 'ALERT_DISPATCHED') {
          setToastMessage({
            text: `EMERGENCY ALERT: New flash flood surge alert issued for ${event.payload?.location_name || 'Chamoli'} sector!`,
            type: 'alert'
          });
          setActiveAlertAudio(true);
          setTimeout(() => setActiveAlertAudio(false), 5000);
        } else if (event.type === 'ASSIGNMENT_DISPATCHED') {
          setToastMessage({
            text: `NEW MISSION DISPATCH: Priority medical assignment received for Unit ${selectedUnit.id}.`,
            type: 'alert'
          });
        }
      }
    }
  });

  // Filter assignments matching current unit or generic sector
  const unitAssignments = assignments.filter(
    (a) => a.team_id === selectedUnit.id || a.team_id?.includes(selectedUnit.id) || a.team_name?.includes('Ambulance')
  );

  // Status transition handler
  const handleStatusTransition = async (
    assignmentId: string,
    newStatus: 'ACCEPTED' | 'DECLINED' | 'EN_ROUTE' | 'ON_SCENE' | 'COMPLETED',
    notes?: string
  ) => {
    setUpdatingId(assignmentId);
    try {
      const res = await workflowService.updateAssignmentStatus(assignmentId, newStatus, notes);
      if (res.success) {
        setToastMessage({
          text: `Unit status updated to [${newStatus}]. Central Command & Hospital Desk notified.`,
          type: 'success'
        });
        await loadData();
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setToastMessage({
          text: res.error || 'Failed to update assignment status.',
          type: 'alert'
        });
      }
    } catch (err: any) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />
      <SystemStatusBanner />

      {/* Real-time Notification Banner */}
      {toastMessage && (
        <div className={`py-3 px-6 text-sm font-semibold flex items-center justify-between transition-all ${
          toastMessage.type === 'alert'
            ? 'bg-rose-900/90 text-rose-100 border-b border-rose-500/50 animate-pulse'
            : 'bg-emerald-950/90 text-emerald-200 border-b border-emerald-500/40'
        }`}>
          <div className="flex items-center gap-3">
            {toastMessage.type === 'alert' ? (
              <Siren className="w-5 h-5 text-rose-300 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-xs uppercase tracking-wider text-slate-400 hover:text-white underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Header & Unit Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
              <HeartPulse className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Emergency Medical Fleet Portal</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  LIVE CAD INTEGRATED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time dispatch, triage status reporting, and hospital casualty coordination
              </p>
            </div>
          </div>

          {/* Unit Selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 font-medium whitespace-nowrap">Active Vehicle:</label>
            <select
              value={selectedUnit.id}
              onChange={(e) => {
                const u = AVAILABLE_AMBULANCES.find(a => a.id === e.target.value);
                if (u) setSelectedUnit(u);
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-rose-500"
            >
              {AVAILABLE_AMBULANCES.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id} — {u.name}
                </option>
              ))}
            </select>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
              title="Refresh Telemetry"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Selected Unit Telemetry Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unit Identifier</span>
            <div className="text-base font-bold text-white mt-1 flex items-center gap-2">
              <span className="text-rose-400 font-mono">{selectedUnit.id}</span>
              <span className="text-xs text-slate-400 font-normal">({selectedUnit.type})</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 truncate flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              {selectedUnit.station}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Crew</span>
            <div className="text-xs font-medium text-slate-200 mt-1 line-clamp-2">
              {selectedUnit.crew}
            </div>
            <div className="text-[11px] text-emerald-400 font-mono mt-2 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              {selectedUnit.phone}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">On-Board Medical Equipment</span>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed line-clamp-2">
              {selectedUnit.equipment}
            </p>
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Certified ALS Mountain Spec
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Operational Status</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-sm font-bold text-emerald-400 uppercase tracking-wide">
                {unitAssignments.some(a => a.status === 'EN_ROUTE') ? 'EN ROUTE' :
                 unitAssignments.some(a => a.status === 'ON_SCENE') ? 'ON SCENE / TRIAGE' :
                 unitAssignments.some(a => a.status === 'PENDING') ? 'DISPATCH PENDING' :
                 unitAssignments.some(a => a.status === 'ACCEPTED') ? 'MOBILIZING' : 'AVAILABLE / STANDBY'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              Connected via VHF & Satellite
            </div>
          </div>
        </div>

        {/* Active Dispatches & Assignments Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Siren className="w-5 h-5 text-rose-500" />
              Assigned Emergency Missions & Dispatches
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {unitAssignments.length} Assigned
              </span>
            </h2>
            <span className="text-xs text-slate-400">
              Authority One-Click Dispatches automatically synchronize to this queue
            </span>
          </div>

          {loading ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500 mb-3" />
              Loading real-time medical dispatches...
            </div>
          ) : unitAssignments.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-xl p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No Active Emergency Dispatches for Unit {selectedUnit.id}</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Unit is currently on STANDBY. When Central Command dispatches a One-Click Emergency Alert for this sector, mission orders will trigger here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {unitAssignments.map((assignment) => {
                const isPending = assignment.status === 'PENDING';
                const isAccepted = assignment.status === 'ACCEPTED';
                const isEnRoute = assignment.status === 'EN_ROUTE';
                const isOnScene = assignment.status === 'ON_SCENE';
                const isCompleted = assignment.status === 'COMPLETED';

                return (
                  <div
                    key={assignment.id}
                    className={`rounded-xl border p-5 transition-all shadow-md ${
                      isPending
                        ? 'bg-rose-950/30 border-rose-500/60 ring-1 ring-rose-500/30 animate-pulse-slow'
                        : isEnRoute
                        ? 'bg-blue-950/30 border-blue-500/50'
                        : isOnScene
                        ? 'bg-amber-950/30 border-amber-500/50'
                        : isCompleted
                        ? 'bg-slate-900/40 border-slate-800 opacity-75'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Left: Mission Info */}
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {assignment.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            isPending ? 'bg-rose-500 text-white font-bold' :
                            isAccepted ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                            isEnRoute ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                            isOnScene ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {assignment.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Priority: Critical Medical Triage
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white">
                          {assignment.incident_title || 'Emergency Surge Evacuation & Triage — Chamoli'}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>Location: {assignment.incident_location || 'Chamoli Central & Tapovan Basin'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>Dispatched: {new Date(assignment.assigned_at).toLocaleTimeString()} ({new Date(assignment.assigned_at).toLocaleDateString()})</span>
                          </div>
                        </div>

                        {assignment.notes && (
                          <div className="text-xs text-slate-400 bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80">
                            <span className="font-semibold text-slate-300">Command Directive: </span>
                            {assignment.notes}
                          </div>
                        )}
                      </div>

                      {/* Right: Closed-Loop Action Stage Buttons */}
                      <div className="flex flex-col gap-2 min-w-[220px]">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Closed-Loop Mission Action
                        </span>

                        {isPending && (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleStatusTransition(assignment.id, 'ACCEPTED', 'Ambulance team acknowledged and mobilizing.')}
                              disabled={updatingId === assignment.id}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-lg transition-all"
                            >
                              {updatingId === assignment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              ACCEPT DISPATCH
                            </button>
                            <button
                              onClick={() => handleStatusTransition(assignment.id, 'DECLINED', 'Unit occupied or road blocked.')}
                              disabled={updatingId === assignment.id}
                              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold transition-all"
                            >
                              DECLINE (Road Unpassable)
                            </button>
                          </div>
                        )}

                        {isAccepted && (
                          <button
                            onClick={() => handleStatusTransition(assignment.id, 'EN_ROUTE', 'Ambulance departed station. Siren active.')}
                            disabled={updatingId === assignment.id}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-lg transition-all"
                          >
                            {updatingId === assignment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Navigation className="w-4 h-4" />
                            )}
                            DEPART: EN ROUTE TO SECTOR
                          </button>
                        )}

                        {isEnRoute && (
                          <button
                            onClick={() => handleStatusTransition(assignment.id, 'ON_SCENE', 'Arrived at flood fringe. Triage post established.')}
                            disabled={updatingId === assignment.id}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 font-bold text-xs text-white shadow-lg transition-all"
                          >
                            {updatingId === assignment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MapPin className="w-4 h-4" />
                            )}
                            ARRIVED: ON SCENE / COMMENCE TRIAGE
                          </button>
                        )}

                        {isOnScene && (
                          <div className="space-y-2">
                            <div className="text-[11px] text-amber-300 font-semibold bg-amber-950/40 p-2 rounded border border-amber-800/60">
                              Unit on scene. Paramedics conducting field stabilization.
                            </div>
                            <button
                              onClick={() => handleStatusTransition(assignment.id, 'COMPLETED', 'Patients stabilized and transferred to Gopeshwar Base Hospital.')}
                              disabled={updatingId === assignment.id}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-lg transition-all"
                            >
                              {updatingId === assignment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              MISSION COMPLETED / RETURN TO BASE
                            </button>
                          </div>
                        )}

                        {isCompleted && (
                          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/40 px-3 py-2 rounded-lg border border-emerald-800/40">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            Mission Successfully Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Emergency Medical Hubs & Designated Evacuation Hospitals */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Hospital className="w-4 h-4 text-cyan-400" />
              Designated Emergency Medical & Trauma Facilities
            </h3>
            <span className="text-[11px] text-slate-400">Chamoli District Health Network</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Gopeshwar District Hospital</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  TRAUMA LEVEL 2
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Emergency Capacity: 45 Surge Beds, 6 ICU, Oxygen Plant Active</p>
              <div className="text-[11px] text-cyan-400 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>Emergency Desk: +91 1372 252222</span>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Joshimath Community Health Centre</span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  FIRST RESPONSE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Emergency Capacity: 20 Triage Beds, Cold Weather Trauma Unit</p>
              <div className="text-[11px] text-cyan-400 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>Emergency Desk: +91 1389 222108</span>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Helang Advanced Medical Camp</span>
                <span className="text-[10px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                  FIELD TRIAGE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Emergency Capacity: 15 Portable Stretchers, Direct Helipad Link</p>
              <div className="text-[11px] text-cyan-400 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>Tactical VHF Channel: CH-08 MEDICAL</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
