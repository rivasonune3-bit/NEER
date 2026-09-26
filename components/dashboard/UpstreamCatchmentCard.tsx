'use client';

import React from 'react';
import { Mountain, Clock, Waves, Compass, AlertCircle } from 'lucide-react';
import { UpstreamCatchmentData } from '@/lib/services/dynamicRiskService';

interface UpstreamCatchmentCardProps {
  data: UpstreamCatchmentData;
  locationName: string;
}

export const UpstreamCatchmentCard: React.FC<UpstreamCatchmentCardProps> = ({
  data,
  locationName,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <Mountain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Upstream Catchment & Surge Influx
            </h2>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 uppercase">
          Hydrologic Basin
        </span>
      </div>

      {/* 4 Metric Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* 1. Drainage Area */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Drainage Area
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-black font-mono text-slate-900">
              {data.drainageAreaKm2}
            </span>
            <span className="text-[10px] text-slate-500 font-bold">km²</span>
          </div>
        </div>

        {/* 2. Hydrological Head Distance */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Hydrological Head
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-black font-mono text-slate-900">
              {data.hydrologicalHeadKm}
            </span>
            <span className="text-[10px] text-slate-500 font-bold">km</span>
          </div>
        </div>

        {/* 3. Upstream Precipitation (1h & 3h) */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Upstream Rainfall
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <div>
              <span className="text-[9px] text-slate-500 font-semibold block">1h:</span>
              <span className="text-sm font-black font-mono text-sky-700">
                {data.cumulativeRainfall1h} mm
              </span>
            </div>
            <div className="border-l border-slate-300 pl-2">
              <span className="text-[9px] text-slate-500 font-semibold block">3h:</span>
              <span className="text-sm font-black font-mono text-slate-700">
                {data.cumulativeRainfall3h} mm
              </span>
            </div>
          </div>
        </div>

        {/* 4. Estimated Surge Arrival (ETA) */}
        <div className={`p-2.5 rounded-lg border ${
          data.estimatedSurgeArrivalMin <= 30
            ? 'bg-red-50 border-red-200 text-red-950'
            : data.estimatedSurgeArrivalMin <= 45
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
            Estimated Surge Arrival
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <Clock className="w-3.5 h-3.5 inline mr-0.5" />
            <span className="text-lg font-black font-mono">
              ~{data.estimatedSurgeArrivalMin}
            </span>
            <span className="text-[10px] font-bold">min</span>
          </div>
        </div>
      </div>

      {/* Model Estimate Indicator */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 font-mono">
        <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>MODEL ESTIMATE</span>
      </div>
    </div>
  );
};
