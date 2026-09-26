'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  CircleDot, 
  Layers, 
  Globe, 
  Sliders, 
  ShieldCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { dataQualityService, DataQualityReport } from '@/lib/services/dataQualityService';

export default function DataQualityPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await dataQualityService.getDataQualityReport();
      setReport(data);
    } catch (e) {
      console.error('Failed to load data quality report:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ✓ Validated & Connected
          </span>
        );
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            ✓ Available (Unconnected)
          </span>
        );
      case 'validation_required':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            ⚠ Validation Required
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            ✕ Invalid / Unavailable
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
            <CircleDot className="w-3.5 h-3.5 text-slate-400" />
            ○ Not Connected
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="authority" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="authority" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-5 space-y-6 max-w-[1700px] mx-auto w-full">
          
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Database className="w-6 h-6 text-sky-600" />
                  Central Data Quality & Source Health Dashboard
                </h1>
                <DataBadge label="PROVENANCE AUDIT" variant="live" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit real spatial datasets, CRS projections, spatial resolutions, and factor dependencies.
              </p>
            </div>

            <button
              onClick={fetchReport}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Audit</span>
            </button>
          </div>

          {/* Overview Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered Sources</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{report?.total_sources || 0}</span>
              <span className="text-[10px] text-slate-500 font-medium">Grounded Providers</span>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Connected Datasets</span>
              <span className="text-2xl font-black text-emerald-900 mt-1 block">{report?.connected_sources || 0}</span>
              <span className="text-[10px] text-emerald-700 font-medium">Active Ingestion</span>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Available Datasets</span>
              <span className="text-2xl font-black text-blue-900 mt-1 block">{report?.available_sources || 0}</span>
              <span className="text-[10px] text-blue-700 font-medium">Ready to Load</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Missing / Unconnected</span>
              <span className="text-2xl font-black text-slate-700 mt-1 block">{report?.missing_sources || 0}</span>
              <span className="text-[10px] text-slate-500 font-medium">Awaiting Setup</span>
            </div>

            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Validation Required</span>
              <span className="text-2xl font-black text-amber-900 mt-1 block">{report?.invalid_sources || 0}</span>
              <span className="text-[10px] text-amber-700 font-medium">CRS / Extent Check</span>
            </div>
          </div>

          {/* 11 GIS Factors Data Readiness Dependency Matrix */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sky-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  11-Factor GIS Data Dependency & Readiness Matrix
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">Derived factors locked until parent source is validated</span>
            </div>

            {report?.factor_readiness ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(report.factor_readiness).map(([key, item]) => (
                  <div key={key} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-black text-slate-900">{item.factor_name}</h3>
                        <span className="text-[10px] text-slate-500 font-medium">Category: {item.category}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          item.status === 'READY'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-200/60">
                      <p>Parent Dataset: <strong className="text-slate-800">{item.parent_dataset}</strong></p>
                      <p className="text-[10px] text-slate-500">{item.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Loading readiness matrix...</p>
            )}
          </div>

          {/* Central Data Source Registry Roster Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Registered External & Internal Spatial Data Sources
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">Traceable Provider Registry</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                    <th className="p-3">Source & Dataset Name</th>
                    <th className="p-3">Organization / Provider</th>
                    <th className="p-3">Type & Format</th>
                    <th className="p-3">Resolution & Coverage</th>
                    <th className="p-3">Access Method</th>
                    <th className="p-3">Validation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {report?.dataset_sources.map((src) => (
                    <tr key={src.source_id} className="hover:bg-slate-50/80 transition-all">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{src.source_name}</span>
                        <span className="text-[10px] text-slate-500">{src.dataset_name}</span>
                      </td>
                      <td className="p-3 font-medium text-slate-800">
                        {src.provider}
                      </td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold block w-fit">
                          {src.data_type.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-500">{src.format}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800 block">{src.spatial_resolution}</span>
                        <span className="text-[10px] text-slate-500">{src.geographic_coverage}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">
                        {src.access_method}
                      </td>
                      <td className="p-3">
                        {getStatusBadge(src.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
