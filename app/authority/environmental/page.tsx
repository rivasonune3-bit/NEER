'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import {
  Activity, CloudRain, Waves, Gauge, Droplets, Thermometer, Clock, AlertTriangle,
  Database, LineChart, ShieldAlert, CheckCircle2, Sliders, Info, Zap
} from 'lucide-react';

export default function EnvironmentalMonitoringPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  const telemetryCards = [
    {
      title: 'Rainfall',
      icon: CloudRain,
      color: 'sky',
      currentVal: '42.5',
      unit: 'mm',
      obsTime: '17 Sep 2026, 02:00 IST',
      source: 'IMD-AWS-Guwahati',
      dataStatus: 'OFFLINE' as const,
      subText: '24h Total: 185 mm',
    },
    {
      title: 'Rainfall Intensity',
      icon: Activity,
      color: 'indigo',
      currentVal: '18.2',
      unit: 'mm/hr',
      obsTime: '17 Sep 2026, 02:00 IST',
      source: 'IMD-Radar-Dispur',
      dataStatus: 'OFFLINE' as const,
      subText: 'Intensity: Heavy Downpour',
    },
    {
      title: 'River Water Level',
      icon: Waves,
      color: 'rose',
      currentVal: '+2.45',
      unit: 'm above datum',
      obsTime: '17 Sep 2026, 02:00 IST',
      source: 'CWC-Gauge-Brahmaputra',
      dataStatus: 'OFFLINE' as const,
      subText: 'Danger Level Mark Exceeded',
    },
    {
      title: 'Streamflow & Discharge',
      icon: Gauge,
      color: 'amber',
      currentVal: '14,200',
      unit: 'm³/s',
      obsTime: '17 Sep 2026, 02:00 IST',
      source: 'CWC-Discharge-Station',
      dataStatus: 'OFFLINE' as const,
      subText: 'Reservoir Storage: 94%',
    },
    {
      title: 'Soil Moisture Saturation',
      icon: Droplets,
      color: 'teal',
      currentVal: '89.4%',
      unit: 'VWC',
      obsTime: '17 Sep 2026, 02:00 IST',
      source: 'ISRO-Soil-Telemetry',
      dataStatus: 'OFFLINE' as const,
      subText: 'Topsoil Saturation: High',
    },
    {
      title: 'Weather & Atmosphere',
      icon: Thermometer,
      color: 'purple',
      currentVal: '26.8°C',
      unit: 'Humidity 92%',
      obsTime: '17 Sep 2026, 02:00 IST',
      source: 'IMD-Atmospheric-Feed',
      dataStatus: 'OFFLINE' as const,
      subText: 'Monsoon Pressure Cell',
    }
  ];

  const triggerRulesFramework = [
    {
      id: 'TR-RAIN-01',
      name: '24-Hour Heavy Rainfall Threshold',
      parameter: 'Rainfall',
      threshold: 'Not Configured',
      source: 'awaiting_verified_threshold',
      status: 'not_configured'
    },
    {
      id: 'TR-RIVER-01',
      name: 'River Danger Level Breach',
      parameter: 'River Level',
      threshold: 'Not Configured',
      source: 'awaiting_verified_threshold',
      status: 'not_configured'
    },
    {
      id: 'TR-MULTI-01',
      name: 'Torrential Rain + River Level Rise',
      parameter: 'Multi-Condition',
      threshold: 'Not Configured',
      source: 'awaiting_verified_threshold',
      status: 'not_configured'
    },
    {
      id: 'TR-MULTI-02',
      name: 'Rainfall Persistence + High Soil Saturation',
      parameter: 'Multi-Condition',
      threshold: 'Not Configured',
      source: 'awaiting_verified_threshold',
      status: 'not_configured'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="authority" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="authority" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-5 space-y-6 max-w-[1400px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Environmental Hydro-Meteorological Telemetry
              </h1>
              <p className="text-xs text-slate-500">
                Near-term environmental observation feeds separated from static GIS susceptibility models.
              </p>
            </div>
            <DataBadge label="TELEMETRY LAYER" variant="offline" />
          </div>

          {/* Source Connectivity Status Notice */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-950 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-amber-800 font-bold">
              <Database className="w-4 h-4 text-amber-600 shrink-0" />
              <span>External Data Source Connection Status: External data sources not connected.</span>
            </div>
            <p className="text-amber-800 font-medium leading-relaxed">
              Live telemetry streams (IMD AWS, CWC River Gauges) are not connected. Displaying offline telemetry status. Telemetry feeds remain unverified until gateway handshake.
            </p>
          </div>

          {/* 6 Environmental Telemetry Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {telemetryCards.map((card) => {
              const IconComp = card.icon;
              return (
                <div key={card.title} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <IconComp className="w-4 h-4 text-sky-600" />
                      {card.title}
                    </span>
                    <DataBadge label={card.dataStatus} variant="offline" />
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900">{card.currentVal}</span>
                      <span className="text-xs font-bold text-slate-500 ml-1.5">{card.unit}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {card.subText}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
                    <span>Source: {card.source}</span>
                    <span className="flex items-center gap-1 font-mono text-slate-600">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {card.obsTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Historical Monitoring Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <LineChart className="w-4 h-4 text-sky-600" />
                  Historical Hydro-Meteorological Observation Trends
                </h2>
                <p className="text-[11px] text-slate-500">
                  Time-series trend inspection across rainfall, river levels, and discharge.
                </p>
              </div>

              {/* Timeframe Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {(['1h', '6h', '24h', '7d'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      selectedTimeframe === tf
                        ? 'bg-white text-sky-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Empty State Notice for Historical Data */}
            <div className="py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2 bg-slate-50/50">
              <LineChart className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-xs font-bold text-slate-700">
                Historical observations unavailable.
              </h3>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                No verified historical telemetry time-series records exist for timeframe ({selectedTimeframe}). Real time-series curves will render once external AWS & CWC databases are connected.
              </p>
            </div>
          </div>

          {/* Flood Trigger Engine Framework */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Flood Trigger Engine & Multi-Condition Rules
                </h2>
                <p className="text-[11px] text-slate-500">
                  Configurable rule structure for hydro-meteorological threshold breaches.
                </p>
              </div>
              <DataBadge label="TRIGGER ENGINE FRAMEWORK" variant="offline" />
            </div>

            <div className="space-y-3">
              {triggerRulesFramework.map((rule) => (
                <div key={rule.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-500">{rule.id}</span>
                      <span className="font-bold text-slate-900">{rule.name}</span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                        {rule.parameter}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      Source: {rule.source}
                    </p>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <span className="inline-block px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-bold rounded-md text-[11px]">
                      Trigger thresholds not configured.
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Awaiting official agency calibration
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
