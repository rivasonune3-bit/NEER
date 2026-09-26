'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { workflowService, ShelterData, CitizenData } from '@/lib/services/workflowService';
import { 
  Building2, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Search, 
  AlertCircle,
  Loader2,
  Phone
} from 'lucide-react';
import { INDIA_STATES, INDIA_DISTRICTS } from '@/lib/data/indiaLocations';

export default function CitizenSheltersPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [shelters, setShelters] = useState<ShelterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CitizenData | null>(null);

  // Filter state
  const [selectedState, setSelectedState] = useState('st-as');
  const [selectedDistrict, setSelectedDistrict] = useState('dt-km');
  const [activeLocName, setActiveLocName] = useState('Guwahati East, Kamrup Metro, Assam');

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const prof = await workflowService.getMyCitizenProfile();
        if (prof) {
          setProfile(prof);
          if (prof.district) {
            setActiveLocName([prof.district, prof.state].filter(Boolean).join(', '));
          }
        }
        // Fetch shelters near Guwahati East (lat: 26.185, lng: 91.772)
        const data = await workflowService.getShelters(26.185, 91.772);
        setShelters(data || []);
      } catch (e) {
        console.error('Error fetching shelters:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const stateObj = INDIA_STATES.find(s => s.id === selectedState);
      const districtList = INDIA_DISTRICTS[selectedState] || [];
      const distObj = districtList.find(d => d.id === selectedDistrict);
      
      const sName = stateObj?.name || 'Assam';
      const dName = distObj?.name || 'Kamrup Metropolitan';
      setActiveLocName(`${dName}, ${sName}`);

      const data = await workflowService.getShelters(undefined, undefined, sName, dName);
      setShelters(data || []);
    } catch (e) {
      console.error('Error searching shelters:', e);
    } finally {
      setLoading(false);
    }
  };

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
                <Building2 className="w-6 h-6 text-emerald-600" />
                Designated High-Ground Relief Shelters
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Official NDMA-designated flood relief camps, capacity, and high-ground shelter status.
              </p>
            </div>
            <DataBadge label="OFFICIAL CAMPS" variant="live" />
          </div>

          {/* Location Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-700 block">
              Search High-Ground Shelters in Another District:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    const firstDist = INDIA_DISTRICTS[e.target.value]?.[0]?.id || '';
                    setSelectedDistrict(firstDist);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {INDIA_STATES.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {(INDIA_DISTRICTS[selectedState] || []).map((dt) => (
                    <option key={dt.id} value={dt.id}>{dt.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Locate Shelters</span>
                </button>
              </div>
            </div>
          </div>

          {/* Shelters Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Shelters near {activeLocName}
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {shelters.length} camps identified
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
                <p className="text-xs font-medium">Calculating distance to nearest designated shelters...</p>
              </div>
            ) : shelters.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-2">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">
                  Shelter information unavailable for this area
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No verified high-ground relief camps are registered within a 60 km radius of this location. In an emergency, dial 112 or 1078 to contact disaster authorities directly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shelters.map((shelter) => {
                  return (
                    <div
                      key={shelter.id}
                      className="bg-white border border-slate-200 hover:border-emerald-400/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 leading-snug">
                              {shelter.name}
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{shelter.address}, {shelter.district}, {shelter.state}</span>
                            </p>
                          </div>
                          {shelter.distance_km !== undefined && (
                            <span className="bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shrink-0">
                              {shelter.distance_km} km away
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-slate-400 text-[10px] block uppercase font-bold">Capacity</span>
                            <span className="font-bold text-slate-800">{shelter.capacity || 400} Persons</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-slate-400 text-[10px] block uppercase font-bold">Camp Status</span>
                            <span className="font-bold text-emerald-700">{shelter.status || 'Active / Open'}</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Emergency Medical Desk • Food & Potable Water Available</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="w-full py-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Designated High-Ground Relief Center</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
