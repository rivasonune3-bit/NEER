'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DataBadge } from '@/components/common/DataBadge';
import { workflowService, ResponseTeamData, IncidentData } from '@/lib/services/workflowService';
import { 
  Compass, 
  MapPin, 
  LifeBuoy, 
  Radio, 
  Navigation, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers,
  ArrowRight,
  Loader2
} from 'lucide-react';

export default function ResponseOperationsMapPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [teams, setTeams] = useState<ResponseTeamData[]>([]);
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<IncidentData | null>(null);

  const MAP_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_3x9p_1_33491a9e2c1013f9bc9721b7';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [teamsData, incidentsData] = await Promise.all([
          workflowService.getResponseTeams(),
          workflowService.getIncidents()
        ]);
        setTeams(teamsData || []);
        setIncidents(incidentsData || []);
      } catch (e) {
        console.error('Failed to load map data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [26.185, 91.772], // Guwahati center by default
          zoom: 11,
          zoomControl: false,
          attributionControl: false
        });

        const keyParam = MAP_API_KEY ? `?api_key=${MAP_API_KEY}&key=${MAP_API_KEY}` : '';
        L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${keyParam}`, {
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;
        mapInstanceRef.current = map;

        // Invalidate size on resize
        const resizeObserver = new ResizeObserver(() => {
          map.invalidateSize();
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      // Render markers
      if (markersLayerRef.current && mapInstanceRef.current) {
        markersLayerRef.current.clearLayers();

        // 1. Team markers
        teams.forEach((t) => {
          const lat = t.latitude || 26.185;
          const lng = t.longitude || 91.772;

          const teamIcon = L.divIcon({
            className: 'custom-team-marker',
            html: `<div style="background-color: #0284c7; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); color: white; font-weight: bold; font-size: 14px;">🚤</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const marker = L.marker([lat, lng], { icon: teamIcon }).addTo(markersLayerRef.current);
          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
              <strong style="color: #0369a1; font-size: 13px;">${t.name}</strong><br/>
              <span>Status: <b>${t.status}</b></span><br/>
              <span>Vehicle: ${t.vehicle_type || 'Rescue Boat'}</span><br/>
              <span>Crew: ${t.crew_size || 8} personnel</span><br/>
              <span style="font-size: 10px; color: #64748b;">Base: ${t.base_location}</span>
            </div>
          `);
        });

        // 2. Incident markers
        incidents.forEach((inc) => {
          const lat = inc.latitude || 26.175;
          const lng = inc.longitude || 91.712;
          const isCritical = inc.priority === 'Critical';

          const incIcon = L.divIcon({
            className: 'custom-inc-marker',
            html: `<div style="background-color: ${isCritical ? '#dc2626' : '#f59e0b'}; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(220,38,38,0.5); color: white; font-weight: bold; font-size: 14px; animation: pulse 2s infinite;">🚨</div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          });

          const marker = L.marker([lat, lng], { icon: incIcon }).addTo(markersLayerRef.current);
          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
              <strong style="color: #b91c1c; font-size: 13px;">${inc.title}</strong><br/>
              <span>Priority: <b style="color: red;">${inc.priority}</b></span><br/>
              <span>Status: <b>${inc.status}</b></span><br/>
              <span>Caller: ${inc.reported_by}</span><br/>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">${inc.description.slice(0, 80)}...</p>
            </div>
          `);

          marker.on('click', () => {
            setSelectedIncident(inc);
          });
        });
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [teams, incidents]);

  const panToCoords = (lat: number, lng: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 14, { animate: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <SystemStatusBanner />
      <Header currentRole="response" onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1">
        <Sidebar role="response" isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 p-4 md:p-6 max-w-[1500px] mx-auto space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                <Compass className="w-6 h-6 text-amber-600" />
                Response Fleet Operations Map
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time tactical coordinates for response units and active distress incidents.
              </p>
            </div>
            <DataBadge label="LIVE TACTICAL GEO-FEED" variant="live" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            
            {/* Map Area */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative h-[650px] flex flex-col">
              
              {/* Map Floating Toolbar */}
              <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-sky-600 inline-block" />
                  <span>Units: {teams.length}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
                  <span>Incidents: {incidents.length}</span>
                </div>
              </div>

              {/* Map Controls */}
              <div className="absolute top-4 right-4 z-[400] flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => mapInstanceRef.current?.zoomIn()}
                  className="w-8 h-8 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold flex items-center justify-center shadow-md transition-all"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => mapInstanceRef.current?.zoomOut()}
                  className="w-8 h-8 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold flex items-center justify-center shadow-md transition-all"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => mapInstanceRef.current?.setView([26.185, 91.772], 11)}
                  className="w-8 h-8 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold flex items-center justify-center shadow-md transition-all"
                  title="Reset Extent"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Leaflet Container */}
              <div ref={mapContainerRef} className="w-full h-full bg-slate-100" />
            </div>

            {/* Right Side Tactical Sidebar */}
            <div className="space-y-4">
              
              {/* Selected Marker Inspector */}
              {selectedIncident ? (
                <div className="bg-white border-2 border-red-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white">
                      Selected Distress Call
                    </span>
                    <button
                      onClick={() => setSelectedIncident(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Close
                    </button>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 leading-snug">
                    {selectedIncident.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {selectedIncident.description}
                  </p>

                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 space-y-1">
                    <p><strong>Caller:</strong> {selectedIncident.reported_by} ({selectedIncident.reported_phone})</p>
                    <p><strong>Coordinates:</strong> {selectedIncident.latitude.toFixed(4)}, {selectedIncident.longitude.toFixed(4)}</p>
                  </div>

                  <Link
                    href="/response/incidents"
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <span>Open in Mission Desk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1 text-center py-6">
                  <LifeBuoy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <h3 className="text-xs font-bold text-slate-800">Tactical Inspection</h3>
                  <p className="text-[11px] text-slate-500">
                    Click any marker on the map to inspect distress details or team telemetry.
                  </p>
                </div>
              )}

              {/* Incidents Quick Locate List */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 max-h-[340px] overflow-y-auto">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Active Mission Hotspots:
                </span>

                {incidents.length === 0 ? (
                  <p className="text-xs text-slate-400">No active incidents</p>
                ) : (
                  <div className="space-y-2">
                    {incidents.map((inc) => (
                      <button
                        key={inc.id}
                        type="button"
                        onClick={() => {
                          setSelectedIncident(inc);
                          panToCoords(inc.latitude, inc.longitude);
                        }}
                        className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 truncate block max-w-[170px]">
                            {inc.title}
                          </span>
                          <span className="text-[9px] font-black text-red-600 uppercase">
                            {inc.priority}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{inc.location_name}</span>
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
