'use client';

import React, { useState } from 'react';
import { 
  Flame, 
  LifeBuoy, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  MapPin
} from 'lucide-react';
import { AlertIncident, SosCall } from '@/lib/types';
import { DataBadge } from '../common/DataBadge';

interface AlertsIncidentsFeedProps {
  initialAlerts?: AlertIncident[];
  initialIncidents?: SosCall[];
}

export const AlertsIncidentsFeed: React.FC<AlertsIncidentsFeedProps> = ({
  initialAlerts = [],
  initialIncidents = [],
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'sos'>('alerts');
  const [alerts, setAlerts] = useState<AlertIncident[]>(initialAlerts);
  const [sosList, setSosList] = useState<SosCall[]>(initialIncidents);

  const handleResolveSos = (id: string) => {
    setSosList(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'RESCUED' as const } : s))
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      
      {/* Header Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Active Flood Advisories ({alerts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'sos'
                ? 'bg-red-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Citizen SOS Distress Calls ({sosList.filter(s => s.status !== 'RESCUED').length} Active)</span>
          </button>
        </div>

        <DataBadge label={alerts.length > 0 || sosList.length > 0 ? "LIVE OPERATIONAL FEED" : "0 ACTIVE ITEMS"} variant={alerts.length > 0 ? "live" : "offline"} />
      </div>

      {/* Tab 1: Flood Advisories Feed */}
      {activeTab === 'alerts' && (
        alerts.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-1">
            <Flame className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Operational Advisories Issued</p>
            <p className="text-[11px] text-slate-500">There are currently 0 active cell broadcast flood advisories in the system.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 hover:border-amber-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="p-2 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <MapPin className="w-3 h-3 text-sky-600" />
                          {item.locationName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {item.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                      item.severity === 'CRITICAL'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-600">
                    <strong className="text-slate-800">Action:</strong> {item.recommendedAction}
                  </div>
                  <div className="text-right text-slate-500 flex items-center justify-end gap-1 font-medium">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Estimated Impact: ~{item.affectedPopulationEstimate.toLocaleString()} Citizens
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Tab 2: SOS Distress Calls List */}
      {activeTab === 'sos' && (
        sosList.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-1">
            <LifeBuoy className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No SOS Distress Calls Active</p>
            <p className="text-[11px] text-slate-500">No citizen emergency distress calls reported.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sosList.map((sos) => (
              <div
                key={sos.id}
                className={`border rounded-xl p-3.5 transition-all ${
                  sos.status === 'RESCUED'
                    ? 'bg-emerald-50/50 border-emerald-200 opacity-60'
                    : 'bg-red-50/40 border-red-200'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900">
                        {sos.citizenName}
                      </span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                        {sos.phone}
                      </span>
                      <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded">
                        {sos.peopleCount} People Trapped
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-1">
                      <strong className="text-slate-900">Details:</strong> {sos.details}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" />
                      {sos.address} ({sos.lat.toFixed(4)}°, {sos.lng.toFixed(4)}°)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {sos.status === 'RESCUED' ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5" /> Rescued & Safe
                      </span>
                    ) : (
                      <button
                        onClick={() => handleResolveSos(sos.id)}
                        className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Evacuated
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

    </div>
  );
};
