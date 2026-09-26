'use client';

import React from 'react';
import { 
  CloudRain, 
  Waves, 
  Gauge, 
  TrendingUp, 
  Activity,
  Clock,
  WifiOff
} from 'lucide-react';
import { EnvironmentalData } from '@/lib/types';
import { DataBadge } from '../common/DataBadge';

interface EnvironmentalPanelProps {
  data?: EnvironmentalData | null;
  locationName: string;
}

export const EnvironmentalPanel: React.FC<EnvironmentalPanelProps> = ({
  data,
  locationName,
}) => {
  if (!data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 text-slate-500 rounded-lg border border-slate-200">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Real-Time Environmental Monitoring
              </h2>
            </div>
          </div>
          <DataBadge label="TELEMETRY DISCONNECTED" variant="offline" />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-2">
          <WifiOff className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Environmental Telemetry Unavailable</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            External weather radar, CWC river level gauges, and soil moisture telemetry feeds are not connected for this region. No fake sensor values are populated.
          </p>
        </div>
      </div>
    );
  }

  const isOverDangerLevel = data.waterLevel > data.dangerMarkLevel;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Real-Time Environmental Monitoring
            </h2>
          </div>
        </div>
        <DataBadge label="VERIFIED TELEMETRY FEED" variant="live" />
      </div>

      {/* Grid of Hydro Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Rainfall Metric */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-sky-500" />
              Precipitation Intensity
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-black text-slate-900">{data.rainfall1h}</span>
              <span className="text-xs text-slate-500 ml-1 font-semibold">mm/hr</span>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
              24h: {data.rainfall24h} mm
            </span>
          </div>
        </div>

        {/* River Gauge Water Level */}
        <div
          className={`border rounded-lg p-3 ${
            isOverDangerLevel
              ? 'bg-red-50/60 border-red-200'
              : 'bg-slate-50 border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1.5 text-slate-800">
              <Waves className="w-4 h-4 text-cyan-600" />
              River Level Gauge
            </span>
            {isOverDangerLevel && (
              <span className="text-[10px] font-extrabold text-red-700 bg-red-100 border border-red-300 px-1.5 py-0.2 rounded animate-pulse">
                DANGER
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className={`text-xl font-black ${isOverDangerLevel ? 'text-red-700' : 'text-slate-900'}`}>
                +{data.waterLevel.toFixed(2)} m
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Danger Threshold:</span>
              <span className="text-xs font-bold text-slate-700">{data.dangerMarkLevel.toFixed(2)} m</span>
            </div>
          </div>
        </div>

        {/* Reservoir Capacity */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-amber-500" />
              Reservoir Capacity
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
              {data.reservoirCapacityPct}%
            </span>
          </div>
        </div>

        {/* Doppler Radar Storm Trend */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Doppler Radar Trend
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-black text-slate-800 uppercase tracking-wide">
              {data.radarStormTrend}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
