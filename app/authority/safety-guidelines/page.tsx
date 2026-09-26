'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { ShieldCheck, BookOpen, FileCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AuthoritySafetyGuidelinesPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                NDMA Command Operational Safety SOPs
              </h1>
              <p className="text-xs text-slate-500">
                Official National Disaster Management Authority operational manuals and disaster protocols.
              </p>
            </div>
            <DataBadge label="NDMA PROTOCOL" variant="live" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-black text-slate-900 border-b pb-2 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-sky-600" />
                Phase 1: Pre-Surge Inundation SOPs
              </h2>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Verify river gauge telemetry every 15 minutes during heavy monsoon precipitation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Pre-position NDRF inflatable motorboats in low-elevation river basins (&lt; 50m DEM).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Issue Yellow Advisories when dam reservoir capacity reaches 85%.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-black text-slate-900 border-b pb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Phase 2: Active Flashflood Emergency Protocol
              </h2>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>Trigger Cell Broadcast Red Alerts when river levels exceed danger thresholds by 1.5m.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>Mobilize district rescue fleets to priority SOS distress coordinates.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>Establish emergency medical desks at high-ground relief centers.</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
