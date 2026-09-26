'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { LocationHierarchy } from '@/components/dashboard/LocationHierarchy';
import { IndiaMap } from '@/components/dashboard/IndiaMap';
import { LocationItem } from '@/lib/types';
import { INDIA_STATES, INDIA_DISTRICTS, INDIA_BLOCKS, INDIA_VILLAGES } from '@/lib/data/indiaLocations';
import { calculateLocationRisk } from '@/lib/gis/syntheticProvider';
import { DataBadge } from '@/components/common/DataBadge';
import { MapPin, Compass, Info, Layers } from 'lucide-react';

export default function ExploreIndiaPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<LocationItem>(INDIA_STATES[0]);
  const [selectedDistrict, setSelectedDistrict] = useState<LocationItem | null>(INDIA_DISTRICTS['st-as'][0]);
  const [selectedBlock, setSelectedBlock] = useState<LocationItem | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<LocationItem | null>(null);

  const currentFocus = selectedVillage || selectedBlock || selectedDistrict || selectedState;
  const focusRisk = calculateLocationRisk(currentFocus.lat, currentFocus.lng, currentFocus.name);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="authority" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="authority" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-5 space-y-5 max-w-[1600px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-sky-600" />
                Explore India GIS Spatial Map
              </h1>
              <p className="text-xs text-slate-500">
                Interactive geographic drill-down across 36 States/UTs, Districts, Blocks, and Villages.
              </p>
            </div>
            <DataBadge label="GIS RASTER LAYER" variant="offline" />
          </div>

          <LocationHierarchy
            selectedState={selectedState}
            selectedDistrict={selectedDistrict}
            selectedBlock={selectedBlock}
            selectedVillage={selectedVillage}
            onSelectState={(st) => {
              setSelectedState(st);
              setSelectedDistrict(INDIA_DISTRICTS[st.id]?.[0] || null);
              setSelectedBlock(null);
              setSelectedVillage(null);
            }}
            onSelectDistrict={(dt) => {
              setSelectedDistrict(dt);
              setSelectedBlock(INDIA_BLOCKS[dt.id]?.[0] || null);
              setSelectedVillage(null);
            }}
            onSelectBlock={(bl) => {
              setSelectedBlock(bl);
              setSelectedVillage(INDIA_VILLAGES[bl.id]?.[0] || null);
            }}
            onSelectVillage={(vl) => setSelectedVillage(vl)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8">
              <IndiaMap
                selectedLocation={currentFocus}
                onSelectLocation={(loc) => {
                  const matchedState = INDIA_STATES.find(s => s.id === loc.id) || INDIA_STATES[0];
                  setSelectedState(matchedState);
                  setSelectedDistrict(INDIA_DISTRICTS[matchedState.id]?.[0] || null);
                  setSelectedBlock(null);
                  setSelectedVillage(null);
                }}
              />
            </div>

            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-sky-600" />
                  Selected Location Inspector
                </h2>
                <span className="text-[10px] font-mono text-slate-400">ID: {currentFocus.id}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium block text-[10px] uppercase">Name & Type</span>
                  <span className="text-lg font-black text-slate-900">{currentFocus.name} ({currentFocus.type.toUpperCase()})</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase">Latitude</span>
                    <span className="font-bold text-slate-900 font-mono">{currentFocus.lat.toFixed(4)}°N</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase">Longitude</span>
                    <span className="font-bold text-slate-900 font-mono">{currentFocus.lng.toFixed(4)}°E</span>
                  </div>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                  <span className="text-sky-900 font-bold block mb-1">Susceptibility Rating Index</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-sky-700">{focusRisk.location.susceptibilityScore}%</span>
                    <span className="text-xs font-bold text-sky-800">({focusRisk.location.riskLevel} Risk)</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>Map overlays use baseline DEM raster templates. Real GIS data layer server will be attached in future phase.</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
