'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { FileText, Download, AlertCircle, CheckCircle, MapPin, Flame, LifeBuoy } from 'lucide-react';

export default function ReportsPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showExportNotice, setShowExportNotice] = useState(false);

  const handleExport = () => {
    setShowExportNotice(true);
    setTimeout(() => setShowExportNotice(false), 3500);
  };

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
                <FileText className="w-5 h-5 text-sky-600" />
                Disaster Management Reports & Audit Log
              </h1>
              <p className="text-xs text-slate-500">
                Generate spatial susceptibility audit summaries, alert dispatches, and emergency rescue logs.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <DataBadge label="REPORT ENGINE" variant="offline" />
              <button
                onClick={handleExport}
                className="py-2 px-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Executive Report (.PDF / .CSV)</span>
              </button>
            </div>
          </div>

          {showExportNotice && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Backend export engine offline. Connect report compiler service to generate reports.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Risk Summary Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-600" />
                Regional Risk Summary
              </h2>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p>Total States Covered: <strong>8 States</strong></p>
                <p>Critical Inundation Zones: <strong>3 Regions</strong></p>
                <p>Average Susceptibility Index: <strong>78.4%</strong></p>
                <p>Primary Driver: <strong>River Proximity & DEM Flatland</strong></p>
              </div>
            </div>

            {/* Alert Summary Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" />
                Alert Advisory Summary
              </h2>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p>Active Advisories Issued: <strong>3 Warnings</strong></p>
                <p>Target Population Covered: <strong>~245,000 Citizens</strong></p>
                <p>Cell Broadcast Gateway: <strong>NDMA Channel OK</strong></p>
                <p>Delivery Success Rate: <strong>-- (Awaiting Gateway Sync)</strong></p>
              </div>
            </div>

            {/* Incident Summary Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <LifeBuoy className="w-4 h-4 text-red-600" />
                Incident & Evacuation Summary
              </h2>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p>Total SOS Distress Calls: <strong>3 Calls</strong></p>
                <p>Evacuated & Safe: <strong>1 Call (5 Evacuees)</strong></p>
                <p>Active Dispatches: <strong>2 Calls Pending</strong></p>
                <p>NDRF Motorboats Deployed: <strong>3 Units</strong></p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
