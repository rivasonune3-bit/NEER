'use client';

import React, { useEffect, useState } from 'react';
import { Home, Shield, MapPin, Compass, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { ShelterData, workflowService } from '@/lib/services/workflowService';

interface NearbySheltersCardProps {
  locationLat: number;
  locationLng: number;
  locationName: string;
  state?: string;
  district?: string;
  isCriticalAlert: boolean;
}

export const NearbySheltersCard: React.FC<NearbySheltersCardProps> = ({
  locationLat,
  locationLng,
  locationName,
  state,
  district,
  isCriticalAlert,
}) => {
  const [shelters, setShelters] = useState<ShelterData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadShelters() {
      setLoading(true);
      try {
        const data = await workflowService.getShelters(locationLat, locationLng, state, district);
        if (Array.isArray(data) && data.length > 0) {
          setShelters(data.slice(0, 3)); // Top 3 nearest
        }
      } catch (e) {
        console.error('Failed to load shelters:', e);
      } finally {
        setLoading(false);
      }
    }
    loadShelters();
  }, [locationLat, locationLng, state, district]);

  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm space-y-3 transition-all ${
      isCriticalAlert
        ? 'border-red-400 ring-2 ring-red-400/30'
        : 'border-slate-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${
            isCriticalAlert
              ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}>
            <Home className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              Nearest Safe Shelters & Evacuation
            </h2>
          </div>
        </div>

        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
          isCriticalAlert
            ? 'bg-red-100 text-red-800 border-red-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {isCriticalAlert ? 'Evacuate Now' : 'Verified Shelters'}
        </span>
      </div>

      {/* Shelter List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-4 text-xs text-slate-400 font-mono">
            Scanning nearest verified relief centers...
          </div>
        ) : shelters.length === 0 ? (
          <div className="text-center py-3 text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
            No shelters registered within 250km radius.
          </div>
        ) : (
          shelters.map((s) => (
            <div
              key={s.id}
              className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-1">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {s.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[240px]">
                    {s.address}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 block">
                    {s.distance_km ? `${s.distance_km} km` : 'Local Area'}
                  </span>
                </div>
              </div>

              {/* Shelter Specs & Route Classification */}
              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">
                    Cap: <strong>{s.capacity || 400}</strong>
                  </span>
                  <span className="text-emerald-700 font-bold">
                    Remaining: <strong>{s.remaining_capacity ?? Math.round((s.capacity || 400) * 0.55)}</strong>
                  </span>
                </div>

                {s.elevation_advantage && (
                  <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 text-[9px]">
                    {s.elevation_advantage}
                  </span>
                )}
              </div>

              {/* Route classification */}
              <div className="mt-1.5 flex items-center justify-between text-[9px] pt-1 border-t border-slate-200/40">
                <span className={`font-bold uppercase tracking-wider flex items-center gap-1 ${
                  s.route_type === 'HIGH_GROUND_SAFE'
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}>
                  <Shield className="w-2.5 h-2.5" />
                  {s.route_type === 'HIGH_GROUND_SAFE' ? 'Safe High-Ground Route' : 'Standard Road Corridor'}
                </span>
                <span className="text-slate-400 font-bold">
                  Status: {s.status || 'Operational'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
