'use client';

import React, { useState } from 'react';
import { Sliders, HelpCircle, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { GisFactors } from '@/lib/types';
import { GIS_FACTOR_DEFINITIONS } from '@/lib/gis/factors';
import { DataBadge } from '../common/DataBadge';

interface GisFactorPanelProps {
  factors?: GisFactors | null;
  locationName: string;
}

export const GisFactorPanel: React.FC<GisFactorPanelProps> = ({
  factors,
  locationName,
}) => {
  const [activeTooltipKey, setActiveTooltipKey] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!factors) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 text-slate-500 rounded-lg border border-slate-200">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                11-Factor GIS Model Parameters
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Spatial parameters for {locationName}
              </p>
            </div>
          </div>
          <DataBadge label="RASTER PIPELINE OFFLINE" variant="offline" />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-2">
          <Layers className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">GIS Factors Unavailable</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Digital elevation models, river proximity rasters, and land cover layers have not been sampled for this coordinate.
          </p>
        </div>
      </div>
    );
  }

  const formatFactorValue = (key: keyof GisFactors, val: any) => {
    if (typeof val === 'string') return val;
    if (key === 'elevation') return `${val} m`;
    if (key === 'slope' || key === 'aspect') return `${val}°`;
    if (key === 'distToRiver' || key === 'distToStream' || key === 'distToRoad') return `${val} m`;
    if (key === 'twi' || key === 'spi') return Number(val).toFixed(1);
    if (key === 'profileCurvature' || key === 'planCurvature') return Number(val).toFixed(2);
    return String(val);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-lg border border-sky-100">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              11-Factor GIS Model Parameters
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Spatial parameters for {locationName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DataBadge label="VERIFIED GIS LAYERS" variant="live" />
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Grid of 11 GIS Factors */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {GIS_FACTOR_DEFINITIONS.map((factor) => {
            const val = factors[factor.key];
            const isHovered = activeTooltipKey === factor.key;

            return (
              <div
                key={factor.key}
                onMouseEnter={() => setActiveTooltipKey(factor.key)}
                onMouseLeave={() => setActiveTooltipKey(null)}
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 relative group hover:border-sky-300 hover:bg-sky-50/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    {factor.name}
                    <HelpCircle className="w-3 h-3 text-slate-400 hover:text-sky-600 cursor-pointer" />
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-600 uppercase">
                    {factor.category}
                  </span>
                </div>

                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-base font-black text-slate-900">
                    {val != null ? formatFactorValue(factor.key, val) : 'Unassessed'}
                  </span>
                </div>

                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-950 text-white text-[10px] rounded-lg p-2.5 shadow-2xl z-50 pointer-events-none border border-slate-800">
                    <p className="font-bold text-sky-400 mb-0.5">{factor.name}</p>
                    <p className="text-slate-300 leading-snug">{factor.description}</p>
                    {factor.typicalWeight && (
                      <p className="text-[9px] text-amber-400 mt-1 font-mono">NEER Weight: {factor.typicalWeight}%</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
