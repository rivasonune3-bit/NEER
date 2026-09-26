'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import {
  Search, AlertCircle, CheckCircle2, Sliders, Info, Compass, Database, XCircle,
  BarChart3, ShieldAlert, Cpu, RefreshCw, AlertTriangle, Layers, Activity, Zap, Radio
} from 'lucide-react';
import { INDIA_STATES, INDIA_DISTRICTS } from '@/lib/data/indiaLocations';
import { predictionService, MlPredictionResult } from '@/lib/services/predictionService';
import { environmentService, LocationMonitoringStatusData } from '@/lib/services/environmentService';

export default function CheckFloodRiskPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [stateId, setStateId] = useState('st-as');
  const [districtId, setDistrictId] = useState('dt-km');
  const [lat, setLat] = useState('26.1850');
  const [lng, setLng] = useState('91.7720');

  // 11 GIS Factors state
  const [elevation, setElevation] = useState('120.5');
  const [slope, setSlope] = useState('4.2');
  const [distRiver, setDistRiver] = useState('350.0');
  const [distStream, setDistStream] = useState('150.0');
  const [distRoad, setDistRoad] = useState('400.0');
  const [landCover, setLandCover] = useState('Agricultural Land');
  const [aspect, setAspect] = useState('185.0');
  const [twi, setTwi] = useState('11.4');
  const [spi, setSpi] = useState('2.1');
  const [profCurv, setProfCurv] = useState('0.02');
  const [planCurv, setPlanCurv] = useState('-0.01');

  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<MlPredictionResult | null>(null);
  const [monitoringStatus, setMonitoringStatus] = useState<LocationMonitoringStatusData | null>(null);

  const districts = INDIA_DISTRICTS[stateId] || [];

  const lulcCategories = [
    'Water Body', 'Wetland', 'Agricultural Land', 'Built-Up Area',
    'Forest', 'Barren Land', 'Grassland', 'Shrubland'
  ];

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPredictionResult(null);

    const gisPayload = {
      elevation: parseFloat(elevation),
      slope: parseFloat(slope),
      distance_to_river: parseFloat(distRiver),
      distance_to_stream: parseFloat(distStream),
      distance_to_road: parseFloat(distRoad),
      land_cover: landCover,
      aspect: parseFloat(aspect),
      twi: parseFloat(twi),
      spi: parseFloat(spi),
      profile_curvature: parseFloat(profCurv),
      plan_curvature: parseFloat(planCurv),
    };

    const [mlRes, envRes] = await Promise.all([
      predictionService.predictMlSusceptibility(gisPayload),
      environmentService.getEnvironmentStatus(districtId)
    ]);

    setIsLoading(false);
    setPredictionResult(mlRes);
    setMonitoringStatus(envRes);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="authority" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="authority" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-5 space-y-5 max-w-[1380px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-sky-600" />
                Check Flood Risk & 4-Tier Monitoring Status
              </h1>
              <p className="text-xs text-slate-500">
                Independent evaluation of Static Susceptibility, Telemetry Conditions, Trigger Rules, and Overall State.
              </p>
            </div>
            <DataBadge label="4-TIER MONITORING" variant="offline" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Input Form */}
            <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-600" />
                11-Factor GIS Input Payload
              </h2>

              <form onSubmit={handlePredict} className="space-y-3 text-xs">
                {/* Location Selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State</label>
                    <select
                      value={stateId}
                      onChange={(e) => {
                        setStateId(e.target.value);
                        setDistrictId(INDIA_DISTRICTS[e.target.value]?.[0]?.id || '');
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
                    >
                      {INDIA_STATES.map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">District</label>
                    <select
                      value={districtId}
                      onChange={(e) => setDistrictId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
                    >
                      {districts.map((dt) => (
                        <option key={dt.id} value={dt.id}>{dt.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Coords */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Latitude (°N)</label>
                    <input
                      type="text"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Longitude (°E)</label>
                    <input
                      type="text"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* 11 GIS Inputs Grid */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    11 Spatial Factors
                  </span>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700">1. Elevation (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={elevation}
                        onChange={(e) => setElevation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-1.5 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700">2. Slope (°)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={slope}
                        onChange={(e) => setSlope(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-1.5 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700">3. Dist to River (m)</label>
                      <input
                        type="number"
                        step="1"
                        value={distRiver}
                        onChange={(e) => setDistRiver(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-1.5 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700">4. Dist to Stream (m)</label>
                      <input
                        type="number"
                        step="1"
                        value={distStream}
                        onChange={(e) => setDistStream(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-1.5 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700">5. Dist to Road (m)</label>
                      <input
                        type="number"
                        step="1"
                        value={distRoad}
                        onChange={(e) => setDistRoad(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-1.5 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700">6. Land Cover (LULC)</label>
                      <select
                        value={landCover}
                        onChange={(e) => setLandCover(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-1.5 font-medium text-xs text-slate-800"
                      >
                        {lulcCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700">7. Aspect (°)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={aspect}
                        onChange={(e) => setAspect(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-1.5 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700">8. TWI Index</label>
                      <input
                        type="number"
                        step="0.1"
                        value={twi}
                        onChange={(e) => setTwi(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-1.5 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700">9. SPI Index</label>
                      <input
                        type="number"
                        step="0.1"
                        value={spi}
                        onChange={(e) => setSpi(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-1.5 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700">10. Profile Curvature</label>
                      <input
                        type="number"
                        step="0.01"
                        value={profCurv}
                        onChange={(e) => setProfCurv(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-1.5 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="block text-[11px] font-medium text-slate-700">11. Plan Curvature</label>
                    <input
                      type="number"
                      step="0.01"
                      value={planCurv}
                      onChange={(e) => setPlanCurv(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-md p-1.5 font-mono text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-md transition-all text-xs flex items-center justify-center gap-1.5 mt-4 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Evaluating 4 Monitoring Tiers...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      <span>Evaluate 4-Tier Monitoring Status</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* 4-Tier Risk Output Panels */}
            <div className="md:col-span-7 space-y-4">
              
              {/* Notice Banner */}
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-950 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-amber-800 font-bold">
                  <Database className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Data & Source Status: Verified training dataset and external feeds not connected.</span>
                </div>
                <p className="text-amber-800 font-medium leading-relaxed">
                  Susceptibility models require verified training CSVs. Environmental telemetry streams require live API connections. Trigger rules require official agency calibration.
                </p>
              </div>

              {predictionResult && (
                <div className="space-y-4 text-xs">
                  
                  {/* Tier 1: GIS Susceptibility */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-sky-600" />
                        1. GIS Flood Susceptibility (Static Model)
                      </span>
                      <DataBadge label={predictionResult.status} variant="offline" />
                    </div>

                    <p className="text-slate-600 leading-snug">
                      Status: <strong className="text-slate-800">{predictionResult.message}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Model Version: {predictionResult.model_version}
                    </p>
                  </div>

                  {/* Tier 2: Environmental Conditions */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-blue-600" />
                        2. Current Environmental Conditions (Dynamic Telemetry)
                      </span>
                      <DataBadge label="UNAVAILABLE" variant="offline" />
                    </div>

                    <p className="text-slate-600 leading-snug">
                      Data Source Notice: <strong className="text-amber-700">External data source not connected.</strong> Telemetry observations (IMD/CWC) unavailable.
                    </p>
                  </div>

                  {/* Tier 3: Trigger Status */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        3. Trigger Status (Configured Rules Engine)
                      </span>
                      <DataBadge label="UNCONFIGURED" variant="offline" />
                    </div>

                    <p className="text-slate-600 leading-snug">
                      Rule Evaluation: <strong className="text-slate-800">Trigger thresholds not configured.</strong> Awaiting official scientific calibration.
                    </p>
                  </div>

                  {/* Tier 4: Overall Synthesized Monitoring Status */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-md space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="font-black text-sm uppercase tracking-wider text-sky-400 flex items-center gap-2">
                        <Radio className="w-4 h-4 animate-pulse text-sky-400" />
                        4. Overall Monitoring Status
                      </span>
                      <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold rounded-full text-xs">
                        {monitoringStatus?.overall_monitoring_status || 'DATA_UNAVAILABLE'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Synthesis decision: Location is currently in <strong className="text-white font-bold">{monitoringStatus?.overall_monitoring_status || 'DATA_UNAVAILABLE'}</strong> status.
                      System will not declare an active flood condition without verified telemetry data and calibrated trigger rules.
                    </p>
                  </div>

                  {/* Decision Support Disclaimer */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start gap-2 leading-snug">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 block mb-0.5">Decision-Support Estimate Disclaimer:</strong>
                      This result is a decision-support estimate. Static susceptibility and dynamic environmental conditions are processed independently to maintain scientific transparency.
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
