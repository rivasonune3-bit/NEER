'use client';

import React from 'react';
import { Flame, AlertTriangle, Clock, MapPin } from 'lucide-react';
import { AlertIncident } from '@/lib/types';
import { DataBadge } from '../common/DataBadge';

interface AlertListProps {
  alerts?: AlertIncident[];
}

export const AlertList: React.FC<AlertListProps> = ({ alerts = [] }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Advisories
              </h2>
            </div>
          </div>
          <DataBadge label={alerts.length > 0 ? "LIVE BROADCASTS" : "0 ACTIVE ALERTS"} variant={alerts.length > 0 ? "live" : "offline"} />
        </div>

        {/* List of Alerts or Empty State */}
        {alerts.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center space-y-1">
            <Flame className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Active Advisories</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 hover:border-amber-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
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
                    className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase shrink-0 ${
                      String(item.severity).toUpperCase() === 'CRITICAL' || String(item.severity).toUpperCase() === 'EMERGENCY'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : String(item.severity).toUpperCase() === 'WARNING' || String(item.severity).toUpperCase() === 'HIGH'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : String(item.severity).toUpperCase() === 'WATCH' || String(item.severity).toUpperCase() === 'MODERATE'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
