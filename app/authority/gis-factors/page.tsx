'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { Sliders, HelpCircle, Info, Database, AlertCircle, FileCheck2 } from 'lucide-react';
import factorsMetadata from '@/gis/metadata/factors_metadata.json';

export default function GisFactorsPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="authority" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="authority" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-5 space-y-5 max-w-[1400px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sky-600" />
                11-Factor GIS Data Pipeline & Metadata Registry
              </h1>
              <p className="text-xs text-slate-500">
                Data format, resolution, data source, and validation status for all 11 static flood-susceptibility factors.
              </p>
            </div>
            <DataBadge label="METADATA REGISTRY" variant="offline" />
          </div>

          {/* Missing Dataset Connection Warning Banner */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs font-bold text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-amber-950 font-bold block text-sm">GIS Pipeline Status: Awaiting Verified Datasets</strong>
              <p className="font-semibold text-amber-800 leading-relaxed">
                Source not connected — awaiting verified dataset. Raw SRTM/NASADEM DEMs and GeoJSON vector layers must be placed in <code>gis/data/raw/</code> and processed via <code>gis/scripts/</code> before live factor extraction.
              </p>
            </div>
          </div>

          {/* Factors Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {factorsMetadata.factors.map((factor, idx) => (
              <div
                key={factor.key}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      Factor #{idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded uppercase">
                      {factor.status}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 mt-2 flex items-center justify-between">
                    <span>{factor.name}</span>
                    <span className="text-xs font-mono font-bold text-slate-500">({factor.unit})</span>
                  </h3>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                    {factor.meaning}
                  </p>

                  <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Format:</span>
                      <span className="font-bold text-slate-800">{factor.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Validation:</span>
                      <span className="font-bold text-slate-800">{factor.validation_rule}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1 font-semibold text-amber-800">
                    <Database className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{factor.data_source}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-sky-600" />
              GIS Preprocessing Workflow & Verification Criteria
            </h3>
            <p className="text-slate-600 leading-relaxed">
              1. Load DEM and vector datasets into <code>gis/data/raw/</code> → 2. Reproject to EPSG:4326 → 3. Resample to 30m resolution → 4. Compute slope, aspect, curvature, TWI, and SPI rasters in <code>gis/data/processed/</code> → 5. Run <code>python gis/scripts/validate_dataset.py</code> to verify zero NoData gaps.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
