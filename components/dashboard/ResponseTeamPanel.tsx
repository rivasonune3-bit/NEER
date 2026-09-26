'use client';

import React, { useState } from 'react';
import { Radio, Users } from 'lucide-react';
import { ResponseUnit } from '@/lib/types';
import { DataBadge } from '../common/DataBadge';

interface ResponseTeamPanelProps {
  units?: ResponseUnit[];
}

export const ResponseTeamPanel: React.FC<ResponseTeamPanelProps> = ({
  units = [],
}) => {
  const [fleet, setFleet] = useState<ResponseUnit[]>(units);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Response Team Status
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">NDRF / SDRF Fleet Readiness</p>
            </div>
          </div>
          <DataBadge label={fleet.length > 0 ? "LIVE FLEET" : "0 TEAMS REGISTERED"} variant={fleet.length > 0 ? "live" : "offline"} />
        </div>

        {/* Fleet Roster or Empty State */}
        {fleet.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center space-y-1">
            <Radio className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Teams Registered</p>
            <p className="text-[11px] text-slate-500">No emergency response units have logged active duty status in the fleet registry.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fleet.map((unit) => (
              <div
                key={unit.id}
                className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-900">{unit.name}</h3>
                    <span className="text-[10px] text-slate-500 font-medium">{unit.type.replace('_', ' ')}</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
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

                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    Team Size: {unit.teamSize} Personnel
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {unit.contactNumber}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium flex items-center justify-end">
        <span className="font-bold text-slate-700">{fleet.length} Units Active</span>
      </div>
    </div>
  );
};
