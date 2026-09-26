'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { Radio, Users, Phone } from 'lucide-react';
import { workflowService, ResponseTeamData } from '@/lib/services/workflowService';

export default function ResponseTeamsPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [units, setUnits] = useState<ResponseTeamData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workflowService.getResponseTeams().then(res => {
      setUnits(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="authority" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="authority" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-5 space-y-5 max-w-[1400px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-600" />
                Response Teams & Rescue Fleet Roster
              </h1>
              <p className="text-xs text-slate-500">
                Command oversight of active NDRF, SDRF, Coast Guard, and Medical Air Ambulance units.
              </p>
            </div>
            <DataBadge label={units.length > 0 ? "LIVE ROSTER" : "0 TEAMS REGISTERED"} variant={units.length > 0 ? "live" : "offline"} />
          </div>

          {loading ? (
            <p className="text-xs text-slate-500">Loading fleet roster...</p>
          ) : units.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2 shadow-sm">
              <Radio className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Response Teams Registered</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active response teams or rescue fleet units have been registered in the database.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit) => (
                <div key={unit.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{unit.name}</h3>
                      <span className="text-xs text-slate-500 font-medium">{unit.type}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        unit.status === 'Available'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : unit.status === 'Assigned'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-sky-100 text-sky-800 border-sky-300'
                      }`}
                    >
                      {unit.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Leader: <strong>{unit.leader_name}</strong></span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Contact: <strong>{unit.contact_phone}</strong></span>
                    </p>
                    <p className="pt-1 text-[11px] text-slate-500 border-t border-slate-100">
                      Base Location: <strong className="text-slate-800">{unit.base_location}</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
