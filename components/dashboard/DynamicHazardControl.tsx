'use client';

import React from 'react';
import { CloudRain, Zap, RotateCcw, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { DynamicHazardResult } from '@/lib/services/dynamicRiskService';

interface DynamicHazardControlProps {
  rainfallRate: number;
  onRainfallChange: (val: number) => void;
  hazardResult: DynamicHazardResult;
  isScenarioActive: boolean;
  onSimulateCloudburst: () => void;
  onResetScenario: () => void;
}

export const DynamicHazardControl: React.FC<DynamicHazardControlProps> = ({
  rainfallRate,
  onRainfallChange,
  hazardResult,
  isScenarioActive,
  onSimulateCloudburst,
  onResetScenario,
}) => {
  const { hazardScore, hazardLevel, rainfallThresholdLabel } = hazardResult;

  const getSliderTrackColor = () => {
    if (rainfallRate > 100) return 'accent-red-600 bg-red-100';
    if (rainfallRate > 50) return 'accent-orange-500 bg-orange-100';
    return 'accent-sky-600 bg-slate-200';
  };

  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm space-y-3.5 transition-all ${
      rainfallRate > 100
        ? 'border-red-400 ring-2 ring-red-400/30'
        : rainfallRate > 50
        ? 'border-orange-300 ring-1 ring-orange-300/40'
        : 'border-slate-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border transition-colors ${
            rainfallRate > 100
              ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
              : rainfallRate > 50
              ? 'bg-orange-50 text-orange-600 border-orange-200'
              : 'bg-sky-50 text-sky-600 border-sky-100'
          }`}>
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              Dynamic Meteorological Hazard
            </h2>
          </div>
        </div>

        {/* Scenario Mode Indicator */}
        {isScenarioActive && (
          <span className="text-[10px] font-black tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Zap className="w-3 h-3 text-amber-700" />
            Simulation Mode
          </span>
        )}
      </div>

      {/* Primary Meteorological Control: Precipitation Rate */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-slate-800">
              Precipitation Rate:
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-mono font-black ${
              rainfallRate > 100
                ? 'bg-red-600 text-white animate-pulse'
                : rainfallRate > 50
                ? 'bg-orange-500 text-white'
                : 'bg-sky-600 text-white'
            }`}>
              {rainfallRate} mm/hr
            </span>
          </div>

          {hazardLevel !== 'NORMAL' && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              hazardLevel === 'CLOUDBURST_WARNING'
                ? 'bg-red-100 text-red-800 border border-red-200 font-black'
                : 'bg-orange-100 text-orange-800 border border-orange-200'
            }`}>
              {rainfallThresholdLabel}
            </span>
          )}
        </div>

        {/* Interactive Range Slider (0 - 150 mm/hr) */}
        <div className="space-y-1 pt-1">
          <input
            type="range"
            min={0}
            max={150}
            step={1}
            value={rainfallRate}
            onChange={(e) => onRainfallChange(parseFloat(e.target.value) || 0)}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${getSliderTrackColor()}`}
          />
        </div>

        {/* Hazard Score Indicator */}
        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
          <span className="text-[11px] font-semibold text-slate-600">
            Calculated Dynamic Hazard Index:
          </span>
          <span className="font-mono font-black text-slate-900">
            {hazardScore}%
          </span>
        </div>
      </div>

      {/* Phase 5: Judge Demo Scenario Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <button
          type="button"
          onClick={onSimulateCloudburst}
          className={`py-1.5 px-3 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all ${
            isScenarioActive && rainfallRate >= 110
              ? 'bg-red-700 text-white ring-2 ring-red-400'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title="Instantly triggers a deterministic 110 mm/hr Cloudburst & Flash Flood surge for demonstration"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Simulate Cloudburst Scenario</span>
        </button>

        <button
          type="button"
          onClick={onResetScenario}
          disabled={!isScenarioActive && rainfallRate === 14}
          className={`py-1.5 px-3 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
            isScenarioActive || rainfallRate !== 14
              ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm cursor-pointer'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
          }`}
          title="Restore baseline meteorological and GIS parameters"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Scenario</span>
        </button>
      </div>
    </div>
  );
};
