'use client';

import React from 'react';
import { CitizenData, IncidentData } from '@/lib/services/workflowService';
import { 
  X, 
  Users, 
  MapPin, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  HeartPulse,
  Home
} from 'lucide-react';

interface CitizensListModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  citizens: CitizenData[];
  activeIncidents?: IncidentData[];
  riskLevel?: string;
}

export function CitizensListModal({
  isOpen,
  onClose,
  locationName,
  citizens,
  activeIncidents = [],
  riskLevel = 'WARNING'
}: CitizensListModalProps) {
  if (!isOpen) return null;

  // Determine SOS status for each citizen
  const citizenSosMap = new Map<string, IncidentData>();
  activeIncidents.forEach(inc => {
    if (inc.reported_by) {
      citizenSosMap.set(inc.reported_by.toLowerCase().trim(), inc);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#0B192C] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>Verified Registered Population</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-900/80 text-blue-200 border border-blue-700">
                  {citizens.length} Citizens
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Target Sector: <strong className="text-white">{locationName}</strong> • Real GIS & Civil Registry Data
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <strong>Verified DB Store:</strong> Real SQLite population records
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <strong>Active SOS:</strong> {activeIncidents.length} Distress Signal(s)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Current Flood Risk:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              riskLevel === 'CRITICAL' ? 'bg-red-600 text-white' :
              riskLevel === 'WARNING' ? 'bg-amber-500 text-slate-950' :
              riskLevel === 'WATCH' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
            }`}>
              {riskLevel}
            </span>
          </div>
        </div>

        {/* Citizens Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {citizens.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Registered Citizens in Selected Location</p>
              <p className="text-xs text-slate-500">
                Switch location to Chamoli, Raini, or Tapovan to view verified registered households.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-3">Citizen / Household</th>
                    <th className="py-2.5 px-3">Settlement / Ward</th>
                    <th className="py-2.5 px-3">Family Size</th>
                    <th className="py-2.5 px-3">Medical / Special Needs</th>
                    <th className="py-2.5 px-3 text-center">Distress / SOS</th>
                    <th className="py-2.5 px-3 text-right">Emergency Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {citizens.map((citizen) => {
                    const activeSos = citizenSosMap.get(citizen.name.toLowerCase().trim());
                    return (
                      <tr 
                        key={citizen.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          activeSos ? 'bg-red-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{citizen.name}</span>
                            {activeSos && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-600 text-white animate-pulse">
                                SOS
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {citizen.phone || 'Phone unlisted'}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-700">
                          <div className="font-semibold flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{citizen.village || citizen.block || locationName}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                            {citizen.address}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-700">
                          <span className="font-mono font-bold">{citizen.family_count || 1}</span> members
                        </td>

                        <td className="py-3 px-3">
                          {citizen.medical_needs && citizen.medical_needs !== 'None' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                              <HeartPulse className="w-3 h-3 text-red-500 shrink-0" />
                              <span className="truncate max-w-[180px]">{citizen.medical_needs}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">None reported</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {activeSos ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black bg-red-100 text-red-800 border border-red-300">
                              <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                              ACTIVE SOS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Normal
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right text-slate-600 font-mono text-[11px]">
                          {citizen.emergency_contacts ? (
                            <span>{citizen.emergency_contacts}</span>
                          ) : (
                            <span className="text-slate-400">Local Panchayat</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Sourced strictly from NEER Disaster Management SQLite Database</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
