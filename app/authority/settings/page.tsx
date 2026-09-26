'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { Settings, Sliders, Bell, Database, Key } from 'lucide-react';

export default function AuthoritySettingsPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [refreshInterval, setRefreshInterval] = useState(15);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="authority" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="authority" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-5 space-y-5 max-w-[1200px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-700" />
                System Configuration & API Integration Settings
              </h1>
              <p className="text-xs text-slate-500">
                Configure susceptibility alert threshold limits, telemetry polling rates, and backend microservice endpoints.
              </p>
            </div>
            <DataBadge label="CONFIG PREVIEW" variant="offline" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Threshold Sliders */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-600" />
                Alert Trigger Thresholds
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Critical Risk Susceptibility Threshold:</span>
                    <span className="text-sky-700 font-mono">{alertThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">Triggers mandatory cell broadcast advisories</span>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>Telemetry Polling Rate:</span>
                    <span className="text-sky-700 font-mono">{refreshInterval} Minutes</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">Automatic hydro-meteorological gauge sync rate</span>
                </div>
              </div>
            </div>

            {/* Backend Microservices Contract Preview */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                Backend Endpoint Contracts
              </h2>

              <div className="space-y-2 text-xs font-mono">
                <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg">
                  <span className="text-emerald-400 font-bold">POST</span> /api/v1/risk/predict
                  <span className="block text-[10px] text-slate-400 mt-0.5">XGBoost ML Susceptibility Service</span>
                </div>
                <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg">
                  <span className="text-sky-400 font-bold">GET</span> /api/v1/gis/rasters/dem
                  <span className="block text-[10px] text-slate-400 mt-0.5">GeoTIFF 30m Digital Elevation Engine</span>
                </div>
                <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg">
                  <span className="text-amber-400 font-bold">WSS</span> wss://telemetry.cwc.gov.in/feed
                  <span className="block text-[10px] text-slate-400 mt-0.5">CWC River Gauge Telemetry Stream</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
