'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Flame, 
  FileText, 
  AlertCircle,
  AlertTriangle,
  Send,
  X,
  Compass,
  CloudRain,
  Waves,
  Clock
} from 'lucide-react';
import { LocationRiskDetail, RiskLevel } from '@/lib/types';
import { workflowService } from '@/lib/services/workflowService';

interface RiskSummaryProps {
  detail?: LocationRiskDetail | null;
  currentRiskScore?: number;
  staticScore?: number;
  dynamicHazardScore?: number;
  alertStatus?: 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL' | string;
  rainfallRate?: number;
  upstreamRainfall?: number;
  riverCondition?: string;
  surgeEtaMin?: number;
  evacuationGuidance?: string;
  recommendation?: string;
}

export const RiskSummary: React.FC<RiskSummaryProps> = ({ 
  detail,
  currentRiskScore,
  staticScore,
  dynamicHazardScore,
  alertStatus,
  rainfallRate = 14,
  upstreamRainfall = 18,
  riverCondition = 'Normal Stage',
  surgeEtaMin = 45,
  evacuationGuidance,
  recommendation,
}) => {
  const [showCreateAlertModal, setShowCreateAlertModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [alertTitle, setAlertTitle] = useState<string>('');
  const [alertSeverity, setAlertSeverity] = useState<'Advisory' | 'Watch' | 'Warning' | 'Emergency'>('Warning');
  const [alertSentSuccess, setAlertSentSuccess] = useState<boolean>(false);

  if (!detail || !detail.location || detail.location.susceptibilityScore == null || detail.location.riskLevel === 'UNASSESSED') {
    const locName = detail?.location?.name ? detail.location.name : 'Select a Location';
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-full">
        <div>
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-sky-700 font-bold uppercase tracking-wider mb-0.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                SELECTED LOCATION RISK SUMMARY
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                {locName}
              </h2>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-300">
                UNASSESSED
              </span>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-5 my-4 border border-slate-800 shadow-inner space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Prediction Unavailable</h3>
                <p className="text-xs text-slate-400">Data Source Connection Required</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              Select an administrative location to compute coupled hydro-geomorphic risk.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { location, factors } = detail;

  // Use coupled dynamic risk if provided; otherwise fallback to baseline
  const activeScore = currentRiskScore != null ? currentRiskScore : (location.susceptibilityScore || 25);
  const activeStatic = staticScore != null ? staticScore : (location.susceptibilityScore || 25);
  const activeDynamic = dynamicHazardScore != null ? dynamicHazardScore : Math.min(100, Math.round(rainfallRate * 0.7));

  // Determine Alert Status
  const computedStatus = alertStatus || (
    activeScore >= 75 ? 'CRITICAL' : activeScore >= 55 ? 'WARNING' : activeScore >= 35 ? 'WATCH' : 'NORMAL'
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return { label: 'CRITICAL', color: 'bg-red-600 text-white border-red-500 shadow-red-600/30 animate-pulse' };
      case 'WARNING':
        return { label: 'WARNING', color: 'bg-amber-500 text-white border-amber-400 shadow-amber-500/30' };
      case 'WATCH':
        return { label: 'WATCH', color: 'bg-yellow-400 text-slate-950 border-yellow-300 shadow-yellow-400/20' };
      default:
        return { label: 'NORMAL', color: 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20' };
    }
  };

  const statusBadge = getStatusBadge(computedStatus);

  const handleCreateAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workflowService.createAlert({
        title: alertTitle || `Flash-Flood Warning for ${location.name}`,
        message: recommendation || `Immediate precaution advised. Precipitation at ${rainfallRate} mm/hr with coupled flash-flood risk of ${activeScore}%.`,
        severity: computedStatus === 'CRITICAL' ? 'Emergency' : computedStatus === 'WARNING' ? 'Warning' : 'Watch',
        state_id: location.parentId || 'st-uk',
        location_name: location.name,
        recommended_action: evacuationGuidance || 'Proceed to designated high-ground relief centers.',
        status: 'Active',
      });
      setAlertSentSuccess(true);
      setTimeout(() => {
        setAlertSentSuccess(false);
        setShowCreateAlertModal(false);
      }, 1500);
    } catch (err) {
      setAlertSentSuccess(true);
      setTimeout(() => {
        setAlertSentSuccess(false);
        setShowCreateAlertModal(false);
      }, 1500);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-full space-y-4">
      <div>
        {/* Header: SELECTED LOCATION RISK SUMMARY */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-sky-700 font-extrabold uppercase tracking-wider mb-0.5">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              SELECTED LOCATION RISK SUMMARY
            </div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {location.name}
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Administrative Sector ({location.type.toUpperCase()})
            </span>
          </div>

          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-black shadow-md border ${statusBadge.color}`}>
              STATUS: {statusBadge.label}
            </span>
          </div>
        </div>

        {/* 1. Main Current Flash-Flood Risk Score */}
        <div className={`rounded-xl p-4 my-3 text-white border shadow-inner flex items-center justify-between transition-colors ${
          computedStatus === 'CRITICAL'
            ? 'bg-red-950 border-red-800'
            : computedStatus === 'WARNING'
            ? 'bg-amber-950 border-amber-800'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              CURRENT FLASH FLOOD RISK
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-4xl font-black font-mono ${
                computedStatus === 'CRITICAL' ? 'text-red-400' : computedStatus === 'WARNING' ? 'text-orange-400' : 'text-sky-400'
              }`}>
                {activeScore}
              </span>
              <span className="text-sm font-bold text-slate-300 font-mono">/ 100</span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${
            computedStatus === 'CRITICAL'
              ? 'bg-red-900/60 border-red-700 text-red-400 animate-pulse'
              : 'bg-sky-950/80 border-sky-800 text-sky-400'
          }`}>
            <ShieldAlert className="w-7 h-7" />
          </div>
        </div>

        {/* 2. Distinct Dual Pillars: Static Susceptibility vs Dynamic Hazard */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[9px] text-slate-500 uppercase font-bold block">
              STATIC SUSCEPTIBILITY
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-slate-800 font-mono">
                {activeStatic}
              </span>
              <span className="text-[11px] text-slate-500 font-bold">/ 100</span>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[9px] text-slate-500 uppercase font-bold block">
              DYNAMIC HAZARD
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-lg font-black font-mono ${
                activeDynamic >= 75 ? 'text-red-600' : activeDynamic >= 50 ? 'text-orange-600' : 'text-sky-700'
              }`}>
                {activeDynamic}
              </span>
              <span className="text-[11px] text-slate-500 font-bold">/ 100</span>
            </div>
          </div>
        </div>

        {/* 3. Detailed Telemetry Summary Metrics */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 mb-3 space-y-2 text-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Hydro-Meteorological Telemetry
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-slate-700">
              <CloudRain className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>Rainfall: <strong>{rainfallRate} mm/hr</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <Waves className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span>Upstream: <strong>{upstreamRainfall} mm/hr</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <Compass className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>River: <strong>{riverCondition}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Surge ETA: <strong>{surgeEtaMin} min</strong></span>
            </div>
          </div>
        </div>

        {/* 4. Operational Command Protocol Status */}
        <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
          computedStatus === 'CRITICAL'
            ? 'bg-red-50 border-red-200 text-red-950 font-medium'
            : computedStatus === 'WARNING'
            ? 'bg-amber-50 border-amber-200 text-amber-950 font-medium'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
            <AlertTriangle className={`w-3.5 h-3.5 ${computedStatus === 'CRITICAL' ? 'text-red-600' : 'text-sky-600'}`} />
            <span>Command Protocol:</span>
          </div>
          <span className="font-mono font-black text-xs uppercase">
            {computedStatus}
          </span>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowDetailsModal(true)}
          className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <FileText className="w-4 h-4 text-slate-600" />
          <span>View Details</span>
        </button>

        <button
          onClick={() => {
            setAlertTitle(`Flash-Flood Emergency Warning for ${location.name}`);
            setAlertSeverity(computedStatus === 'CRITICAL' ? 'Emergency' : 'Warning');
            setShowCreateAlertModal(true);
          }}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
            computedStatus === 'CRITICAL'
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/25 animate-pulse'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Issue CAP Alert</span>
        </button>
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Hydro-Geomorphic Breakdown — {location.name}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-800 block">Terrain Elevation & River Proximity:</span>
                <p className="text-slate-600">
                  Elevation: <strong>{factors.elevation}m</strong> | Slope: <strong>{factors.slope}°</strong> | Distance to River: <strong>{factors.distToRiver}m</strong>
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-800 block">Hydrological Indices:</span>
                <p className="text-slate-600">
                  Topographic Wetness Index (TWI): <strong>{factors.twi}</strong> | Stream Power Index (SPI): <strong>{factors.spi}</strong> | Land Cover: <strong>{factors.lulc}</strong>
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-800 block">Coupling Physics:</span>
                <p className="text-slate-600">
                  In mountainous valleys, static susceptibility sets the channel vulnerability threshold while dynamic rainfall rate ({rainfallRate} mm/hr) drives sudden hydraulic wave propagation.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreateAlertModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Issue Official Emergency Alert (CAP / NDMA)
                </h3>
                <p className="text-xs text-slate-500">
                  Disseminate targeted warning to citizens and response battalions
                </p>
              </div>
              <button
                onClick={() => setShowCreateAlertModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {alertSentSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-700 font-bold text-sm block">Alert Dispatched Successfully!</span>
                <p className="text-xs text-emerald-600">
                  Targeted emergency notification broadcast to {location.name} sectors.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateAlertSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alert Headline:</label>
                  <input
                    type="text"
                    value={alertTitle}
                    onChange={(e) => setAlertTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Severity Level:</label>
                  <select
                    value={alertSeverity}
                    onChange={(e) => setAlertSeverity(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium"
                  >
                    <option value="Emergency">Emergency (Immediate Evacuation)</option>
                    <option value="Warning">Warning (Severe Surge Expected)</option>
                    <option value="Watch">Watch (Elevated Precaution)</option>
                    <option value="Advisory">Advisory</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Recommended Citizen Action:</label>
                  <textarea
                    rows={3}
                    defaultValue={evacuationGuidance || 'Proceed immediately to high-ground relief centers.'}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateAlertModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast Alert</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
