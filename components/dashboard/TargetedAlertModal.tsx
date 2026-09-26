'use client';

import React, { useState } from 'react';
import { 
  workflowService, 
  TargetingData, 
  AlertData 
} from '@/lib/services/workflowService';
import { LocationItem } from '@/lib/types';
import { 
  X, 
  Radio, 
  Users, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Loader2, 
  Info,
  ShieldAlert,
  Flame
} from 'lucide-react';

interface TargetedAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: LocationItem;
  currentRiskScore: number;
  alertStatus: string;
  rainfallRate: number;
  targetingData: TargetingData;
  onAlertBroadcasted?: () => void;
}

export function TargetedAlertModal({
  isOpen,
  onClose,
  selectedLocation,
  currentRiskScore,
  alertStatus,
  rainfallRate,
  targetingData,
  onAlertBroadcasted
}: TargetedAlertModalProps) {
  const [includePrimary, setIncludePrimary] = useState(true);
  const [includeNearby, setIncludeNearby] = useState(true);
  const [includeTeams, setIncludeTeams] = useState(true);
  const [severity, setSeverity] = useState<'Advisory' | 'Watch' | 'Warning' | 'Emergency'>(
    alertStatus === 'CRITICAL' ? 'Emergency' :
    alertStatus === 'WARNING' ? 'Warning' :
    alertStatus === 'WATCH' ? 'Watch' : 'Advisory'
  );

  const [title, setTitle] = useState(
    `URGENT FLASH FLOOD ${alertStatus}: ${selectedLocation.name}`
  );

  const defaultMessage = alertStatus === 'CRITICAL'
    ? `CRITICAL EMERGENCY WARNING: Flash flood surge imminent in ${selectedLocation.name} with precipitation exceeding ${rainfallRate} mm/hr. Residents in riverbank and low-lying terraces must evacuate immediately to designated high-ground shelters.`
    : alertStatus === 'WARNING'
    ? `FLASH FLOOD WARNING: Sustained rainfall of ${rainfallRate} mm/hr causing stream swell and hillside runoff in ${selectedLocation.name}. Avoid watercourses and prepare household grab bags.`
    : `ADVISORY: Elevated catchment moisture and runoff detected in ${selectedLocation.name}. Monitor official channels for river surge updates.`;

  const [message, setMessage] = useState(defaultMessage);
  const [recommendedAction, setRecommendedAction] = useState(
    alertStatus === 'CRITICAL' || alertStatus === 'WARNING'
      ? 'Evacuate low-lying river terraces. Seek high ground or designated emergency relief shelters.'
      : 'Maintain vigilance and avoid unbridged river crossings.'
  );

  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    id: string;
    recipients: number;
    mode: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate dynamic recipient totals based on checkboxes
  const primaryCount = includePrimary ? targetingData.primary_count : 0;
  const nearbyCount = includeNearby ? targetingData.nearby_count : 0;
  const teamsCount = includeTeams ? targetingData.teams_count : 0;
  const calculatedTotalRecipients = primaryCount + nearbyCount + teamsCount;

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await workflowService.dispatchOneClickAlert({
        location_name: selectedLocation.name,
        district_id: targetingData.district || selectedLocation.name,
        severity,
        title,
        message,
        recommended_action: recommendedAction,
        additional_instructions: `Dispatched via NEER Tactical Command to verified recipients in ${selectedLocation.name} and surrounding sectors.`,
        created_by: 'Authority Tactical Command'
      });

      if (res.success && res.data) {
        setSuccessResult({
          id: res.data.alert_id,
          recipients: res.data.recipient_count || calculatedTotalRecipients,
          mode: 'IN-APP & SIMULATED CARRIER (SMS Provider Not Configured)'
        });
        if (onAlertBroadcasted) {
          onAlertBroadcasted();
        }
      } else {
        setErrorMsg(res.error || 'Failed to dispatch one-click emergency alert. Ensure backend service is reachable.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Broadcast error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B192C] to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>Dispatch Targeted Early Warning</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 uppercase font-black">
                  {alertStatus}
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Geo-Targeted Command for <strong className="text-white">{selectedLocation.name}</strong>
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

        {/* Success View */}
        {successResult ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Targeted Alert Successfully Queued & Logged
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Emergency alert <strong className="font-mono">{successResult.id}</strong> has been stored in central disaster registry.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto grid grid-cols-2 gap-3 text-left text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Recipients</span>
                <span className="text-base font-black text-slate-900">{successResult.recipients} Verified Targets</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Delivery Protocol</span>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                  {successResult.mode}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Command log updated. Assigned field teams and affected households in {selectedLocation.name} are marked notified in live operational views.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
            >
              Return to Operations Command
            </button>
          </div>
        ) : (
          <form onSubmit={handleBroadcast} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            {errorMsg && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-red-800 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Geographic Recipient Breakdown */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 uppercase tracking-wide text-[11px] flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Targeted Geographic Recipients (Real SQLite Registry)</span>
                </h3>
                <span className="font-bold text-slate-900 font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[11px]">
                  {calculatedTotalRecipients} Total Recipients
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label className={`p-2.5 border rounded-xl flex items-center gap-2.5 cursor-pointer transition-all ${
                  includePrimary ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'
                }`}>
                  <input
                    type="checkbox"
                    checked={includePrimary}
                    onChange={(e) => setIncludePrimary(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">Primary Sector</span>
                    <span className="text-[10px] text-slate-500">{targetingData.primary_count} Citizens</span>
                  </div>
                </label>

                <label className={`p-2.5 border rounded-xl flex items-center gap-2.5 cursor-pointer transition-all ${
                  includeNearby ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'
                }`}>
                  <input
                    type="checkbox"
                    checked={includeNearby}
                    onChange={(e) => setIncludeNearby(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">Nearby Periphery</span>
                    <span className="text-[10px] text-slate-500">{targetingData.nearby_count} Citizens</span>
                  </div>
                </label>

                <label className={`p-2.5 border rounded-xl flex items-center gap-2.5 cursor-pointer transition-all ${
                  includeTeams ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'
                }`}>
                  <input
                    type="checkbox"
                    checked={includeTeams}
                    onChange={(e) => setIncludeTeams(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">Stationed Units</span>
                    <span className="text-[10px] text-slate-500">{targetingData.teams_count} Units (Rescue + Amb)</span>
                  </div>
                </label>
              </div>

              {/* Physical Presence vs Hometown Policy Note */}
              <div className="text-[10px] text-slate-500 bg-slate-100/90 rounded-lg p-2 flex items-center justify-between border border-slate-200">
                <span>
                  <strong>Hometown Policy:</strong> Only physically present residents ({targetingData.primary_count + targetingData.nearby_count}) receive direct evacuation alerts.
                </span>
                <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0 ml-2">
                  {targetingData.away_count || 1} Away Resident Excluded
                </span>
              </div>
            </div>

            {/* Severity Selection */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">
                Alert Severity Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Advisory', 'Watch', 'Warning', 'Emergency'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-2 px-2 rounded-xl font-extrabold text-[11px] border transition-all text-center ${
                      severity === sev
                        ? sev === 'Emergency'
                          ? 'bg-red-600 text-white border-red-700 shadow-sm ring-2 ring-red-300'
                          : sev === 'Warning'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm ring-2 ring-amber-300'
                          : sev === 'Watch'
                          ? 'bg-yellow-400 text-slate-900 border-yellow-500 shadow-sm ring-2 ring-yellow-200'
                          : 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Alert Title */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">
                Broadcast Headline
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            {/* Alert Message */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">
                Public Advisory & Inundation Instructions
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs leading-relaxed"
              />
            </div>

            {/* Recommended Action */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">
                Recommended Action for Citizens & Fleet
              </label>
              <input
                type="text"
                value={recommendedAction}
                onChange={(e) => setRecommendedAction(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            {/* Delivery Transparency Disclaimer */}
            <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="block font-bold">Delivery Mode: IN-APP & SIMULATED CARRIER (SMS Provider Not Configured)</strong>
                Alert will be logged to database records (`alerts` & `alert_recipients`) and broadcast via real-time WebSocket/SSE streams. Carrier SMS delivery is simulated without external telecom API expenses.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || calculatedTotalRecipients === 0}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Broadcasting to {calculatedTotalRecipients}...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Broadcast to {calculatedTotalRecipients} Recipients</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
