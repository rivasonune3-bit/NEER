'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { Navigation, Radio } from 'lucide-react';
import { workflowService, ResponseTeamData } from '@/lib/services/workflowService';

export default function ResponseTeamLocationPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [teams, setTeams] = useState<ResponseTeamData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workflowService.getResponseTeams().then(res => {
      setTeams(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <SystemStatusBanner />
      <Header currentRole="response" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="response" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-5 max-w-[1400px] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-sky-600" />
                Fleet GPS Telemetry & Team Location Tracking
              </h1>
              <p className="text-xs text-slate-500">
                Real-time rescue team GPS tracking and operational sector coordinates.
              </p>
            </div>
            <DataBadge label={teams.length > 0 ? "LIVE GPS TELEMETRY" : "GPS OFFLINE"} variant={teams.length > 0 ? "live" : "offline"} />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-lg space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Radio className="w-4 h-4 animate-pulse" />
              Active Rescue Units GPS Stream
            </h2>

            {loading ? (
              <p className="text-xs text-slate-400">Loading telemetry streams...</p>
            ) : teams.length === 0 ? (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-1">
                <Radio className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-xs font-bold text-slate-300">No Active GPS Telemetry Streams</p>
                <p className="text-[11px] text-slate-500">No response units currently broadcasting position telemetry.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {teams.map((unit) => (
                  <div key={unit.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-black text-xs text-white">{unit.name}</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                        {unit.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-sky-300">
                      Base Location: {unit.base_location}
                    </p>
                    <p className="text-[10px] text-slate-400">Leader: {unit.leader_name} ({unit.contact_phone})</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
