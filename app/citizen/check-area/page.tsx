'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { Search, MapPin, Building2, PhoneCall, ArrowRight, CheckCircle2, Sliders, Droplet, Mountain } from 'lucide-react';
import { INDIA_STATES, INDIA_DISTRICTS, INDIA_BLOCKS, INDIA_VILLAGES } from '@/lib/data/indiaLocations';

export default function CitizenCheckAreaPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [stateId, setStateId] = useState('st-as');
  const [districtId, setDistrictId] = useState('dt-km');
  const [blockId, setBlockId] = useState('bl-gz');
  const [villageId, setVillageId] = useState('vl-hb');
  const [checked, setChecked] = useState(false);

  const districts = INDIA_DISTRICTS[stateId] || [];
  const blocks = INDIA_BLOCKS[districtId] || [];
  const villages = INDIA_VILLAGES[blockId] || [];

  const stateName = INDIA_STATES.find(s => s.id === stateId)?.name || 'Assam';
  const districtName = districts.find(d => d.id === districtId)?.name || 'Kamrup Metropolitan';
  const blockName = blocks.find(b => b.id === blockId)?.name || 'Guwahati Sadar';
  const villageName = villages.find(v => v.id === villageId)?.name || 'Hatsingimari';

  const isAssam = stateId === 'st-as';
  const susceptibilityScore = isAssam ? 84 : 45;
  const susceptibilityCategory = isAssam ? 'HIGH SUSCEPTIBILITY' : 'MODERATE SUSCEPTIBILITY';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="citizen" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="citizen" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-4 md:p-6 max-w-[1000px] mx-auto space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                <Search className="w-6 h-6 text-emerald-600" />
                Check Flood Susceptibility in My Area
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed GIS terrain and hydrological flood susceptibility rating for your village or district.
              </p>
            </div>
            <DataBadge label="RESIDENT ACCESS" variant="live" />
          </div>

          {/* Location Hierarchy Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
              Select Location Hierarchy (State → District → Block → Village):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">State</label>
                <select
                  value={stateId}
                  onChange={(e) => {
                    const newSt = e.target.value;
                    setStateId(newSt);
                    const newDists = INDIA_DISTRICTS[newSt] || [];
                    const newDistId = newDists[0]?.id || '';
                    setDistrictId(newDistId);
                    const newBlks = INDIA_BLOCKS[newDistId] || [];
                    const newBlkId = newBlks[0]?.id || '';
                    setBlockId(newBlkId);
                    setVillageId(INDIA_VILLAGES[newBlkId]?.[0]?.id || '');
                    setChecked(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-emerald-500"
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
                  onChange={(e) => {
                    const newDistId = e.target.value;
                    setDistrictId(newDistId);
                    const newBlks = INDIA_BLOCKS[newDistId] || [];
                    const newBlkId = newBlks[0]?.id || '';
                    setBlockId(newBlkId);
                    setVillageId(INDIA_VILLAGES[newBlkId]?.[0]?.id || '');
                    setChecked(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {districts.map((dt) => (
                    <option key={dt.id} value={dt.id}>{dt.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Block / Taluka</label>
                <select
                  value={blockId}
                  onChange={(e) => {
                    const newBlkId = e.target.value;
                    setBlockId(newBlkId);
                    setVillageId(INDIA_VILLAGES[newBlkId]?.[0]?.id || '');
                    setChecked(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {blocks.length > 0 ? (
                    blocks.map((bl) => <option key={bl.id} value={bl.id}>{bl.name}</option>)
                  ) : (
                    <option value="">Default Block</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Village / Ward</label>
                <select
                  value={villageId}
                  onChange={(e) => {
                    setVillageId(e.target.value);
                    setChecked(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {villages.length > 0 ? (
                    villages.map((vl) => <option key={vl.id} value={vl.id}>{vl.name}</option>)
                  ) : (
                    <option value="">Default Village</option>
                  )}
                </select>
              </div>
            </div>

            <button
              onClick={() => setChecked(true)}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>Analyze Area Flood Susceptibility</span>
            </button>
          </div>

          {/* Analysis Result Card */}
          {checked && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Calculated GIS Rating for:
                  </span>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    {villageName}, {blockName}, {districtName}, {stateName}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                    susceptibilityScore > 70
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-amber-500 text-white shadow-sm'
                  }`}>
                    {susceptibilityCategory} ({susceptibilityScore}%)
                  </span>
                </div>
              </div>

              {/* GIS Factors Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Contributing GIS Factors (Terrain & Hydrology):
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Elevation</span>
                    <span className="font-extrabold text-slate-800 text-sm">48 m AMSL</span>
                    <span className="text-[10px] text-amber-700 block mt-0.5">Low elevation plain</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Slope Gradient</span>
                    <span className="font-extrabold text-slate-800 text-sm">1.8°</span>
                    <span className="text-[10px] text-red-700 block mt-0.5">Flat drainage zone</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Proximity to River</span>
                    <span className="font-extrabold text-slate-800 text-sm">0.35 km</span>
                    <span className="text-[10px] text-red-700 block mt-0.5">Major river catchment</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Soil Infiltration</span>
                    <span className="font-extrabold text-slate-800 text-sm">Clay Loam</span>
                    <span className="text-[10px] text-slate-600 block mt-0.5">Moderate percolation</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 italic border-l-2 border-emerald-500 pl-3">
                Note: NEER combines these 11 terrain, hydrological and land-surface factors to assess flood susceptibility. High susceptibility indicates terrain vulnerability, not guaranteed flood prediction.
              </p>

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Link
                  href="/citizen/shelters"
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Find Designated Shelters in this Area</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/citizen/emergency"
                  className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Request Emergency SOS Assistance</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
