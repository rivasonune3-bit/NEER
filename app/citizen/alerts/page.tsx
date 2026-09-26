'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { workflowService, AlertData } from '@/lib/services/workflowService';
import { 
  Bell, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Info, 
  ShieldAlert, 
  Filter, 
  Loader2 
} from 'lucide-react';
import { useRealtimeSync } from '@/lib/services/realtimeSync';

export default function CitizenAlertsPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});

  const loadAlerts = async () => {
    try {
      const data = await workflowService.getAlerts();
      setAlerts(data || []);
    } catch (e) {
      console.error('Error fetching alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  useRealtimeSync({
    onEvent: (evt) => {
      if (evt.type === 'ALERT_DISPATCHED') {
        loadAlerts();
      }
    }
  });

  const toggleAcknowledge = (id: string) => {
    setAcknowledged(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'ALL') return true;
    return a.severity.toUpperCase() === filterSeverity;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="citizen" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="citizen" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-4 md:p-6 max-w-[1100px] mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                <Bell className="w-6 h-6 text-amber-600" />
                Authority Flood Alerts & Warnings
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Official flood advisories, river surge warnings, and safety instructions from disaster management authorities.
              </p>
            </div>
            <DataBadge label="OFFICIAL BULLETINS" variant="live" />
          </div>

          {/* Filter options */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-700">Filter by Severity:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {['ALL', 'EMERGENCY', 'WARNING', 'WATCH', 'ADVISORY'].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    filterSeverity === sev
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Alerts Feed */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600" />
              <p className="text-xs font-medium">Fetching active alerts from NDMA/SDMA gateway...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No active alerts matching your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active severe flood advisories currently broadcast for this classification. Continue monitoring regional weather forecasts.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => {
                const isAck = acknowledged[alert.id];
                const isEmergency = alert.severity === 'Emergency';
                const isWarning = alert.severity === 'Warning';

                return (
                  <div
                    key={alert.id}
                    className={`bg-white rounded-2xl p-5 border shadow-sm space-y-3 transition-all ${
                      isEmergency
                        ? 'border-red-300 ring-1 ring-red-200'
                        : isWarning
                        ? 'border-amber-300 ring-1 ring-amber-100'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                          isEmergency
                            ? 'bg-red-600 text-white'
                            : isWarning
                            ? 'bg-amber-500 text-white'
                            : 'bg-sky-600 text-white'
                        }`}>
                          {alert.severity}
                        </span>
                        <h2 className="text-base font-black text-slate-900">
                          {alert.title}
                        </h2>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(alert.created_at).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {alert.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                      <span className="flex items-center gap-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        Affected Area: <strong className="text-slate-900">{alert.location_name}</strong>
                      </span>
                      {alert.expiry_time && (
                        <span>Valid Until: {new Date(alert.expiry_time).toLocaleDateString('en-IN')}</span>
                      )}
                    </div>

                    {alert.recommended_action && (
                      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1">
                        <span className="font-bold text-amber-950 uppercase tracking-wider text-[10px] block">
                          Mandatory Safety Protocol:
                        </span>
                        <p className="text-amber-900 font-medium">
                          {alert.recommended_action}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[11px] text-slate-400">
                        Authority Origin: <strong className="text-slate-600">{alert.created_by || 'Disaster Management Cell'}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleAcknowledge(alert.id)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                          isAck
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <CheckCircle className={`w-3.5 h-3.5 ${isAck ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{isAck ? 'Acknowledged' : 'Mark as Read'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
