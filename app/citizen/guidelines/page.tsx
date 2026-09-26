'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  PhoneCall, 
  AlertTriangle, 
  Package, 
  Zap, 
  Droplet, 
  Heart 
} from 'lucide-react';

export default function CitizenGuidelinesPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'before' | 'during' | 'after' | 'kit'>('all');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="citizen" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="citizen" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-4 md:p-6 max-w-[1100px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                Flood Safety Guidelines & Preparedness Protocols
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Official NDMA & SDMA civil protection procedures for residents before, during, and after flood inundation.
              </p>
            </div>
            <DataBadge label="NDMA CIVIL GUIDELINES" variant="live" />
          </div>

          {/* Tab filter */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Protocols' },
              { id: 'before', label: '1. Before Flood (Preparedness)' },
              { id: 'during', label: '2. During Flood (Emergency)' },
              { id: 'after', label: '3. After Flood (Recovery)' },
              { id: 'kit', label: 'Emergency Kit Checklist' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            
            {/* Before Flood */}
            {(activeTab === 'all' || activeTab === 'before') && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      Phase 1: Before Flood (Preparedness & Early Warning)
                    </h2>
                    <p className="text-xs text-slate-500">Actions to take upon hearing early warning advisories</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Essential Do's
                    </span>
                    <ul className="space-y-1.5 text-emerald-900 leading-relaxed list-disc list-inside">
                      <li>Know your nearest high-ground relief shelter and evacuation route.</li>
                      <li>Charge all mobile phones, radios, and rechargeable torchlights.</li>
                      <li>Secure important identification papers and deeds in waterproof bags.</li>
                      <li>Store minimum 3 days of potable water and non-perishable dry rations.</li>
                    </ul>
                  </div>

                  <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 space-y-2">
                    <span className="font-bold text-red-950 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-600" /> Critical Don'ts
                    </span>
                    <ul className="space-y-1.5 text-red-900 leading-relaxed list-disc list-inside">
                      <li>Do NOT ignore official alerts or delay evacuation until roads submerge.</li>
                      <li>Do NOT spread unverified rumors on social media groups.</li>
                      <li>Do NOT leave cattle, livestock, or pets tied up in low shed areas.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* During Flood */}
            {(activeTab === 'all' || activeTab === 'during') && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      Phase 2: During Flood (Flash Surge Inundation)
                    </h2>
                    <p className="text-xs text-slate-500">Survival actions while water levels are rising rapidly</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Immediate Life-Saving Steps
                    </span>
                    <ul className="space-y-1.5 text-emerald-900 leading-relaxed list-disc list-inside">
                      <li>Immediately turn off the main electricity switch and LPG gas cylinder valves.</li>
                      <li>Move to the highest floor or roof; signal rescue teams with a bright cloth.</li>
                      <li>Trigger your 1-Click SOS on the NEER Portal to dispatch rescue teams.</li>
                      <li>Assist children, pregnant women, elderly, and differently-abled neighbors.</li>
                    </ul>
                  </div>

                  <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 space-y-2">
                    <span className="font-bold text-red-950 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-600" /> Lethal Hazards to Avoid
                    </span>
                    <ul className="space-y-1.5 text-red-900 leading-relaxed list-disc list-inside">
                      <li>NEVER attempt to walk through moving floodwater (just 15 cm can sweep you away).</li>
                      <li>NEVER drive vehicles into flooded bridges or underpasses.</li>
                      <li>Stay away from fallen electrical poles and submerged electric meters.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* After Flood */}
            {(activeTab === 'all' || activeTab === 'after') && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      Phase 3: After Flood (Health & Safe Return)
                    </h2>
                    <p className="text-xs text-slate-500">Actions when floodwaters begin receding</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sanitation & Inspection
                    </span>
                    <ul className="space-y-1.5 text-slate-700 leading-relaxed list-disc list-inside">
                      <li>Boil all drinking water for minimum 10 minutes or use chlorine tablets.</li>
                      <li>Have an electrician inspect house wiring before restoring main power.</li>
                      <li>Watch for venomous snakes or animals that seek dry shelter indoors.</li>
                      <li>Disinfect inundated premises with bleaching powder to prevent cholera/typhoid.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-red-500" /> Medical & Reporting
                    </span>
                    <ul className="space-y-1.5 text-slate-700 leading-relaxed list-disc list-inside">
                      <li>Visit designated primary health centers for skin infections or waterborne fever.</li>
                      <li>Report structural cracks in embankments or roads through NEER portal.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Kit */}
            {(activeTab === 'all' || activeTab === 'kit') && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      Emergency "Go-Bag" Survival Kit Checklist
                    </h2>
                    <p className="text-xs text-slate-500">Pack these in a waterproof backpack before monsoon season</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-800 block">Food & Hydration</span>
                    <p className="text-[11px] text-slate-500">3-day bottled water, roasted grams, energy biscuits, ORS packets.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-800 block">Medical Supplies</span>
                    <p className="text-[11px] text-slate-500">First-aid kit, antiseptics, paracetamol, daily prescription medicines.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-800 block">Lighting & Power</span>
                    <p className="text-[11px] text-slate-500">LED flashlight, spare batteries, fully charged power bank, whistle.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-800 block">Protection & Cash</span>
                    <p className="text-[11px] text-slate-500">Emergency cash currency notes, Aadhaar card copies, rain poncho.</p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Emergency Helpline Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Official NDMA Disaster Emergency Numbers</span>
                <span className="text-[11px] text-slate-400">Available 24 hours across all Indian telecom networks</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="tel:112" className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow transition-all">
                Dial 112 (ERSS)
              </a>
              <a href="tel:1078" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow transition-all">
                Dial 1078 (NDMA)
              </a>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
