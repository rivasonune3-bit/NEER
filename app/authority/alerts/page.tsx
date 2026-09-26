'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import {
  Flame, AlertTriangle, Clock, MapPin, Plus, CheckCircle, X, Send, Eye,
  ShieldCheck, Layers, ArrowRight, ArrowLeft, Info, Link as LinkIcon
} from 'lucide-react';
import { INDIA_STATES, INDIA_DISTRICTS, INDIA_BLOCKS, INDIA_VILLAGES } from '@/lib/data/indiaLocations';
import { AlertData } from '@/lib/services/workflowService';

export default function AlertsManagementPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  const [alertsList, setAlertsList] = useState<AlertData[]>([
    {
      id: 'ALT-2026-001',
      title: 'RED ALERT: River Inundation & Flashflood Warning',
      message: 'Brahmaputra river level rising rapidly above danger mark. Immediate evacuation advised for low-lying blocks.',
      severity: 'Emergency',
      alert_type: 'configured_trigger',
      state_id: 'st-as',
      district_id: 'dt-km',
      location_name: 'Guwahati Metro, Kamrup, Assam',
      created_by: 'NDMA Regional Command',
      created_at: '17 Sep 2026, 02:00 IST',
      start_time: '17 Sep 2026, 02:00 IST',
      expiry_time: '18 Sep 2026, 02:00 IST',
      recommended_action: 'Relocate to designated multi-purpose flood shelters immediately.',
      additional_instructions: 'Keep emergency kit and dry food rations ready.',
      status: 'Active',
      linked_incident_id: 'INC-2026-101'
    },
    {
      id: 'ALT-2026-002',
      title: 'ORANGE WATCH: Heavy Rainfall Persistence',
      message: 'Monsoon precipitation intensity exceeding 45 mm/hr in coastal catchment zones.',
      severity: 'Watch',
      alert_type: 'environmental_condition',
      state_id: 'st-mh',
      district_id: 'dt-mb',
      location_name: 'Mumbai Suburban, Maharashtra',
      created_by: 'State Disaster Authority',
      created_at: '17 Sep 2026, 01:30 IST',
      start_time: '17 Sep 2026, 01:30 IST',
      expiry_time: '18 Sep 2026, 01:30 IST',
      recommended_action: 'Avoid underpasses and low-lying transit corridors.',
      status: 'Active'
    }
  ]);

  // Modal & Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedAlertDetails, setSelectedAlertDetails] = useState<AlertData | null>(null);

  // Form Fields
  const [alertType, setAlertType] = useState('manual_authority_alert');
  const [stateId, setStateId] = useState('st-as');
  const [districtId, setDistrictId] = useState('dt-km');
  const [blockId, setBlockId] = useState('');
  const [villageId, setVillageId] = useState('');
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'Advisory' | 'Watch' | 'Warning' | 'Emergency'>('Warning');
  const [recommendedAction, setRecommendedAction] = useState('Relocate to high ground if in low-lying area.');
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  const districts = INDIA_DISTRICTS[stateId] || [];
  const blocks = INDIA_BLOCKS[districtId] || [];
  const villages = INDIA_VILLAGES[blockId] || [];

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (wizardStep < 5) setWizardStep(wizardStep + 1);
  };

  const handleApproveAndActivate = () => {
    const matchedState = INDIA_STATES.find(s => s.id === stateId)?.name || 'State';
    const matchedDistrict = districts.find(d => d.id === districtId)?.name || '';

    const newAlert: AlertData = {
      id: `ALT-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: title || 'Emergency Flood Advisory',
      message: message || 'Heavy rainfall and rising waters detected.',
      severity,
      alert_type: alertType,
      state_id: stateId,
      district_id: districtId,
      block_id: blockId || undefined,
      village_id: villageId || undefined,
      location_name: `${matchedDistrict}, ${matchedState}`,
      created_by: 'NDMA Authority Admin',
      created_at: new Date().toLocaleTimeString() + ' IST',
      start_time: new Date().toLocaleTimeString() + ' IST',
      expiry_time: '24 Hours',
      recommended_action: recommendedAction,
      additional_instructions: additionalInstructions,
      status: 'Active'
    };

    setAlertsList([newAlert, ...alertsList]);
    setShowWizard(false);
    setWizardStep(1);
    setTitle('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="authority" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="authority" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-5 space-y-5 max-w-[1500px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-600" />
                Alerts & Advisories Command Workflow
              </h1>
              <p className="text-xs text-slate-500">
                Create, review, target, approve, and track operational flood warnings across 4 severity levels.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <DataBadge label="AUTHORITY COMMAND" variant="offline" />
              <button
                onClick={() => { setShowWizard(true); setWizardStep(1); }}
                className="py-2 px-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Alert</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">Alert ID</th>
                  <th className="py-3 px-4">Alert Title</th>
                  <th className="py-3 px-4">Target Location</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Created By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {alertsList.map((alt) => (
                  <tr key={alt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{alt.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{alt.title}</td>
                    <td className="py-3 px-4">{alt.location_name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${
                          alt.severity === 'Emergency'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : alt.severity === 'Warning'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : alt.severity === 'Watch'
                            ? 'bg-sky-100 text-sky-800 border-sky-300'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        {alt.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{alt.alert_type}</td>
                    <td className="py-3 px-4">{alt.created_by}</td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {alt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedAlertDetails(alt)}
                        className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded text-[11px] border border-slate-300"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5-Step Create Alert Wizard Modal */}
          {showWizard && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-4">
                <button onClick={() => setShowWizard(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-red-600" />
                    <h3 className="text-base font-black text-slate-900">Create Alert Advisory (Step {wizardStep}/5)</h3>
                  </div>
                  <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                    Step {wizardStep} of 5
                  </span>
                </div>

                <form onSubmit={handleNextStep} className="space-y-4 text-xs">
                  
                  {/* Step 1: Select Type */}
                  {wizardStep === 1 && (
                    <div className="space-y-3">
                      <label className="block font-bold text-slate-800">Step 1 — Select Alert Trigger Source / Type *</label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { key: 'environmental_condition', label: 'Environmental Condition (Rainfall/River Rise)' },
                          { key: 'flood_susceptibility', label: 'Static Flood Susceptibility GIS Threshold' },
                          { key: 'configured_trigger', label: 'Configured Flood Trigger Rule Breach' },
                          { key: 'incident', label: 'Verified Incident Escalation' },
                          { key: 'manual_authority_alert', label: 'Manual Authority Executive Order' }
                        ].map((t) => (
                          <label key={t.key} className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2 font-medium ${alertType === t.key ? 'bg-sky-50 border-sky-400 text-sky-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                            <input
                              type="radio"
                              name="alertType"
                              value={t.key}
                              checked={alertType === t.key}
                              onChange={(e) => setAlertType(e.target.value)}
                            />
                            <span>{t.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Target Area */}
                  {wizardStep === 2 && (
                    <div className="space-y-3">
                      <label className="block font-bold text-slate-800">Step 2 — Select Geographic Target Level *</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">State</label>
                          <select
                            value={stateId}
                            onChange={(e) => {
                              setStateId(e.target.value);
                              setDistrictId(INDIA_DISTRICTS[e.target.value]?.[0]?.id || '');
                            }}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                          >
                            {INDIA_STATES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-600 mb-1">District</label>
                          <select
                            value={districtId}
                            onChange={(e) => setDistrictId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                          >
                            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Block (Optional)</label>
                          <select
                            value={blockId}
                            onChange={(e) => setBlockId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                          >
                            <option value="">All Blocks in District</option>
                            {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Village (Optional)</label>
                          <select
                            value={villageId}
                            onChange={(e) => setVillageId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                          >
                            <option value="">All Villages in Block</option>
                            {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Alert Content */}
                  {wizardStep === 3 && (
                    <div className="space-y-3">
                      <label className="block font-bold text-slate-800">Step 3 — Advisory Content & Severity *</label>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Alert Headline *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. RED ALERT: Brahmaputra River Level Surge"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Detailed Message *</label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Provide clear public advisory details..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Severity Category *</label>
                          <select
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                          >
                            <option value="Advisory">Advisory (Yellow)</option>
                            <option value="Watch">Watch (Sky)</option>
                            <option value="Warning">Warning (Orange)</option>
                            <option value="Emergency">Emergency (Red)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Recommended Action</label>
                          <input
                            type="text"
                            value={recommendedAction}
                            onChange={(e) => setRecommendedAction(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Preview */}
                  {wizardStep === 4 && (
                    <div className="space-y-3">
                      <label className="block font-bold text-slate-800">Step 4 — Review Alert Preview</label>
                      
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-sm text-slate-900">{title || 'Untitled Alert'}</span>
                          <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-red-100 text-red-800 border border-red-300">
                            {severity}
                          </span>
                        </div>
                        <p className="text-slate-700">{message || 'No description provided.'}</p>
                        <p className="text-slate-500 text-[11px]">Action: {recommendedAction}</p>
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                        Notice: Cell broadcast and push notification dispatch routes are active in-app. External notification gateways remain labeled &quot;Not connected.&quot;
                      </div>
                    </div>
                  )}

                  {/* Step 5: Approval */}
                  {wizardStep === 5 && (
                    <div className="space-y-4 text-center py-3">
                      <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-900">Step 5 — Confirm Authority Approval</h4>
                      <p className="text-slate-600 text-xs">
                        Clicking confirm will mark this alert as <strong className="text-emerald-700">ACTIVE</strong> and dispatch in-app advisories to citizens in the target zone.
                      </p>

                      <button
                        type="button"
                        onClick={handleApproveAndActivate}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all text-xs"
                      >
                        Approve & Activate Alert
                      </button>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  {wizardStep < 5 && (
                    <div className="flex justify-between pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={wizardStep === 1}
                        onClick={() => setWizardStep(wizardStep - 1)}
                        className="py-2 px-3 bg-slate-100 text-slate-700 font-bold rounded-lg disabled:opacity-40"
                      >
                        Previous
                      </button>

                      <button
                        type="submit"
                        className="py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg flex items-center gap-1"
                      >
                        <span>Next Step</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                </form>
              </div>
            </div>
          )}

          {/* Modal: View Details */}
          {selectedAlertDetails && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
                <button onClick={() => setSelectedAlertDetails(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-base font-black text-slate-900 border-b pb-2">Alert Details #{selectedAlertDetails.id}</h3>

                <div className="space-y-2 text-xs text-slate-700">
                  <p><strong>Title:</strong> {selectedAlertDetails.title}</p>
                  <p><strong>Location:</strong> {selectedAlertDetails.location_name}</p>
                  <p><strong>Message:</strong> {selectedAlertDetails.message}</p>
                  <p><strong>Action:</strong> {selectedAlertDetails.recommended_action}</p>
                  <p><strong>Created By:</strong> {selectedAlertDetails.created_by}</p>
                  <p><strong>Status:</strong> {selectedAlertDetails.status}</p>
                </div>

                <div className="flex justify-end pt-2">
                  <button onClick={() => setSelectedAlertDetails(null)} className="py-2 px-4 bg-slate-800 text-white font-bold rounded-lg text-xs">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
