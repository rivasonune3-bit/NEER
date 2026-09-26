'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { ListTodo, CheckCircle2, Clock, MapPin, AlertTriangle, Camera, Upload, Send } from 'lucide-react';
import { evidenceService } from '@/lib/services/evidenceService';

export default function ResponseRescueTasksPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [activeTaskIndex, setActiveTaskIndex] = useState<number | null>(null);
  const [fieldNote, setFieldNote] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const [assignedRescueTasks, setAssignedRescueTasks] = useState([
    { id: 'task-1', title: 'Deploy Motorboat Rig 4 to Bhorolu Riverbank', status: 'IN_PROGRESS', priority: 'HIGH', location: 'Guwahati East', lat: 26.1800, lng: 91.7800 },
    { id: 'task-2', title: 'Air-drop Medical Kits & Dry Food Rations', status: 'PENDING', priority: 'CRITICAL', location: 'Chooralmala Hamlet, Wayanad', lat: 11.5430, lng: 76.1380 },
    { id: 'task-3', title: 'Evacuate Elderly Residents from Floodplain House #42', status: 'IN_PROGRESS', priority: 'CRITICAL', location: 'Hatsingimari Village', lat: 26.1950, lng: 91.7750 },
  ]);

  const handleFieldReportSubmit = (taskId: string, locationName: string, lat: number, lng: number) => {
    evidenceService.addEvidence({
      source: 'RESPONSE_FLEET',
      uploaderName: '1st NDRF Battalion Alpha Team',
      incidentId: taskId,
      locationName: locationName,
      lat: lat,
      lng: lng,
      description: `[RESPONSE FLEET REPORT] ${fieldNote || 'Evacuation operation in progress. Water level monitored.'}`,
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80'
    });

    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setActiveTaskIndex(null);
      setFieldNote('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <SystemStatusBanner />
      <Header currentRole="response" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="response" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-5 max-w-[1200px] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-amber-600" />
                Active Rescue Task Assignments
              </h1>
              <p className="text-xs text-slate-500">
                Actionable field operational tasks assigned to boat crews and medical teams.
              </p>
            </div>
            <DataBadge label="FLEET PORTAL" variant="live" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assignedRescueTasks.map((t, idx) => (
              <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{t.id}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 uppercase">
                      {t.priority}
                    </span>
                  </div>

                  <h3 className="text-xs font-black text-slate-900 leading-snug">{t.title}</h3>

                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-sky-600" /> {t.location}
                  </p>
                </div>

                <div className="pt-2 border-t space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-700">{t.status.replace('_', ' ')}</span>
                    <button
                      onClick={() => setActiveTaskIndex(activeTaskIndex === idx ? null : idx)}
                      className="py-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Camera className="w-3 h-3 text-sky-400" />
                      <span>Upload Field Evidence</span>
                    </button>
                  </div>

                  {activeTaskIndex === idx && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                      <span className="font-bold text-slate-800 block text-[11px] uppercase">
                        Response Fleet Field Report (source = RESPONSE_FLEET)
                      </span>
                      <textarea
                        rows={2}
                        placeholder="Type field situation update or rescue outcome..."
                        value={fieldNote}
                        onChange={(e) => setFieldNote(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-500">Photo attached automatically</span>
                        <button
                          onClick={() => handleFieldReportSubmit(t.id, t.location, t.lat, t.lng)}
                          className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded flex items-center gap-1 shadow-sm"
                        >
                          <Send className="w-3 h-3" />
                          <span>Submit Field Report</span>
                        </button>
                      </div>
                      {reportSubmitted && (
                        <p className="text-[11px] text-emerald-700 font-bold bg-emerald-100 p-1.5 rounded text-center">
                          Field evidence transmitted to Command Desk!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
