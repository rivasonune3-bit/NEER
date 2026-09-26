'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { Bell, Info, AlertTriangle, Clock, MapPin, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { workflowService, AlertData } from '@/lib/services/workflowService';

export default function CitizenMyAlertsPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      setLoading(true);
      try {
        const data = await workflowService.getAlerts();
        setAlerts(data || []);
      } catch (e) {
        console.error('Failed to fetch alerts:', e);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="citizen" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="citizen" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-5 max-w-[1200px] mx-auto space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-600" />
                Localized Public Flood Alerts & Advisories
              </h1>
              <p className="text-xs text-slate-500">
                Official emergency warnings targeted to your registered geographic region.
              </p>
            </div>
            <DataBadge label="CITIZEN PORTAL" variant="live" />
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600" />
              <p className="text-xs font-medium">Fetching active alerts from NDMA/SDMA gateway...</p>
            </div>
          ) : alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alt) => (
                <div key={alt.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      {alt.title}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-black rounded uppercase border ${
                        alt.severity === 'Emergency'
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : alt.severity === 'Warning'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-sky-100 text-sky-800 border-sky-300'
                      }`}
                    >
                      {alt.severity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{alt.message}</p>

                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs space-y-1">
                    <strong className="text-sky-900 block">Recommended Action:</strong>
                    <p className="text-sky-800">{alt.recommended_action}</p>
                    {alt.additional_instructions && (
                      <p className="text-sky-700 text-[11px] italic">{alt.additional_instructions}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" /> {alt.location_name}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Issued: {new Date(alt.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2 bg-white">
              <Bell className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-xs font-bold text-slate-700">
                No active alerts for your area.
              </h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                No flood warnings or advisories are currently issued for your selected region.
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
