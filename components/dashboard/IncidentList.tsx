'use client';

import React, { useState, useEffect } from 'react';
import { LifeBuoy, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import { SosCall } from '@/lib/types';
import { DataBadge } from '../common/DataBadge';
import { workflowService } from '@/lib/services/workflowService';

interface IncidentListProps {
  incidents?: SosCall[];
  onResolve?: (id: string) => void;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents = [],
  onResolve
}) => {
  const [sosList, setSosList] = useState<SosCall[]>(incidents);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    setSosList(incidents);
  }, [incidents]);

  const handleEvacuate = async (id: string) => {
    setResolvingId(id);
    try {
      if (onResolve) {
        onResolve(id);
      } else {
        await workflowService.closeIncident(id);
      }
      setSosList(prev =>
        prev.map(s => (s.id === id ? { ...s, status: 'RESCUED' as const } : s))
      );
    } catch (err) {
      console.error('Failed to resolve SOS incident:', err);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Open Emergency Incidents
              </h2>
            </div>
          </div>
          <DataBadge label={sosList.length > 0 ? "LIVE INCIDENTS" : "0 OPEN INCIDENTS"} variant={sosList.length > 0 ? "live" : "offline"} />
        </div>

        {/* Incidents List or Empty State */}
        {sosList.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center space-y-1">
            <LifeBuoy className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Open Incidents</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sosList.map((sos) => (
              <div
                key={sos.id}
                className={`border rounded-lg p-3 transition-all ${
                  sos.status === 'RESCUED'
                    ? 'bg-emerald-50/50 border-emerald-200 opacity-65'
                    : 'bg-red-50/40 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-slate-900">{sos.citizenName}</span>
                      <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded">
                        {sos.peopleCount} Trapped
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium mt-1">
                      {sos.details}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" />
                      {sos.address}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {sos.status === 'RESCUED' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Rescued
                      </span>
                    ) : (
                      <button
                        onClick={() => handleEvacuate(sos.id)}
                        disabled={resolvingId === sos.id}
                        className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        {resolvingId === sos.id && <Loader2 className="w-3 h-3 animate-spin" />}
                        <span>Resolve SOS</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
