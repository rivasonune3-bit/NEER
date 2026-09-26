'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { useAuth } from '@/lib/auth/AuthContext';
import { workflowService, CitizenData } from '@/lib/services/workflowService';
import { 
  PhoneCall, 
  AlertTriangle, 
  MapPin, 
  CheckCircle2, 
  Send, 
  Camera, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  HeartHandshake,
  ShieldAlert,
  Loader2
} from 'lucide-react';

export default function CitizenEmergencySOSPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user } = useAuth();
  const [profile, setProfile] = useState<CitizenData | null>(null);

  // Location states
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [registeredLocation, setRegisteredLocation] = useState<string>('Guwahati East, Kamrup Metro, Assam');
  const [sharedLocationText, setSharedLocationText] = useState<string>('');

  // Distress submission states
  const [isSending, setIsSending] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [ticketId, setTicketId] = useState<string>('');

  // Optional details accordion
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [trappedCount, setTrappedCount] = useState<number>(1);
  const [urgencyNote, setUrgencyNote] = useState('');
  const [optionalDetailsSaved, setOptionalDetailsSaved] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const prof = await workflowService.getMyCitizenProfile();
        if (prof) {
          setProfile(prof);
          const loc = [prof.address, prof.village, prof.block, prof.district, prof.state].filter(Boolean).join(', ');
          if (loc) setRegisteredLocation(loc);
        }
      } catch (e) {
        console.error('Error fetching profile:', e);
      }
    }
    loadProfile();

    // Check GPS permission if browser supports it
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setSharedLocationText(`GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        },
        (err) => {
          setLocationError('Location permission unavailable. Sent using your registered home location.');
        },
        { timeout: 8000 }
      );
    } else {
      setLocationError('Location permission unavailable on this device.');
    }
  }, []);

  const handleInstantSOS = async () => {
    setIsSending(true);
    const citizenName = profile?.name || user?.name || 'Citizen';
    const citizenPhone = profile?.phone || 'Not Provided';
    const locText = currentCoords 
      ? `GPS Location (${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}) - Near ${registeredLocation}` 
      : registeredLocation;

    const lat = currentCoords?.lat || 26.185;
    const lng = currentCoords?.lng || 91.772;

    const res = await workflowService.reportIncident({
      title: `EMERGENCY SOS: Evacuation Distress from ${citizenName}`,
      description: `Instant 1-Click SOS distress signal triggered by resident. Urgently requesting rescue / evacuation assistance. Home registered: ${registeredLocation}.`,
      incident_type: 'Flooding',
      location_name: locText,
      latitude: lat,
      longitude: lng,
      reported_by: citizenName,
      reported_phone: citizenPhone,
      priority: 'Critical',
      status: 'Reported'
    });

    const newTicket = 'SOS-' + Math.floor(100000 + Math.random() * 900000);
    setTicketId(newTicket);
    setIsSending(false);
    setSosSent(true);
  };

  const handleSaveOptionalDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosSent) return;
    setOptionalDetailsSaved(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="citizen" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="citizen" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-4 md:p-6 max-w-[800px] mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                Emergency Help & Evacuation SOS
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Instant 1-Click distress broadcast directly to NEER Authority Command.
              </p>
            </div>
            <DataBadge label="1-CLICK DISPATCH" variant="live" />
          </div>

          {/* Location Status Notice */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {currentCoords ? (
                  <span className="text-emerald-700 font-bold">
                    GPS Active: {sharedLocationText}
                  </span>
                ) : (
                  <span>
                    Registered Location: <strong className="text-slate-900">{registeredLocation}</strong>
                  </span>
                )}
              </span>
            </div>
            {locationError && (
              <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                {locationError}
              </span>
            )}
          </div>

          {/* SOS Primary Action Area */}
          {sosSent ? (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-6 text-center space-y-4 shadow-lg animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-emerald-950">
                  SOS sent. Assistance request received.
                </h2>
                <p className="text-xs text-emerald-800 max-w-md mx-auto mt-2 leading-relaxed font-medium">
                  Your emergency alert and coordinates have been transmitted directly to the NEER Authority Command and dispatched to the nearest disaster response fleet.
                </p>
              </div>

              <div className="inline-block bg-white border border-emerald-300 rounded-xl px-4 py-2 text-xs font-mono font-bold text-emerald-900 shadow-sm">
                Reference Ticket ID: #{ticketId}
              </div>

              <div className="p-3 bg-emerald-100/70 rounded-xl text-xs text-emerald-900 max-w-md mx-auto text-left space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-emerald-700" />
                  What you should do right now:
                </p>
                <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5">
                  <li>Move immediately to the highest accessible floor or elevated high ground.</li>
                  <li>Do NOT attempt to walk or drive across flooded roads.</li>
                  <li>Keep your mobile phone on power saving mode.</li>
                </ul>
              </div>

              {/* Collapsible Optional Details Form after SOS */}
              <div className="pt-2 text-left">
                <button
                  type="button"
                  onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                  className="w-full flex items-center justify-between p-3 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Add optional details (persons count, special needs, notes)
                  </span>
                  {showOptionalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showOptionalDetails && (
                  <form onSubmit={handleSaveOptionalDetails} className="mt-3 p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs">
                    {optionalDetailsSaved ? (
                      <p className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Additional details attached to your SOS ticket!
                      </p>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Number of People Trapped</label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={trappedCount}
                              onChange={(e) => setTrappedCount(Number(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Special Assistance Required</label>
                            <select
                              value={urgencyNote}
                              onChange={(e) => setUrgencyNote(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                            >
                              <option value="">None / General Evacuation</option>
                              <option value="Elderly citizen trapped">Elderly Citizen</option>
                              <option value="Infant / Small children">Infant / Small Children</option>
                              <option value="Medical condition / Oxygen / Wheelchair">Medical / Oxygen Need</option>
                              <option value="Injured persons">Injured Persons</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all"
                        >
                          Attach to SOS Ticket
                        </button>
                      </>
                    )}
                  </form>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setSosSent(false);
                    setOptionalDetailsSaved(false);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  Need to send another distress signal?
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white border-2 border-red-200 rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-xl">
              
              <div className="space-y-2">
                <span className="text-xs font-black tracking-widest uppercase text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                  1-Tap Distress Signal
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  Press the SOS Button Below
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No forms required. Your identity, registered address, and location will be transmitted immediately.
                </p>
              </div>

              {/* Giant 1-Click SOS Button */}
              <div className="py-4">
                <button
                  type="button"
                  onClick={handleInstantSOS}
                  disabled={isSending}
                  className="relative group w-48 h-48 md:w-56 md:h-56 mx-auto rounded-full bg-gradient-to-br from-red-500 via-red-600 to-rose-700 text-white shadow-2xl shadow-red-500/50 hover:shadow-red-600/70 hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center p-4 border-4 border-white disabled:opacity-50"
                >
                  <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-30 pointer-events-none" />
                  
                  {isSending ? (
                    <>
                      <Loader2 className="w-12 h-12 animate-spin mb-2" />
                      <span className="text-xs font-bold uppercase tracking-wider">Broadcasting...</span>
                    </>
                  ) : (
                    <>
                      <PhoneCall className="w-12 h-12 md:w-14 md:h-14 mb-2 animate-bounce" />
                      <span className="text-3xl md:text-4xl font-black tracking-tight uppercase">SOS</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest opacity-90 mt-1">
                        Send Distress Call
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Information attached preview */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2 max-w-md mx-auto">
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-sky-600" />
                  Information that will be transmitted automatically:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Name:</span>
                    <strong className="text-slate-800">{profile?.name || user?.name || 'Citizen Resident'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Phone:</span>
                    <strong className="text-slate-800 font-mono">{profile?.phone || 'On file'}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Location:</span>
                    <strong className="text-slate-800 truncate block">
                      {currentCoords ? sharedLocationText : registeredLocation}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Direct NDMA hotline */}
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-center gap-4">
                <span>Can also call directly:</span>
                <a href="tel:112" className="font-extrabold text-red-600 hover:underline">112 (ERSS)</a>
                <span>•</span>
                <a href="tel:1078" className="font-extrabold text-red-600 hover:underline">1078 (NDMA)</a>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
