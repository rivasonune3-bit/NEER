'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  workflowService, 
  IncidentData, 
  ResponseTeamData, 
  ResponseAssignmentData 
} from '@/lib/services/workflowService';
import { 
  LifeBuoy, 
  MapPin, 
  CheckCircle2, 
  Navigation, 
  Clock, 
  Phone, 
  AlertTriangle, 
  Check, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Building,
  Radio,
  Truck,
  RotateCcw,
  XCircle
} from 'lucide-react';

const PROGRESS_STAGES = [
  'Assigned',
  'Accepted',
  'En Route',
  'Arrived',
  'Rescue/Response',
  'Completed'
] as const;

export default function ResponseIncidentsPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [assignments, setAssignments] = useState<ResponseAssignmentData[]>([]);
  const [team, setTeam] = useState<ResponseTeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [myTeam, allIncidents, allAssignments] = await Promise.all([
        workflowService.getMyResponseTeam(),
        workflowService.getIncidents(),
        workflowService.getAssignments()
      ]);
      if (myTeam) setTeam(myTeam);
      setIncidents(allIncidents || []);
      setAssignments(allAssignments || []);
    } catch (e) {
      console.error('Failed to load response data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Closed-loop assignment status transition handler
  const handleAssignmentStatusChange = async (
    asgnId: string, 
    newStatus: 'ACCEPTED' | 'DECLINED' | 'EN_ROUTE' | 'ON_SCENE' | 'COMPLETED',
    note?: string
  ) => {
    setUpdatingId(asgnId);
    try {
      const res = await workflowService.updateAssignmentStatus(asgnId, newStatus, note);
      if (res.success) {
        setSuccessToast(`Mission status updated to "${newStatus}". Central Command synchronized.`);
        await loadData();
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch (e) {
      console.error('Failed to update assignment status:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProgressStage = async (incident: IncidentData, stage: typeof PROGRESS_STAGES[number]) => {
    setUpdatingId(incident.id);
    const teamId = team?.id || incident.assigned_team_id || 'TEAM-NDRF-01';

    try {
      await workflowService.updateAssignmentProgress(teamId, stage);

      if (stage === 'Completed') {
        await workflowService.closeIncident(incident.id);
      }

      setIncidents(prev => prev.map(inc => {
        if (inc.id === incident.id) {
          return {
            ...inc,
            status: stage === 'Completed' ? 'Resolved' : 'In Progress'
          };
        }
        return inc;
      }));

      setSuccessToast(`Mission status updated to "${stage}". Authority Command synchronized.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (e) {
      console.error('Failed to update stage:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="response" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="response" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                <LifeBuoy className="w-6 h-6 text-amber-600" />
                Response Fleet Operational Dispatch
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Closed-loop coordination with Authority Command. Accept, advance, and resolve field missions in real time.
              </p>
            </div>
            <DataBadge label="CENTRAL DB LIVE" variant="live" />
          </div>

          {successToast && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center gap-2 text-xs text-emerald-900 font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Section 1: Closed-Loop Tactical Assignments Queue */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-600 animate-pulse" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Active Emergency Assignments ({assignments.length})
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Live Mission Registry</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 space-y-2 bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-600" />
                <p className="text-xs">Loading operational dispatch queue from database...</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No Dispatches in Queue</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your unit has no active dispatches awaiting response. Stand by on tactical radio channels.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((asgn) => {
                  const isUpdating = updatingId === asgn.id;
                  const status = asgn.status.toUpperCase();

                  return (
                    <div
                      key={asgn.id}
                      className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 transition-all ${
                        status === 'PENDING'
                          ? 'border-red-400 ring-2 ring-red-100 bg-red-50/10'
                          : status === 'COMPLETED'
                          ? 'border-emerald-300 opacity-85'
                          : 'border-blue-300 ring-1 ring-blue-100'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            status === 'PENDING' ? 'bg-red-600 text-white animate-pulse' :
                            status === 'EN_ROUTE' ? 'bg-blue-600 text-white' :
                            status === 'ON_SCENE' ? 'bg-purple-600 text-white' :
                            status === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                          }`}>
                            STATUS: {status}
                          </span>
                          <h3 className="text-base font-black text-slate-900">
                            {asgn.incident_title || 'Emergency Distress Mission'}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-400">MISSION #{asgn.id}</span>
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Unit: {asgn.team_name || asgn.team_id}
                          </span>
                        </div>
                      </div>

                      {/* Location & Instructions */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Sector: {asgn.incident_location || 'Field Location'}</span>
                        </div>
                        {asgn.notes && (
                          <div className="text-slate-600 italic bg-white p-2 rounded border border-slate-200 text-[11px]">
                            Dispatcher Notes: &quot;{asgn.notes}&quot;
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-mono pt-1">
                          <span>Dispatched: {new Date(asgn.assigned_at).toLocaleString('en-IN')}</span>
                          {asgn.accepted_at && <span>Accepted: {new Date(asgn.accepted_at).toLocaleTimeString('en-IN')}</span>}
                          {asgn.en_route_at && <span>En Route: {new Date(asgn.en_route_at).toLocaleTimeString('en-IN')}</span>}
                          {asgn.on_scene_at && <span>On Scene: {new Date(asgn.on_scene_at).toLocaleTimeString('en-IN')}</span>}
                          {asgn.completed_at && <span>Completed: {new Date(asgn.completed_at).toLocaleTimeString('en-IN')}</span>}
                        </div>
                      </div>

                      {/* Closed-Loop Action Controls */}
                      <div className="pt-1 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Synchronizes directly with Authority Command Dashboard</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleAssignmentStatusChange(asgn.id, 'DECLINED', 'Team unable to respond; diverted to backup unit.')}
                                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                              >
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span>Decline</span>
                              </button>
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleAssignmentStatusChange(asgn.id, 'ACCEPTED', 'Mission accepted by response unit.')}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                              >
                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                <span>Accept Mission</span>
                              </button>
                            </>
                          )}

                          {status === 'ACCEPTED' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleAssignmentStatusChange(asgn.id, 'EN_ROUTE', 'Unit en route to flood sector.')}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                            >
                              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                              <span>Start En Route 🚙</span>
                            </button>
                          )}

                          {status === 'EN_ROUTE' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleAssignmentStatusChange(asgn.id, 'ON_SCENE', 'Unit arrived at distress site.')}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                            >
                              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                              <span>Arrived On Scene 📍</span>
                            </button>
                          )}

                          {status === 'ON_SCENE' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleAssignmentStatusChange(asgn.id, 'COMPLETED', 'Mission accomplished; all citizens evacuated/secured.')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                            >
                              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              <span>Complete &amp; Resolve Mission ✅</span>
                            </button>
                          )}

                          {status === 'COMPLETED' && (
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Mission Completed &amp; Incident Resolved</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: General Incidents Reference Queue */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-amber-600" />
              <span>All Registered Incident Distress Reports ({incidents.length})</span>
            </h2>

            {incidents.length > 0 && (
              <div className="space-y-4">
                {incidents.map((inc) => {
                  const isUpdating = updatingId === inc.id;
                  const isResolved = inc.status === 'Resolved' || inc.status === 'Closed';

                  return (
                    <div
                      key={inc.id}
                      className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 transition-all ${
                        isResolved ? 'border-slate-200 opacity-80' : 'border-amber-300 ring-1 ring-amber-100'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            inc.priority === 'Critical' ? 'bg-red-600 text-white' :
                            inc.priority === 'High' ? 'bg-amber-600 text-white' : 'bg-sky-600 text-white'
                          }`}>
                            Priority: {inc.priority}
                          </span>
                          <h3 className="text-base font-black text-slate-900">{inc.title}</h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-400">ID: #{inc.id}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inc.status}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                        <div>
                          <strong className="text-slate-800 block text-[11px] uppercase font-bold">Caller Details:</strong>
                          <p className="text-slate-700 font-medium">
                            {inc.reported_by} • <a href={`tel:${inc.reported_phone}`} className="font-mono text-sky-600 hover:underline">{inc.reported_phone || 'No phone'}</a>
                          </p>
                        </div>
                        <div>
                          <strong className="text-slate-800 block text-[11px] uppercase font-bold">Situation Description:</strong>
                          <p className="text-slate-700 leading-relaxed font-medium">{inc.description}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            {inc.location_name}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Reported: {new Date(inc.created_at).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                          Incident Progression Stage:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                          {PROGRESS_STAGES.map((stage, idx) => (
                            <button
                              key={stage}
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleProgressStage(inc, stage)}
                              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                                stage === 'Completed'
                                  ? 'hover:bg-emerald-600 hover:text-white bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'hover:bg-amber-600 hover:text-white bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              <span className="text-[9px] text-slate-400 font-mono">Step {idx + 1}</span>
                              <span className="truncate">{stage}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
