'use client';

import React, { useState } from 'react';
import { 
  Radio, 
  Navigation, 
  MapPin, 
  LifeBuoy, 
  Users
} from 'lucide-react';
import { ResponseUnit, SosCall } from '@/lib/types';
import { DataBadge } from '../common/DataBadge';

interface ResponsePortalViewProps {
  initialUnits?: ResponseUnit[];
  initialSos?: SosCall[];
}

export const ResponsePortalView: React.FC<ResponsePortalViewProps> = ({
  initialUnits = [],
  initialSos = [],
}) => {
  const [units, setUnits] = useState<ResponseUnit[]>(initialUnits);
  const [activeSos, setActiveSos] = useState<SosCall[]>(initialSos);

  const toggleUnitStatus = (unitId: string, newStatus: ResponseUnit['status']) => {
    setUnits(prev =>
      prev.map(u => (u.id === unitId ? { ...u, status: newStatus } : u))
    );
  };

  return (
    <div className="max-w-[1700px] mx-auto p-4 space-y-6">
      
      {/* Response Hero Header */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-600 rounded-xl shadow-lg border border-amber-400">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">
                NDRF / SDRF Emergency Response Fleet Operations
              </h1>
              <DataBadge label={units.length > 0 ? "TACTICAL FEED" : "0 ACTIVE FLEET"} variant={units.length > 0 ? "live" : "offline"} />
            </div>
            <p className="text-xs text-slate-400">
              Real-time rescue unit status, boat telemetry, and dispatch routing control.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Active Rescue Units</span>
            <span className="text-lg font-black text-amber-400">{units.length} Units</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Response Fleet List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-amber-600" />
                Fleet Units Roster
              </h2>
              <span className="text-[10px] text-slate-500 font-medium">{units.length} Active Units</span>
            </div>

            {units.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-1">
                <Navigation className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Active Fleet Units</p>
                <p className="text-[11px] text-slate-500">No response units currently logged in.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-black text-slate-900">{unit.name}</h3>
                        <span className="text-[10px] text-slate-500 font-medium">{unit.type.replace('_', ' ')}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                          unit.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : unit.status === 'EN_ROUTE'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-sky-100 text-sky-800 border-sky-300'
                        }`}
                      >
                        {unit.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-200/80 pt-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Team Size: {unit.teamSize} Personnel
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Tactical Dispatch Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <LifeBuoy className="w-4 h-4 text-red-600" />
                Pending Dispatch & Rescue Routing Queue
              </h2>
              <DataBadge label={activeSos.length > 0 ? "LIVE QUEUE" : "QUEUE EMPTY"} variant={activeSos.length > 0 ? "live" : "offline"} />
            </div>

            {activeSos.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-1">
                <LifeBuoy className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Dispatch Queue Empty</p>
                <p className="text-[11px] text-slate-500">No pending emergency distress calls awaiting dispatch.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSos.map((sos) => (
                  <div
                    key={sos.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{sos.citizenName}</span>
                          <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
                            {sos.peopleCount} Evacuees
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-sky-600" />
                          {sos.address}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400 block">{sos.timestamp}</span>
                        <span className="text-xs font-bold text-slate-800">{sos.phone}</span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700">
                      <strong className="text-slate-900">Distress Situation:</strong> {sos.details}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
