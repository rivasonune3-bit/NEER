'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { useAuth } from '@/lib/auth/AuthContext';
import { workflowService, FieldEvidenceData, IncidentData } from '@/lib/services/workflowService';
import { 
  Camera, 
  Send, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Image as ImageIcon,
  FileText,
  Droplets,
  Truck
} from 'lucide-react';

export default function ResponseFieldReportsPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user } = useAuth();
  
  const [evidenceList, setEvidenceList] = useState<FieldEvidenceData[]>([]);
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form states
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [locationName, setLocationName] = useState('Guwahati East Sector, Assam');
  const [latitude, setLatitude] = useState(26.185);
  const [longitude, setLongitude] = useState(91.772);
  const [waterDepth, setWaterDepth] = useState('120 cm (Above Waist Level)');
  const [roadStatus, setRoadStatus] = useState('Submerged - Boat Access Only');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [evList, incList] = await Promise.all([
          workflowService.getEvidence(),
          workflowService.getIncidents()
        ]);
        setEvidenceList(evList || []);
        setIncidents(incList || []);
        if (incList && incList.length > 0) {
          setSelectedIncidentId(incList[0].id);
        }
      } catch (e) {
        console.error('Failed to load field evidence:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessToast(null);

    const fullDescription = `[RESPONSE OBSERVATION] Water Depth: ${waterDepth} | Route: ${roadStatus} | Notes: ${description}`;

    const res = await workflowService.uploadEvidence({
      source: 'RESPONSE_FLEET',
      uploader_name: user?.name || 'NDRF Response Unit',
      incident_id: selectedIncidentId || undefined,
      location_name: locationName,
      latitude,
      longitude,
      image_url: imageUrl,
      description: fullDescription
    });

    setSubmitting(false);
    if (res.success && res.data) {
      setSuccessToast('Field report & evidence submitted directly to Authority Command.');
      setEvidenceList(prev => [res.data!, ...prev]);
      setDescription('');
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="response" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="response" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                <Camera className="w-6 h-6 text-amber-600" />
                Field Reports & Operational Evidence
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Transmit on-ground flood measurements, route trafficability, and photo evidence to Central Command.
              </p>
            </div>
            <DataBadge label="CENTRAL DB LIVE" variant="live" />
          </div>

          {successToast && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center gap-2 text-xs text-emerald-900 font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Column */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <FileText className="w-5 h-5 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  New Field Observation Report
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Associated Incident (Optional)</label>
                  <select
                    value={selectedIncidentId}
                    onChange={(e) => setSelectedIncidentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium"
                  >
                    <option value="">General Sector Observation</option>
                    {incidents.map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        #{inc.id} - {inc.title.slice(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location / Sector *</label>
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Ward 12, Pandu Riverbank"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={latitude}
                      onChange={(e) => setLatitude(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={longitude}
                      onChange={(e) => setLongitude(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Water Depth Reading</label>
                  <select
                    value={waterDepth}
                    onChange={(e) => setWaterDepth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium"
                  >
                    <option value="15-30 cm (Ankle to Shin)">15-30 cm (Ankle to Shin)</option>
                    <option value="50-80 cm (Knee to Thigh)">50-80 cm (Knee to Thigh)</option>
                    <option value="120 cm (Above Waist Level)">120 cm (Above Waist Level)</option>
                    <option value="> 180 cm (Full Ground Floor Inundated)">&gt; 180 cm (Full Ground Floor Inundated)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Road & Approach Trafficability</label>
                  <select
                    value={roadStatus}
                    onChange={(e) => setRoadStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium"
                  >
                    <option value="Trafficable - 4x4 Truck Access Open">Trafficable - 4x4 Truck Access Open</option>
                    <option value="Submerged - Boat Access Only">Submerged - Boat Access Only</option>
                    <option value="Blocked by Fallen Trees/Debris">Blocked by Fallen Trees/Debris</option>
                    <option value="Embankment Breach Hazard">Embankment Breach Hazard</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Field Observation Notes *</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter trapped population estimates, current flow velocity, immediate medical needs..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Evidence Photo URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono text-[11px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmitting Evidence to Central Database...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Transmit Field Report</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Evidence Feed Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Live Field Evidence Repository ({evidenceList.length} submissions)
                </span>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600" />
                  <p className="text-xs">Loading evidence records...</p>
                </div>
              ) : evidenceList.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                  <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Evidence Uploaded Yet</p>
                  <p className="text-[11px] text-slate-500">Submit field photos and water readings to populate the central repository.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {evidenceList.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4"
                    >
                      {/* Photo Thumbnail */}
                      <div className="w-full md:w-44 h-36 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ev.image_url}
                          alt="Field Evidence"
                          className="w-full h-full object-cover"
                        />
                        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white ${
                          ev.source === 'RESPONSE_FLEET' ? 'bg-amber-600' : 'bg-emerald-600'
                        }`}>
                          {ev.source.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-2 text-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">
                              {ev.uploader_name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              #{ev.id}
                            </span>
                          </div>

                          <p className="text-slate-700 mt-1 leading-relaxed font-medium">
                            {ev.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            {ev.location_name}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(ev.timestamp).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
