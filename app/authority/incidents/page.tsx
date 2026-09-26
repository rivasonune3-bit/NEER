'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { LifeBuoy, MapPin, AlertTriangle, CheckCircle, X, Users, Phone, Clock, UserCheck, ShieldAlert, FileText, Camera, Loader2 } from 'lucide-react';
import { workflowService, IncidentData, ResponseTeamData, FieldEvidenceData } from '@/lib/services/workflowService';

export default function IncidentsManagementPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [responseTeams, setResponseTeams] = useState<ResponseTeamData[]>([]);
  const [evidenceList, setEvidenceList] = useState<FieldEvidenceData[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedIncident, setSelectedIncident] = useState<IncidentData | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [overrideBusy, setOverrideBusy] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [incList, teamList, evList] = await Promise.all([
        workflowService.getIncidents(),
        workflowService.getResponseTeams(),
        workflowService.getEvidence()
      ]);
      setIncidents(incList || []);
      setResponseTeams(teamList || []);
      setEvidenceList(evList || []);
      if (teamList && teamList.length > 0) {
        setSelectedTeamId(teamList[0].id);
      }
    } catch (e) {
      console.error('Failed to load incident data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerify = async (incId: string) => {
    const success = await workflowService.verifyIncident(incId, 'High');
    if (success) {
      setIncidents(prev => prev.map(i => {
        if (i.id === incId) {
          return { ...i, status: 'Verified' as const };
        }
        return i;
      }));
      setActionSuccess('Incident verified in central database.');
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const handleAssign = async (incId: string) => {
    const team = responseTeams.find(t => t.id === selectedTeamId);
    if (!team) return;

    if (team.status !== 'Available' && !overrideBusy) {
      alert(`Team '${team.name}' is currently '${team.status}'. Check explicit override box to assign.`);
      return;
    }

    const res = await workflowService.assignIncident(incId, team.id, 'High', 'Dispatched by Authority Command');
    if (res.success) {
      setIncidents(prev => prev.map(i => {
        if (i.id === incId) {
          return {
            ...i,
            status: 'Assigned' as const,
            assigned_team_id: team.id,
            assigned_team_name: team.name
          };
        }
        return i;
      }));

      setActionSuccess(`Assigned ${team.name} to incident #${incId}. Response Fleet alerted.`);
      setTimeout(() => setActionSuccess(null), 3000);

      if (selectedIncident && selectedIncident.id === incId) {
        setSelectedIncident(null);
      }
    } else {
      alert(res.message || 'Failed to assign team');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="authority" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="authority" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-5 space-y-5 max-w-[1500px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-red-600" />
                Emergency Incident Command & Rescue Dispatch
              </h1>
              <p className="text-xs text-slate-500">
                Verify citizen distress reports, prioritize rescue operations, and dispatch response teams.
              </p>
            </div>
            <DataBadge label="INCIDENT DISPATCH" variant="offline" />
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Title & Type</th>
                  <th className="py-3 px-4">Reported By</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Team</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">#{inc.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {inc.title}
                      <span className="block text-[10px] font-mono text-slate-500">{inc.incident_type}</span>
                    </td>
                    <td className="py-3 px-4">
                      {inc.reported_by}
                      <span className="block text-[10px] text-slate-400">{inc.reported_phone}</span>
                    </td>
                    <td className="py-3 px-4">{inc.location_name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${
                          inc.priority === 'Critical'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {inc.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded text-[10px] font-bold">
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {inc.assigned_team_name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {inc.status === 'Reported' && (
                        <button
                          onClick={() => handleVerify(inc.id)}
                          className="py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px]"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded text-[11px] border border-slate-300"
                      >
                        Manage / Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Field Evidence Inspection Stream (Citizen vs Response Fleet Uploads) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Camera className="w-4 h-4 text-sky-600" />
                  Field Evidence & Photo Verification Stream
                </h2>
                <p className="text-xs text-slate-500">
                  Separated citizen distress uploads (source = CITIZEN) and response fleet reports (source = RESPONSE_FLEET).
                </p>
              </div>
              <DataBadge label="EVIDENCE REPOSITORY" variant="live" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evidenceList.map((ev) => (
                <div key={ev.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 font-bold block">#{ev.id}</span>
                      <h3 className="text-xs font-black text-slate-900">{ev.uploader_name}</h3>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-sky-600" /> {ev.location_name}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase border ${
                        ev.source === 'CITIZEN'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-sky-100 text-sky-800 border-sky-300'
                      }`}
                    >
                      source = {ev.source}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-2.5 rounded-lg border border-slate-200">
                    {ev.description}
                  </p>

                  {ev.image_url && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 h-36 bg-slate-900 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ev.image_url} alt="Field Evidence" className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-sm">
                        {new Date(ev.timestamp).toLocaleString('en-IN')}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Modal: Incident Timeline & Dispatch */}
          {selectedIncident && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 text-xs">
                <button onClick={() => setSelectedIncident(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 border-b pb-3">
                  <LifeBuoy className="w-5 h-5 text-red-600" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">Incident Inspection #{selectedIncident.id}</h3>
                    <p className="text-[11px] text-slate-500">Status: {selectedIncident.status} | Priority: {selectedIncident.priority}</p>
                  </div>
                </div>

                <div className="space-y-2 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p><strong>Title:</strong> {selectedIncident.title}</p>
                  <p><strong>Location:</strong> {selectedIncident.location_name}</p>
                  <p><strong>Reported By:</strong> {selectedIncident.reported_by} ({selectedIncident.reported_phone})</p>
                  <p><strong>Description:</strong> {selectedIncident.description}</p>
                </div>

                {/* Team Assignment Box */}
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg space-y-2">
                  <span className="font-bold text-sky-900 block">Dispatch / Assign Response Team</span>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="w-full bg-white border border-sky-300 rounded-md p-2 font-medium"
                    >
                      {responseTeams.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.type}) — Status: {t.status}
                        </option>
                      ))}
                    </select>

                    <label className="flex items-center gap-2 text-[11px] font-semibold text-sky-950">
                      <input
                        type="checkbox"
                        checked={overrideBusy}
                        onChange={(e) => setOverrideBusy(e.target.checked)}
                      />
                      <span>Override busy/assigned availability warning</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleAssign(selectedIncident.id)}
                      className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-md"
                    >
                      Confirm Dispatch Assignment
                    </button>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-2 border-t pt-3">
                  <span className="font-bold text-slate-800 block">Incident Timeline History</span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedIncident.timeline.map((t, idx) => (
                      <div key={idx} className="p-2 bg-slate-100 rounded text-[11px] flex justify-between">
                        <div>
                          <strong className="text-slate-900">{t.new_status}</strong>
                          <span className="text-slate-500 ml-1">({t.user}) — {t.note}</span>
                        </div>
                        <span className="font-mono text-slate-400 shrink-0">{t.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button onClick={() => setSelectedIncident(null)} className="py-2 px-4 bg-slate-800 text-white font-bold rounded-lg">
                    Close Inspector
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
