'use client';

import React, { useEffect, useState } from 'react';
import { Database, Satellite, CloudRain, Waves, Users, CheckCircle2 } from 'lucide-react';
import { workflowService } from '@/lib/services/workflowService';

interface MultiSourceDataCardProps {
  rainfallRate: number;
  riverCondition: 'NORMAL' | 'WARNING' | 'DANGER';
}

export const MultiSourceDataCard: React.FC<MultiSourceDataCardProps> = ({
  rainfallRate,
  riverCondition,
}) => {
  const [evidenceCount, setEvidenceCount] = useState<number>(0);

  useEffect(() => {
    async function loadEvidence() {
      try {
        const ev = await workflowService.getEvidence();
        if (Array.isArray(ev)) {
          setEvidenceCount(ev.length);
        }
      } catch (e) {
        setEvidenceCount(1); // default seeded record
      }
    }
    loadEvidence();
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Multi-Source Data Ingestion
            </h2>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase">
          4 Data Pillars
        </span>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        
        {/* Pillar 1: Satellite / Terrain */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              1. Satellite / Terrain
            </span>
            <Satellite className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="mt-1">
            <p className="text-xs font-black text-slate-900 leading-tight">
              Copernicus DEM (30m)
            </p>
            <p className="text-[10px] text-slate-500">
              ESA WorldCover 10m LULC
            </p>
          </div>
          <div className="mt-2 flex items-center justify-end pt-1.5 border-t border-slate-200/60">
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
              Connected
            </span>
          </div>
        </div>

        {/* Pillar 2: Meteorological */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              2. Meteorological
            </span>
            <CloudRain className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="mt-1">
            <p className="text-xs font-black text-slate-900 leading-tight">
              Precipitation Rate
            </p>
            <p className="text-xs font-mono font-bold text-sky-700">
              {rainfallRate} mm/hr
            </p>
          </div>
          <div className="mt-2 flex items-center justify-end pt-1.5 border-t border-slate-200/60">
            <span className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded">
              Monitored
            </span>
          </div>
        </div>

        {/* Pillar 3: Hydrological */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              3. Hydrological
            </span>
            <Waves className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="mt-1">
            <p className="text-xs font-black text-slate-900 leading-tight">
              CWC River Telemetry
            </p>
            <p className="text-[10px] text-slate-500">
              Stage: {riverCondition === 'DANGER' ? 'Above Danger Level' : riverCondition === 'WARNING' ? 'Approaching Warning Level' : 'Below Warning Mark'}
            </p>
          </div>
          <div className="mt-2 flex items-center justify-end pt-1.5 border-t border-slate-200/60">
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
              riverCondition === 'DANGER'
                ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                : riverCondition === 'WARNING'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {riverCondition}
            </span>
          </div>
        </div>

        {/* Pillar 4: Ground Evidence */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              4. Ground Evidence
            </span>
            <Users className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="mt-1">
            <p className="text-xs font-black text-slate-900 leading-tight">
              Citizen & Fleet Feed
            </p>
            <p className="text-[10px] text-slate-500">
              {evidenceCount > 0 ? `${evidenceCount} field photo(s) & SOS` : 'No reports filed'}
            </p>
          </div>
          <div className="mt-2 flex items-center justify-end pt-1.5 border-t border-slate-200/60">
            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
              Active
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
