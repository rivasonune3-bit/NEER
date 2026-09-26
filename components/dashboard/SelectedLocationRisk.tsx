'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  MapPin, 
  Flame, 
  LifeBuoy, 
  FileText, 
  CheckCircle,
  Share2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { LocationRiskDetail } from '@/lib/types';
import { DataBadge } from '../common/DataBadge';

interface SelectedLocationRiskProps {
  detail: LocationRiskDetail;
  onIssueAlert?: () => void;
  onDispatchFleet?: () => void;
}

export const SelectedLocationRisk: React.FC<SelectedLocationRiskProps> = ({
  detail,
  onIssueAlert,
  onDispatchFleet,
}) => {
  const [alertSent, setAlertSent] = useState<boolean>(false);
  const { location, factors, environmental, contributingFactors, evacuationStatus, historicalEventsCount } = detail;

  const handleSendAlert = () => {
    setAlertSent(true);
    if (onIssueAlert) onIssueAlert();
    setTimeout(() => setAlertSent(false), 3000);
  };

  const getRiskBadgeColor = (level?: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-600 text-white shadow-red-500/30';
      case 'HIGH':
        return 'bg-amber-500 text-white shadow-amber-500/30';
      case 'MODERATE':
        return 'bg-yellow-500 text-white';
      case 'UNASSESSED':
        return 'bg-slate-100 text-slate-600 border border-slate-300';
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-full">
      
      <div>
        {/* Top Title & Location header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-sky-700 font-bold uppercase tracking-wider mb-1">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              Selected Target Evaluation
            </div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {location.name}
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Administrative Division ({location.type.toUpperCase()})
            </span>
          </div>

          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-black shadow-md ${getRiskBadgeColor(
                location.riskLevel
              )}`}
            >
              {location.riskLevel}
            </span>
            <div className="mt-1">
              <DataBadge label="BASELINE SCORE" variant="offline" />
            </div>
          </div>
        </div>

        {/* Susceptibility Score Big Circular Metric */}
        <div className="my-4 bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between border border-slate-800 shadow-inner">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Susceptibility Rating Index
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black text-sky-400">
                {location.susceptibilityScore != null ? `${location.susceptibilityScore}%` : 'Unassessed'}
              </span>
              <span className="text-xs text-slate-300 font-medium">/ 100 Risk Scale</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Derived from 11-factor DEM & hydrological matrix
            </p>
          </div>

          {/* Radial progress ring mockup */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="#1e293b"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke={location.riskLevel === 'CRITICAL' ? '#ef4444' : '#f59e0b'}
                strokeWidth="6"
                strokeDasharray="163"
                strokeDashoffset={163 - (163 * (location.susceptibilityScore || 0)) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <ShieldAlert className="w-5 h-5 text-sky-400 absolute" />
          </div>
        </div>

        {/* Key Factor Driver Influence Bars */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>Primary Contributing Drivers</span>
            <span className="text-[10px] text-slate-500 font-normal">Analytical Weight %</span>
          </h3>

          <div className="space-y-2">
            {contributingFactors.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-800">{item.name}</span>
                  <span className="text-slate-900 font-bold">{item.weightPct}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      item.impact === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${item.weightPct * 2.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Status Details */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-sky-50 border border-sky-100 rounded-lg p-2.5">
            <span className="text-[10px] text-sky-700 font-bold uppercase block">Evacuation Status</span>
            <span className="font-extrabold text-sky-900">
              {evacuationStatus.replace('_', ' ')}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Flood Frequency</span>
            <span className="font-extrabold text-slate-900">
              {historicalEventsCount} Events (10-Yr Record)
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons for Command Center Operator */}
      <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSendAlert}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
              alertSent
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
            }`}
          >
            {alertSent ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Broadcasting Cell Advisory...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>Issue Regional Advisory</span>
              </>
            )}
          </button>

          <button
            onClick={onDispatchFleet}
            className="flex-1 py-2.5 px-3 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Dispatch Fleet</span>
          </button>
        </div>

        <button
          onClick={() => alert("GIS Susceptibility Report export generated for " + location.name)}
          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Complete GIS Audit Summary (.PDF / .CSV)</span>
        </button>
      </div>

    </div>
  );
};
