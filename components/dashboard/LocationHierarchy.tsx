'use client';

import React from 'react';
import { Layers, Search, ChevronRight, MapPin } from 'lucide-react';
import { LocationItem } from '@/lib/types';
import { 
  INDIA_STATES, 
  INDIA_DISTRICTS, 
  INDIA_BLOCKS, 
  INDIA_VILLAGES 
} from '@/lib/data/indiaLocations';

interface LocationHierarchyProps {
  selectedState: LocationItem | null;
  selectedDistrict: LocationItem | null;
  selectedBlock: LocationItem | null;
  selectedVillage: LocationItem | null;
  onSelectState: (state: LocationItem) => void;
  onSelectDistrict: (district: LocationItem) => void;
  onSelectBlock: (block: LocationItem) => void;
  onSelectVillage: (village: LocationItem) => void;
}

export const LocationHierarchy: React.FC<LocationHierarchyProps> = ({
  selectedState,
  selectedDistrict,
  selectedBlock,
  selectedVillage,
  onSelectState,
  onSelectDistrict,
  onSelectBlock,
  onSelectVillage,
}) => {
  const districts = selectedState ? INDIA_DISTRICTS[selectedState.id] || [] : [];
  const blocks = selectedDistrict ? INDIA_BLOCKS[selectedDistrict.id] || [] : [];
  const villages = selectedBlock ? INDIA_VILLAGES[selectedBlock.id] || [] : [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-sky-600" />
          Location Hierarchy
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. State Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">State</label>
          <select
            value={selectedState?.id || ''}
            onChange={(e) => {
              const st = INDIA_STATES.find((s) => s.id === e.target.value);
              if (st) onSelectState(st);
            }}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">Select State</option>
            {INDIA_STATES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. District Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">District</label>
          <select
            value={selectedDistrict?.id || ''}
            disabled={districts.length === 0}
            onChange={(e) => {
              const dt = districts.find((d) => d.id === e.target.value);
              if (dt) onSelectDistrict(dt);
            }}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select District</option>
            {districts.map((dt) => (
              <option key={dt.id} value={dt.id}>
                {dt.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Block Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Block</label>
          <select
            value={selectedBlock?.id || ''}
            disabled={blocks.length === 0}
            onChange={(e) => {
              const bl = blocks.find((b) => b.id === e.target.value);
              if (bl) onSelectBlock(bl);
            }}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select Block</option>
            {blocks.map((bl) => (
              <option key={bl.id} value={bl.id}>
                {bl.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Village Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Village / Ward</label>
          <select
            value={selectedVillage?.id || ''}
            disabled={villages.length === 0}
            onChange={(e) => {
              const vl = villages.find((v) => v.id === e.target.value);
              if (vl) onSelectVillage(vl);
            }}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select Village/Ward</option>
            {villages.map((vl) => (
              <option key={vl.id} value={vl.id}>
                {vl.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Active Selection Breadcrumb */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-600">
        <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
        <span className="font-semibold text-slate-800">Target Focus:</span>
        <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-medium border border-sky-200">
          {selectedState?.name}
        </span>
        {selectedDistrict && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-medium border border-sky-200">
              {selectedDistrict.name}
            </span>
          </>
        )}
        {selectedBlock && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-medium border border-sky-200">
              {selectedBlock.name}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
