'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  CloudRain,
  Zap,
  FlaskConical
} from 'lucide-react';
import { GisFactors } from '@/lib/types';
import { 
  calculate11FactorSusceptibility, 
  calculateDynamicHazard, 
  calculateCurrentRisk 
} from '@/lib/services/dynamicRiskService';

interface FloodRiskFactorsSectionProps {
  factors?: GisFactors | null;
  locationName: string;
  rainfallRate?: number;
  onRainfallChange?: (val: number) => void;
  isScenarioActive?: boolean;
  onResetScenario?: () => void;
}

// -------------------------------------------------------------
// Disaster-Control-Room Emergency Audio Alarm Coordinator
// -------------------------------------------------------------
class AlertAudioCoordinator {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;
  private currentAlertMode: 'NONE' | 'WARNING' | 'CRITICAL' = 'NONE';
  private muted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(isMuted: boolean) {
    this.muted = isMuted;
    if (isMuted) {
      this.stop();
    } else if (this.currentAlertMode !== 'NONE') {
      const mode = this.currentAlertMode;
      this.currentAlertMode = 'NONE';
      this.play(mode);
    }
  }

  public play(alertStatus: 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL') {
    if (alertStatus === 'NORMAL' || alertStatus === 'WATCH') {
      this.stop();
      this.currentAlertMode = 'NONE';
      return;
    }

    if (this.currentAlertMode === alertStatus && this.intervalId) {
      return; // Already playing this alert pattern
    }

    this.stop();
    this.currentAlertMode = alertStatus;

    if (this.muted) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (alertStatus === 'WARNING') {
      // Repeating warning beep: rhythmic dual-pulse (750 Hz), repeats every 1.4s
      const triggerWarning = () => {
        if (this.muted || !this.ctx) return;
        this.beep(750, 0.12, 0, 'sine', 0.15);
        this.beep(750, 0.12, 0.18, 'sine', 0.15);
      };
      triggerWarning();
      this.intervalId = setInterval(triggerWarning, 1400);
    } else if (alertStatus === 'CRITICAL') {
      // Repeating emergency "beep-beep-beep" sound (disaster control room alert)
      const triggerCritical = () => {
        if (this.muted || !this.ctx) return;
        this.beep(880, 0.08, 0, 'sawtooth', 0.20);
        this.beep(988, 0.08, 0.11, 'sawtooth', 0.22);
        this.beep(880, 0.10, 0.22, 'sawtooth', 0.20);
      };
      triggerCritical();
      this.intervalId = setInterval(triggerCritical, 800);
    }
  }

  private beep(freq: number, duration: number, delay: number, type: OscillatorType, gainPeak: number) {
    if (!this.ctx || this.muted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = this.ctx.currentTime + delay;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + duration + 0.02);
    } catch (e) {
      // Browser autoplay guard
    }
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public cleanup() {
    this.stop();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
  }
}

// 5 Discrete Land Cover Classes
const LULC_CLASSES = [
  'Dense Forest Cover',
  'Open Scrubland / Bare Soil',
  'Agriculture / River Floodplain',
  'Built-up / Urban Area',
  'Waterbodies & Wetlands'
];

export const FloodRiskFactorsSection: React.FC<FloodRiskFactorsSectionProps> = ({
  factors,
  locationName,
  rainfallRate = 14,
  onRainfallChange,
  isScenarioActive = false,
  onResetScenario,
}) => {
  // Scenario simulation values (temporary in-memory React state — NEVER touches real GIS DB)
  const [simFactors, setSimFactors] = useState<GisFactors | null>(factors || null);
  const [isGisModified, setIsGisModified] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Audio alarm coordinator
  const audioCoordinatorRef = useRef<AlertAudioCoordinator | null>(null);

  useEffect(() => {
    audioCoordinatorRef.current = new AlertAudioCoordinator();
    return () => {
      audioCoordinatorRef.current?.cleanup();
    };
  }, []);

  // Update simFactors when location changes, unless user has actively tweaked sliders in scenario mode
  useEffect(() => {
    if (!isGisModified && !isScenarioActive) {
      setSimFactors(factors || null);
    }
  }, [factors, isGisModified, isScenarioActive]);

  if (!simFactors) return null;

  // 1. Static Susceptibility from 11 GIS factors
  const staticSusceptibility = calculate11FactorSusceptibility(simFactors);

  // 2. Dynamic Hazard from Rainfall & River condition
  const dynamicHazardResult = calculateDynamicHazard({ rainfallRate });

  // 3. Combined Current Flash-Flood Risk (0 - 100%)
  const riskEvaluation = calculateCurrentRisk(
    staticSusceptibility,
    dynamicHazardResult.hazardScore,
    rainfallRate
  );

  const { currentRiskScore, riskLevel, alertStatus, statusTitle } = riskEvaluation;

  // Sync sound with alert status & mute button
  useEffect(() => {
    if (audioCoordinatorRef.current) {
      audioCoordinatorRef.current.setMuted(isMuted);
      audioCoordinatorRef.current.play(alertStatus);
    }
  }, [alertStatus, isMuted]);

  const handleSliderChange = (key: keyof GisFactors, value: any) => {
    setIsGisModified(true);
    setSimFactors(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [key]: value
      };
    });
  };

  const handleReset = () => {
    if (factors) {
      setSimFactors({ ...factors });
    }
    setIsGisModified(false);
    if (onResetScenario) {
      onResetScenario();
    }
  };

  // Helper to find index of current LULC string
  const getLulcIndex = (currentLulc: string): number => {
    const lower = (currentLulc || '').toLowerCase();
    if (lower.includes('water') || lower.includes('wetland')) return 4;
    if (lower.includes('built') || lower.includes('urban')) return 3;
    if (lower.includes('agri') || lower.includes('floodplain')) return 2;
    if (lower.includes('scrub') || lower.includes('bare')) return 1;
    return 0; // Forest
  };

  // 11 Interactive Factor Definitions with Sliders
  const factorConfigs: Array<{
    key: keyof GisFactors;
    name: string;
    displayValue: string;
    min: number;
    max: number;
    step: number;
    currentNum: number;
    isLulc?: boolean;
  }> = [
    {
      key: 'slope',
      name: 'Slope',
      displayValue: `${Number(simFactors.slope).toFixed(1)}°`,
      min: 0,
      max: 60,
      step: 0.5,
      currentNum: Number(simFactors.slope),
    },
    {
      key: 'elevation',
      name: 'Elevation',
      displayValue: `${Math.round(Number(simFactors.elevation))} m`,
      min: 0,
      max: 3500,
      step: 10,
      currentNum: Math.round(Number(simFactors.elevation)),
    },
    {
      key: 'distToRiver',
      name: 'Distance to River',
      displayValue: `${Math.round(Number(simFactors.distToRiver))} m`,
      min: 0,
      max: 5000,
      step: 25,
      currentNum: Math.round(Number(simFactors.distToRiver)),
    },
    {
      key: 'distToStream',
      name: 'Distance to Stream',
      displayValue: `${Math.round(Number(simFactors.distToStream))} m`,
      min: 0,
      max: 3000,
      step: 25,
      currentNum: Math.round(Number(simFactors.distToStream)),
    },
    {
      key: 'twi',
      name: 'TWI',
      displayValue: Number(simFactors.twi).toFixed(1),
      min: 2,
      max: 20,
      step: 0.1,
      currentNum: Number(simFactors.twi),
    },
    {
      key: 'spi',
      name: 'SPI',
      displayValue: Number(simFactors.spi).toFixed(1),
      min: 0,
      max: 30,
      step: 0.2,
      currentNum: Number(simFactors.spi),
    },
    {
      key: 'lulc',
      name: 'Land Cover / LULC',
      displayValue: simFactors.lulc,
      min: 0,
      max: 4,
      step: 1,
      currentNum: getLulcIndex(simFactors.lulc),
      isLulc: true,
    },
    {
      key: 'distToRoad',
      name: 'Distance to Road',
      displayValue: `${Math.round(Number(simFactors.distToRoad))} m`,
      min: 0,
      max: 2000,
      step: 10,
      currentNum: Math.round(Number(simFactors.distToRoad)),
    },
    {
      key: 'aspect',
      name: 'Aspect',
      displayValue: `${Math.round(Number(simFactors.aspect))}°`,
      min: 0,
      max: 360,
      step: 5,
      currentNum: Math.round(Number(simFactors.aspect)),
    },
    {
      key: 'profileCurvature',
      name: 'Profile Curvature',
      displayValue: Number(simFactors.profileCurvature).toFixed(2),
      min: -4,
      max: 4,
      step: 0.1,
      currentNum: Number(simFactors.profileCurvature),
    },
    {
      key: 'planCurvature',
      name: 'Plan Curvature',
      displayValue: Number(simFactors.planCurvature).toFixed(2),
      min: -4,
      max: 4,
      step: 0.1,
      currentNum: Number(simFactors.planCurvature),
    },
  ];

  const isSimulated = isGisModified || isScenarioActive || rainfallRate !== 14;

  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm space-y-3.5 transition-all ${
      alertStatus === 'CRITICAL'
        ? 'border-red-400 ring-2 ring-red-400/40'
        : alertStatus === 'WARNING'
        ? 'border-orange-400 ring-1 ring-orange-300'
        : alertStatus === 'WATCH'
        ? 'border-amber-300'
        : 'border-slate-200'
    }`}>
      {/* 1. Section Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border transition-colors ${
            alertStatus === 'CRITICAL'
              ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
              : alertStatus === 'WARNING'
              ? 'bg-orange-50 text-orange-600 border-orange-200'
              : 'bg-sky-50 text-sky-600 border-sky-100'
          }`}>
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              11-Factor Terrain Susceptibility & Risk
            </h2>
          </div>
        </div>

        {/* Scenario Mode Indicator */}
        {isSimulated && (
          <span className="text-[10px] font-black tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <FlaskConical className="w-3 h-3 text-amber-700" />
            Simulation Mode
          </span>
        )}
      </div>

      {/* 2. THREE-PILLAR RISK BREAKDOWN PANEL */}
      <div className={`rounded-xl p-3 border transition-all space-y-2.5 ${
        alertStatus === 'CRITICAL'
          ? 'bg-red-50 border-red-300 text-red-950 shadow-sm'
          : alertStatus === 'WARNING'
          ? 'bg-orange-50 border-orange-300 text-orange-950'
          : alertStatus === 'WATCH'
          ? 'bg-amber-50 border-amber-200 text-amber-950'
          : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
      }`}>
        
        {/* Row 1: Alert Badge & Risk Level */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
              alertStatus === 'CRITICAL'
                ? 'bg-red-600 text-white animate-pulse'
                : alertStatus === 'WARNING'
                ? 'bg-orange-600 text-white'
                : alertStatus === 'WATCH'
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {alertStatus === 'CRITICAL' && <ShieldAlert className="w-3.5 h-3.5" />}
              {alertStatus === 'WARNING' && <AlertTriangle className="w-3.5 h-3.5" />}
              {alertStatus === 'WATCH' && <AlertTriangle className="w-3.5 h-3.5" />}
              {alertStatus === 'NORMAL' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {alertStatus} ALERT
            </span>

            <span className="text-xs font-bold opacity-85">
              Risk Level: <strong>{riskLevel}</strong>
            </span>
          </div>

          <span className="text-[11px] font-bold text-slate-700 truncate max-w-[280px]">
            {statusTitle}
          </span>
        </div>

        {/* Row 2: Three Distinct Mathematical Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-black/10 text-center font-mono">
          {/* Static Susceptibility */}
          <div className="bg-white/80 p-1.5 rounded-lg border border-black/5">
            <span className="text-[9px] font-bold text-slate-500 uppercase block">Static Terrain</span>
            <span className="text-sm font-black text-slate-800">{staticSusceptibility}%</span>
          </div>

          {/* Dynamic Hazard */}
          <div className="bg-white/80 p-1.5 rounded-lg border border-black/5">
            <span className="text-[9px] font-bold text-slate-500 uppercase block">Dynamic Hazard</span>
            <span className={`text-sm font-black ${
              dynamicHazardResult.hazardScore >= 75 ? 'text-red-600' : dynamicHazardResult.hazardScore >= 50 ? 'text-orange-600' : 'text-sky-700'
            }`}>
              {dynamicHazardResult.hazardScore}%
            </span>
          </div>

          {/* Current Flash-Flood Risk */}
          <div className="bg-white/90 p-1.5 rounded-lg border border-black/10 shadow-sm">
            <span className="text-[9px] font-black text-slate-700 uppercase block">Current Risk</span>
            <span className={`text-base font-black ${
              currentRiskScore >= 75 ? 'text-red-700 animate-pulse' : currentRiskScore >= 55 ? 'text-orange-600' : 'text-emerald-700'
            }`}>
              {currentRiskScore}%
            </span>
          </div>
        </div>

        {/* Mini Score Progress Bar */}
        <div className="w-full bg-black/10 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              currentRiskScore >= 75
                ? 'bg-red-600'
                : currentRiskScore >= 55
                ? 'bg-orange-500'
                : currentRiskScore >= 35
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${currentRiskScore}%` }}
          />
        </div>

        {/* Row 3: Single Mute Alert & Reset to Real GIS Values */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/10 text-xs">
          {/* Mute Alert Button */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
              isMuted
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                : alertStatus === 'WARNING' || alertStatus === 'CRITICAL'
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title={isMuted ? 'Unmute emergency alert' : 'Mute emergency alert'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-red-500" />
                <span>Unmute Alert</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>
                  {alertStatus === 'WARNING' || alertStatus === 'CRITICAL' 
                    ? '🔇 Mute Alert' 
                    : 'Mute Alert'}
                </span>
              </>
            )}
          </button>

          {/* Reset to Real GIS Values Button */}
          <button
            type="button"
            onClick={handleReset}
            disabled={!isSimulated}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
              isSimulated
                ? 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 shadow-sm cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
            }`}
            title="Reset simulation and restore authentic GIS database values"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Reset to Real GIS</span>
          </button>
        </div>
      </div>

      {/* 3. 11 INTERACTIVE GIS FACTOR SLIDERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {factorConfigs.map((config) => {
          return (
            <div
              key={config.key}
              className={`border rounded-lg p-2.5 flex flex-col justify-between transition-colors ${
                isSimulated
                  ? 'bg-amber-50/20 border-amber-200/80 hover:border-amber-300'
                  : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Factor Name & Current Value: e.g. "Slope — 28.3°" */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[11px] font-bold text-slate-800 truncate">
                  {config.name} — <span className="font-mono text-sky-700 font-black">{config.displayValue}</span>
                </span>
              </div>

              {/* Interactive Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  value={config.currentNum}
                  onChange={(e) => {
                    const numVal = parseFloat(e.target.value);
                    if (config.isLulc) {
                      const selectedClass = LULC_CLASSES[Math.round(numVal)] || LULC_CLASSES[0];
                      handleSliderChange('lulc', selectedClass);
                    } else {
                      handleSliderChange(config.key, numVal);
                    }
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 hover:accent-sky-700"
                />
                
                {/* Min / Max bounds */}
                <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                  <span>{config.isLulc ? 'Forest' : config.min}</span>
                  <span>{config.isLulc ? 'Wetland/Water' : config.max}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
