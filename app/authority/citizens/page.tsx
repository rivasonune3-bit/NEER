'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { workflowService, CitizenData, IncidentData, FieldEvidenceData, ResponseTeamData } from '@/lib/services/workflowService';
import { 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  AlertTriangle, 
  Camera, 
  LifeBuoy, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Loader2, 
  ArrowRight,
  ShieldAlert,
  Radio
} from 'lucide-react';

import { useRealtimeSync } from '@/lib/services/realtimeSync';

export default function AuthorityCitizenManagementPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [citizens, setCitizens] = useState<CitizenData[]>([]);
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [evidenceList, setEvidenceList] = useState<FieldEvidenceData[]>([]);
  const [responseTeams, setResponseTeams] = useState<ResponseTeamData[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<'citizens' | 'distress' | 'evidence'>('citizens');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadAllData = async () => {
    try {
      const [cList, iList, eList, tList] = await Promise.all([
        workflowService.getCitizens(),
        workflowService.getIncidents(),
        workflowService.getEvidence('CITIZEN'),
        workflowService.getResponseTeams()
      ]);
      setCitizens(cList || []);
      setIncidents(iList || []);
      setEvidenceList(eList || []);
      setResponseTeams(tList || []);
    } catch (e) {
      console.error('Failed to load authority citizen data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadAllData();
  }, []);

  useRealtimeSync({
    onEvent: () => {
      loadAllData();
    }
  });

  const handleVerify = async (incidentId: string) => {
    const success = await workflowService.verifyIncident(incidentId, 'Critical');
    if (success) {
      setIncidents(prev => prev.map(inc => inc.id === incidentId ? { ...inc, status: 'Verified' } : inc));
      setActionSuccess('Incident verified and prioritized in dispatch queue.');
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const handleQuickAssign = async (incidentId: string, teamId: string) => {
    const res = await workflowService.assignIncident(incidentId, teamId, 'High', 'Dispatched by Authority Command');
    if (res.success) {
      setIncidents(prev => prev.map(inc => inc.id === incidentId ? { ...inc, status: 'Assigned', assigned_team_id: teamId } : inc));
      setActionSuccess(`Incident assigned to response team. Fleet alerted.`);
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const filteredCitizens = citizens.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.district || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="authority" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="authority" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-sky-600" />
                Citizen Management & Public Distress Desk
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized registry of verified resident profiles, real-time 1-Click SOS signals, and citizen-submitted flood evidence.
              </p>
            </div>
            <DataBadge label="CENTRAL DATABASE CONNECTED" variant="live" />
          </div>

          {actionSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center gap-2 text-xs text-emerald-900 font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Registered Citizens</span>
                <span className="text-2xl font-black text-slate-900">{citizens.length}</span>
                <span className="text-[11px] text-emerald-600 font-semibold block">Profiles in SQLite Database</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Citizen Distress Calls</span>
                <span className="text-2xl font-black text-red-600">{incidents.length}</span>
                <span className="text-[11px] text-slate-500 block">SOS signals & distress tickets</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Field Evidence Photos</span>
                <span className="text-2xl font-black text-purple-600">{evidenceList.length}</span>
                <span className="text-[11px] text-slate-500 block">Public ground observation uploads</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('citizens')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'citizens'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Registered Citizens ({citizens.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('distress')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'distress'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Distress Incident Queue ({incidents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('evidence')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'evidence'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Citizen Evidence Photos ({evidenceList.length})</span>
              </button>
            </div>

            {activeTab === 'citizens' && (
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name, phone, district..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* TAB 1: Registered Citizens Roster */}
          {activeTab === 'citizens' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-600" />
                  <p className="text-xs">Loading citizens from SQLite database...</p>
                </div>
              ) : filteredCitizens.length === 0 ? (
                <div className="p-10 text-center text-slate-500 text-xs">
                  No citizens match your search query.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Citizen Name</th>
                        <th className="p-4">Contact Phone</th>
                        <th className="p-4">Registered Location</th>
                        <th className="p-4">Emergency Contact</th>
                        <th className="p-4">SMS Warning</th>
                        <th className="p-4">Account Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {filteredCitizens.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900">{c.name}</div>
                            <span className="font-mono text-[10px] text-slate-400">{c.email}</span>
                          </td>
                          <td className="p-4 font-mono font-semibold">
                            {c.phone || <span className="text-slate-400 italic">None</span>}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 font-semibold">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{[c.address, c.district, c.state].filter(Boolean).join(', ') || 'Assam Sector'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 text-[11px]">
                            {c.emergency_contacts || <span className="text-slate-400 italic">Not specified</span>}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.alert_sms_enabled !== 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {c.alert_sms_enabled !== 0 ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-[11px] text-slate-500">
                            {new Date(c.created_at).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Citizen Distress Incident Queue */}
          {activeTab === 'distress' && (
            <div className="space-y-4">
              {incidents.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">No Citizen Distress Reports Pending</p>
                </div>
              ) : (
                incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          inc.priority === 'Critical' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          {inc.priority}
                        </span>
                        <h3 className="text-base font-black text-slate-900">{inc.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">ID: #{inc.id}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {inc.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {inc.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                      <span><strong>Reported By:</strong> {inc.reported_by}</span>
                      <span><strong>Phone:</strong> <span className="font-mono">{inc.reported_phone}</span></span>
                      <span><strong>Location:</strong> {inc.location_name}</span>
                      <span className="font-mono text-slate-400">Reported: {new Date(inc.created_at).toLocaleString('en-IN')}</span>
                    </div>

                    {/* Authority Action Dispatch Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        {inc.status === 'Reported' && (
                          <button
                            type="button"
                            onClick={() => handleVerify(inc.id)}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs transition-all shadow-sm"
                          >
                            Verify Distress Report
                          </button>
                        )}
                        <span className="text-slate-500 font-bold">Dispatch Unit:</span>
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) handleQuickAssign(inc.id, e.target.value);
                          }}
                          className="bg-slate-100 border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                        >
                          <option value="">Select Response Team...</option>
                          {responseTeams.map((t) => (
                            <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
                          ))}
                        </select>
                      </div>

                      {inc.assigned_team_id && (
                        <span className="text-[11px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                          Assigned to Unit: {inc.assigned_team_id}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Citizen Submitted Photo Evidence */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              {evidenceList.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
                  <Camera className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">No Citizen Evidence Photos Uploaded</p>
                  <p className="text-[11px] text-slate-500">Citizen distress photo proof will appear here automatically when uploaded.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evidenceList.map((ev) => (
                    <div key={ev.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-40 h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ev.image_url} alt="Citizen Evidence" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-2 text-xs">
                        <div className="flex items-start justify-between">
                          <span className="font-extrabold text-slate-900">{ev.uploader_name}</span>
                          <span className="font-mono text-[10px] text-slate-400">#{ev.id}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed font-medium">{ev.description}</p>
                        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                          <span>{ev.location_name}</span>
                          <span className="font-mono">{new Date(ev.timestamp).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
