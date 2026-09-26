'use client';

import React, { useState } from 'react';
import { 
  LifeBuoy, 
  MapPin, 
  PhoneCall, 
  ShieldAlert, 
  Building2, 
  Bell, 
  CheckCircle, 
  AlertTriangle,
  Send,
  Navigation,
  Info
} from 'lucide-react';
import { DataBadge } from '../common/DataBadge';

export const CitizenPortalView: React.FC = () => {
  const [sosSubmitted, setSosSubmitted] = useState<boolean>(false);
  const [citizenName, setCitizenName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [peopleCount, setPeopleCount] = useState<number>(2);
  const [locationText, setLocationText] = useState<string>('Guwahati East, Assam');
  const [details, setDetails] = useState<string>('');
  const [smsRegistered, setSmsRegistered] = useState<boolean>(false);
  const [smsPhone, setSmsPhone] = useState<string>('');

  const handleSosSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenName || !phone) return;
    setSosSubmitted(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 space-y-6">
      
      {/* Citizen Portal Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-800/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <LifeBuoy className="w-3.5 h-3.5" />
                Citizen Emergency & Safety Portal
              </span>
              <DataBadge label="RESIDENT ACCESS" variant="live" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Stay Safe & Monitored During Monsoon Surges
            </h1>
            <p className="text-sm text-teal-100 max-w-2xl mt-1">
              Check your village flood susceptibility, broadcast instant SOS distress requests directly to the NDRF control desk, and find nearest designated high-ground shelters.
            </p>
          </div>

          <div className="bg-emerald-950/80 border border-emerald-700/60 backdrop-blur-md rounded-xl p-4 shrink-0 text-center">
            <PhoneCall className="w-6 h-6 text-emerald-400 mx-auto animate-bounce mb-1" />
            <span className="text-[10px] text-emerald-300 block font-bold uppercase">National Emergency Helpline</span>
            <a href="tel:112" className="text-2xl font-black text-white hover:underline">112 / 1078</a>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Toll-Free 24x7 NDMA Line</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: 1-Click SOS Emergency Request Form */}
        <div className="lg:col-span-1 bg-white border-2 border-red-200 rounded-2xl p-5 shadow-lg relative">
          <div className="flex items-center justify-between pb-3 border-b border-red-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-red-900 uppercase tracking-wide">
                  Emergency Distress SOS
                </h2>
                <p className="text-xs text-red-700 font-medium">Request Evacuation Assistance</p>
              </div>
            </div>
            <DataBadge label="DIRECT TO FLEET" variant="offline" />
          </div>

          {sosSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-6 text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-black text-emerald-900">SOS Broadcast Active!</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Your emergency location signal has been dispatched to the nearest NDRF/SDRF command unit. Stay on high ground with your family.
              </p>
              <div className="bg-emerald-100 text-emerald-900 text-xs font-mono font-bold p-2.5 rounded-lg border border-emerald-300">
                Ticket ID: #SOS-{Math.floor(100000 + Math.random() * 900000)}
              </div>
              <button
                onClick={() => setSosSubmitted(false)}
                className="text-xs font-bold text-slate-700 hover:underline pt-2 block mx-auto"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSosSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kalita"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98640 *****"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Number of Trapped Persons</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Exact Address / GPS Landmark</label>
                <input
                  type="text"
                  required
                  placeholder="House #42, Riverside Bhorolu Path..."
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Urgent Need Details</label>
                <textarea
                  rows={2}
                  placeholder="Water entered 1st floor, elderly, infant food, medical emergency..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                <Send className="w-4 h-4" />
                <span>Transmit Emergency SOS</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Columns: Safe Shelters & Advisory Signup */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Nearest Shelters Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Designated High-Ground Relief Shelters
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">Auto-located near Guwahati East</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900">
                      Dispur Higher Secondary School Camp
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Dispur Hill Ridge, Guwahati</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                    OPEN (1.2 km)
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200 pt-2">
                  <span>Capacity: 450 Bed Slots</span>
                  <span className="font-bold text-emerald-600">Medical Desk On-Site</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900">
                      Ganeshguri Indoor Stadium Relief Hub
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">GS Road Elevated Complex</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                    OPEN (2.4 km)
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200 pt-2">
                  <span>Capacity: 800 Bed Slots</span>
                  <span className="font-bold text-emerald-600">Food & Pure Water</span>
                </div>
              </div>
            </div>
          </div>

          {/* SMS / WhatsApp Early Alert Registration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-5 h-5 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Localized Early Warning SMS Alerts
              </h2>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Receive official National Disaster Management advisories and river surge updates directly on your mobile phone before water levels reach your village.
            </p>

            {smsRegistered ? (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-900 font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-sky-600" />
                Mobile number registered for localized flashflood warnings!
              </div>
            ) : (
              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="tel"
                  placeholder="Enter 10-digit Mobile Number"
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <button
                  onClick={() => smsPhone && setSmsRegistered(true)}
                  className="py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                >
                  Subscribe Alerts
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
