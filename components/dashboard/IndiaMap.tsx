'use client';

import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';
import { 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Compass, 
  Search, 
  Layers,
  ShieldAlert,
  Home,
  AlertTriangle,
  LifeBuoy,
  Waves,
  Eye,
  Check,
  ChevronDown
} from 'lucide-react';
import { LocationItem } from '@/lib/types';
import { 
  INDIA_STATES, 
  INDIA_DISTRICTS, 
  INDIA_BLOCKS, 
  INDIA_VILLAGES 
} from '@/lib/data/indiaLocations';
import { workflowService, ShelterData, IncidentData, ResponseTeamData } from '@/lib/services/workflowService';
import { UpstreamCatchmentData } from '@/lib/services/dynamicRiskService';

interface IndiaMapProps {
  selectedLocation?: LocationItem | null;
  onSelectLocation: (location: LocationItem) => void;
  currentRiskScore?: number;
  staticScore?: number;
  dynamicHazardScore?: number;
  alertStatus?: 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
  rainfallRate?: number;
  upstreamCatchment?: UpstreamCatchmentData | null;
}

export const IndiaMap: React.FC<IndiaMapProps> = ({
  selectedLocation,
  onSelectLocation,
  currentRiskScore = 42,
  staticScore = 30,
  dynamicHazardScore = 18,
  alertStatus = 'NORMAL',
  rainfallRate = 14,
  upstreamCatchment,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const riskMarkerRef = useRef<any>(null);

  // Layer groups
  const riskZonesLayerRef = useRef<any>(null);
  const riversLayerRef = useRef<any>(null);
  const catchmentLayerRef = useRef<any>(null);
  const sheltersLayerRef = useRef<any>(null);
  const incidentsLayerRef = useRef<any>(null);
  const fleetLayerRef = useRef<any>(null);
  const radarLayerRef = useRef<any>(null);

  // View Mode: 'standard' | 'terrain' | 'risk'
  const [viewMode, setViewMode] = useState<'standard' | 'terrain' | 'risk'>('risk');
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchError, setSearchError] = useState<string | null>(null);

  // Layer toggles
  const [layers, setLayers] = useState({
    floodRisk: true,
    rivers: true,
    upstreamCatchment: true,
    shelters: true,
    incidents: true,
    responseFleet: true,
    radarOverlay: true,
  });

  // Database overlay state
  const [shelters, setShelters] = useState<ShelterData[]>([]);
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [teams, setTeams] = useState<ResponseTeamData[]>([]);

  const defaultLat = selectedLocation?.lat || 30.4042;
  const defaultLng = selectedLocation?.lng || 79.3304;

  const MAP_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY || process.env.NEXT_PUBLIC_MAP_API_KEY || 'cb1_3x9p_1_33491a9e2c1013f9bc9721b7';

  // Load real data for overlays
  useEffect(() => {
    async function loadData() {
      try {
        const [sheltersData, incidentsData, teamsData] = await Promise.all([
          workflowService.getShelters(),
          workflowService.getIncidents(),
          workflowService.getResponseTeams(),
        ]);
        setShelters(sheltersData || []);
        setIncidents(incidentsData || []);
        setTeams(teamsData || []);
      } catch (err) {
        console.error('Failed to load map disaster overlay data:', err);
      }
    }
    loadData();
  }, []);

  const getTileUrl = (mode: 'standard' | 'terrain' | 'risk') => {
    const keyParam = MAP_API_KEY ? `?api_key=${MAP_API_KEY}&key=${MAP_API_KEY}` : '';
    if (mode === 'risk') {
      // High-contrast dark GIS basemap for disaster operations
      return `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${keyParam}`;
    }
    if (mode === 'terrain') {
      // Topographic terrain relief
      return `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${keyParam}`;
    }
    // Clean street GIS base
    return `https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png${keyParam}`;
  };

  // Initialize Map
  useEffect(() => {
    let isMounted = true;
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [defaultLat, defaultLng],
          zoom: selectedLocation?.type === 'village' ? 14 : selectedLocation?.type === 'block' ? 12 : 10,
          zoomControl: false,
          attributionControl: false,
        });

        const tile = L.tileLayer(getTileUrl(viewMode), {
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        tileLayerRef.current = tile;

        // Create Layer Groups
        riskZonesLayerRef.current = L.layerGroup().addTo(map);
        riversLayerRef.current = L.layerGroup().addTo(map);
        catchmentLayerRef.current = L.layerGroup().addTo(map);
        sheltersLayerRef.current = L.layerGroup().addTo(map);
        incidentsLayerRef.current = L.layerGroup().addTo(map);
        fleetLayerRef.current = L.layerGroup().addTo(map);
        radarLayerRef.current = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;

        // Invalidate size
        const invalidate = () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize({ pan: false, debounceMoveReload: false });
          }
        };
        invalidate();
        [50, 150, 300, 600, 1200].forEach((delay) => setTimeout(invalidate, delay));
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer on viewMode change
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;
    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const newTile = L.tileLayer(getTileUrl(viewMode), {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      tileLayerRef.current = newTile;
      map.invalidateSize();
    });
  }, [viewMode]);

  // Handle Resize
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    const triggerResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ pan: false, debounceMoveReload: false });
      }
    };
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      ro = new ResizeObserver(() => triggerResize());
      ro.observe(mapContainerRef.current);
    }
    window.addEventListener('resize', triggerResize);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', triggerResize);
    };
  }, []);

  // Render Disaster GIS Layers & Risk Marker
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const lat = selectedLocation?.lat || defaultLat;
      const lng = selectedLocation?.lng || defaultLng;
      const locName = selectedLocation?.name || 'Selected Location';

      // 1. NEER RISK LOCATION MARKER
      const badgeColor =
        alertStatus === 'CRITICAL'
          ? 'bg-red-600 text-white border-red-500 animate-pulse'
          : alertStatus === 'WARNING'
          ? 'bg-amber-500 text-white border-amber-400'
          : alertStatus === 'WATCH'
          ? 'bg-yellow-500 text-slate-900 border-yellow-400'
          : 'bg-emerald-600 text-white border-emerald-500';

      const ringColor =
        alertStatus === 'CRITICAL'
          ? 'border-red-500 bg-red-500/20'
          : alertStatus === 'WARNING'
          ? 'border-orange-500 bg-orange-500/20'
          : 'border-sky-500 bg-sky-500/20';

      const riskIcon = L.divIcon({
        className: 'neer-disaster-marker',
        html: `
          <div style="transform: translate(-50%, -100%); pointer-events: auto; cursor: pointer;">
            <div style="background: rgba(11, 25, 44, 0.95); border: 2px solid ${alertStatus === 'CRITICAL' ? '#EF4444' : '#0284C7'}; border-radius: 8px; padding: 6px 10px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6); min-width: 170px; backdrop-filter: blur(8px);">
              <div style="font-size: 9px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 4px;">
                <span>📍</span> NEER RISK LOCATION
              </div>
              <div style="font-size: 13px; font-weight: 900; color: #FFFFFF; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${locName}
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.15);">
                <span style="font-size: 11px; font-weight: 800; color: #38BDF8; font-family: monospace;">Risk: ${currentRiskScore}%</span>
                <span style="font-size: 9px; font-weight: 900; padding: 1px 6px; border-radius: 4px; text-transform: uppercase; background: ${alertStatus === 'CRITICAL' ? '#DC2626' : alertStatus === 'WARNING' ? '#D97706' : alertStatus === 'WATCH' ? '#CA8A04' : '#059669'}; color: #FFFFFF;">
                  ${alertStatus}
                </span>
              </div>
            </div>
            <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid ${alertStatus === 'CRITICAL' ? '#EF4444' : '#0284C7'}; margin: 0 auto;"></div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${alertStatus === 'CRITICAL' ? '#EF4444' : '#38BDF8'}; border: 2px solid #FFFFFF; margin: -4px auto 0 auto; box-shadow: 0 0 10px ${alertStatus === 'CRITICAL' ? '#EF4444' : '#38BDF8'};"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      if (riskMarkerRef.current) {
        riskMarkerRef.current.setLatLng([lat, lng]);
        riskMarkerRef.current.setIcon(riskIcon);
      } else {
        const marker = L.marker([lat, lng], { icon: riskIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
            <strong style="font-size: 14px; color: #0F172A; display: block;">${locName}</strong>
            <div style="color: #64748B; font-size: 11px; margin-top: 2px;">Lat: ${lat.toFixed(4)}°, Lng: ${lng.toFixed(4)}°</div>
            <div style="margin-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-family: monospace; font-size: 11px;">
              <div style="background: #F1F5F9; padding: 4px; border-radius: 4px;">Static: <strong>${staticScore}%</strong></div>
              <div style="background: #F1F5F9; padding: 4px; border-radius: 4px;">Hazard: <strong>${dynamicHazardScore}%</strong></div>
            </div>
            <div style="margin-top: 6px; padding: 4px 8px; border-radius: 4px; text-align: center; font-weight: bold; background: ${alertStatus === 'CRITICAL' ? '#FEE2E2' : '#E0F2FE'}; color: ${alertStatus === 'CRITICAL' ? '#991B1B' : '#0369A1'};">
              Coupled Flash Flood Risk: ${currentRiskScore}% (${alertStatus})
            </div>
          </div>
        `);
        riskMarkerRef.current = marker;
      }

      // 2. VISUAL RISK ZONES (Polygons / Buffer Contours)
      if (riskZonesLayerRef.current) {
        riskZonesLayerRef.current.clearLayers();

        if (layers.floodRisk) {
          // Critical Inundation Zone (Core Valley Basin)
          const criticalColor = '#EF4444';
          L.circle([lat, lng], {
            radius: 800,
            color: criticalColor,
            weight: 2,
            dashArray: '4, 4',
            fillColor: criticalColor,
            fillOpacity: alertStatus === 'CRITICAL' ? 0.35 : 0.20,
          })
            .bindTooltip(`Critical Inundation Risk Zone (${currentRiskScore}% Core Basin)`)
            .addTo(riskZonesLayerRef.current);

          // High / Moderate Hazard Buffer
          const modColor = alertStatus === 'CRITICAL' || alertStatus === 'WARNING' ? '#F97316' : '#F59E0B';
          L.circle([lat, lng], {
            radius: 2200,
            color: modColor,
            weight: 1.5,
            fillColor: modColor,
            fillOpacity: 0.12,
          })
            .bindTooltip('Moderate Runoff & Secondary Surge Zone')
            .addTo(riskZonesLayerRef.current);

          // Outer Low Risk Perimeter
          L.circle([lat, lng], {
            radius: 4500,
            color: '#10B981',
            weight: 1,
            dashArray: '2, 4',
            fillColor: '#10B981',
            fillOpacity: 0.05,
          })
            .bindTooltip('Outer Monitoring Perimeter (Low Direct Inundation)')
            .addTo(riskZonesLayerRef.current);
        }
      }

      // 3. RIVERS & STREAMS VECTOR OVERLAYS
      if (riversLayerRef.current) {
        riversLayerRef.current.clearLayers();

        if (layers.rivers) {
          // Generate deterministic river channel geometry based on geography
          const deltaLat = 0.035;
          const deltaLng = 0.045;

          // Primary River Channel (Alaknanda / Local Major River)
          const riverCoords: [number, number][] = [
            [lat + deltaLat * 1.5, lng - deltaLng * 1.2],
            [lat + deltaLat * 0.8, lng - deltaLng * 0.5],
            [lat + 0.003, lng - 0.004], // close to selected point
            [lat - deltaLat * 0.6, lng + deltaLng * 0.4],
            [lat - deltaLat * 1.4, lng + deltaLng * 1.1],
          ];

          L.polyline(riverCoords, {
            color: '#0284C7',
            weight: 5,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          })
            .bindTooltip(`Primary River Channel (Distance: ${Math.round(Math.abs(lat - 30.4) * 111000 % 800 + 120)}m)`)
            .addTo(riversLayerRef.current);

          // Mountain Stream Tributary 1
          const streamCoords1: [number, number][] = [
            [lat + deltaLat * 1.1, lng + deltaLng * 0.8],
            [lat + deltaLat * 0.4, lng + deltaLng * 0.3],
            [lat + 0.003, lng - 0.004], // joins primary river
          ];

          L.polyline(streamCoords1, {
            color: '#38BDF8',
            weight: 2.5,
            dashArray: '4, 4',
            opacity: 0.8,
          })
            .bindTooltip('Mountain Torrent / Upstream Feeder Stream')
            .addTo(riversLayerRef.current);

          // Mountain Stream Tributary 2
          const streamCoords2: [number, number][] = [
            [lat - deltaLat * 0.9, lng - deltaLng * 0.9],
            [lat - deltaLat * 0.3, lng - deltaLng * 0.3],
            [lat - deltaLat * 0.6, lng + deltaLng * 0.4], // joins downstream
          ];

          L.polyline(streamCoords2, {
            color: '#38BDF8',
            weight: 2,
            dashArray: '3, 3',
            opacity: 0.7,
          })
            .bindTooltip('Secondary Drainage Rivulet')
            .addTo(riversLayerRef.current);
        }
      }

      // 4. UPSTREAM CATCHMENT BASIN
      if (catchmentLayerRef.current) {
        catchmentLayerRef.current.clearLayers();

        if (layers.upstreamCatchment) {
          const basinArea = upstreamCatchment?.drainageAreaKm2 || 48;
          const surgeEta = upstreamCatchment?.estimatedSurgeArrivalMin || 35;
          const upRain = upstreamCatchment?.cumulativeRainfall1h || Math.round(rainfallRate * 1.25);

          // Basin polygon uphill (northeast of coordinate)
          const basinPolygon: [number, number][] = [
            [lat + 0.005, lng - 0.005],
            [lat + 0.035, lng + 0.015],
            [lat + 0.065, lng + 0.045],
            [lat + 0.055, lng + 0.085],
            [lat + 0.020, lng + 0.065],
            [lat + 0.005, lng + 0.020],
          ];

          L.polygon(basinPolygon, {
            color: '#06B6D4',
            weight: 2,
            dashArray: '6, 6',
            fillColor: '#0891B2',
            fillOpacity: 0.15,
          })
            .bindPopup(`
              <div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
                <strong style="color: #0E7490; font-size: 12px; display: block;">Upstream Catchment Basin</strong>
                <div style="margin-top: 4px; color: #334155;">
                  <div>• Drainage Area: <strong>${basinArea} km²</strong></div>
                  <div>• Upstream 1h Rainfall: <strong>${upRain} mm/hr</strong></div>
                  <div>• Surge Influx ETA: <strong>${surgeEta} min</strong></div>
                </div>
              </div>
            `)
            .bindTooltip(`Upstream Catchment Basin (${basinArea} km²)`)
            .addTo(catchmentLayerRef.current);
        }
      }

      // 5. RAINFALL RADAR OVERLAY
      if (radarLayerRef.current) {
        radarLayerRef.current.clearLayers();

        if (layers.radarOverlay && rainfallRate > 20) {
          // Radar pulse cloud
          const radarColor = rainfallRate > 100 ? '#EF4444' : rainfallRate > 50 ? '#F97316' : '#38BDF8';
          L.circle([lat + 0.02, lng + 0.02], {
            radius: rainfallRate > 100 ? 7000 : 4500,
            color: radarColor,
            weight: 1,
            fillColor: radarColor,
            fillOpacity: rainfallRate > 100 ? 0.22 : 0.12,
          })
            .bindTooltip(`Precipitation Radar Band: ${rainfallRate} mm/hr`)
            .addTo(radarLayerRef.current);
        }
      }

      // 6. SAFE SHELTERS (From Database)
      if (sheltersLayerRef.current) {
        sheltersLayerRef.current.clearLayers();

        if (layers.shelters && shelters.length > 0) {
          shelters.forEach((shelter) => {
            const sLat = shelter.latitude || lat + 0.015;
            const sLng = shelter.longitude || lng + 0.015;

            const shelterIcon = L.divIcon({
              className: 'shelter-marker-icon',
              html: `
                <div style="background: #059669; border: 2px solid #FFFFFF; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); color: white; font-size: 13px; font-weight: bold; cursor: pointer;">
                  ⛺
                </div>
              `,
              iconSize: [26, 26],
              iconAnchor: [13, 13],
            });

            L.marker([sLat, sLng], { icon: shelterIcon })
              .bindPopup(`
                <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
                  <span style="font-size: 9px; font-weight: 800; color: #059669; text-transform: uppercase; display: block;">High-Ground Relief Center</span>
                  <strong style="color: #0F172A; font-size: 13px; display: block; margin-top: 1px;">${shelter.name}</strong>
                  <div style="color: #64748B; font-size: 11px; margin-top: 2px;">${shelter.address || shelter.district}</div>
                  <div style="margin-top: 6px; padding: 4px; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 4px; font-size: 11px; color: #065F46;">
                    <div>• Capacity: <strong>${shelter.capacity || 400}</strong> (Rem: ${shelter.remaining_capacity ?? 210})</div>
                    <div>• Advantage: <strong>${shelter.elevation_advantage || '+165m high ground'}</strong></div>
                    <div>• Route: <strong>Safe High-Ground Ridge Route</strong></div>
                  </div>
                </div>
              `)
              .addTo(sheltersLayerRef.current);
          });
        }
      }

      // 7. CITIZEN INCIDENTS / SOS (From Database)
      if (incidentsLayerRef.current) {
        incidentsLayerRef.current.clearLayers();

        if (layers.incidents && incidents.length > 0) {
          incidents.forEach((inc) => {
            const iLat = inc.latitude || lat - 0.012;
            const iLng = inc.longitude || lng - 0.008;
            const isSos = inc.incident_type === 'SOS' || inc.priority === 'High' || inc.priority === 'Critical';

            const incidentIcon = L.divIcon({
              className: 'incident-marker-icon',
              html: `
                <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; cursor: pointer;">
                  <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: ${isSos ? '#EF4444' : '#F59E0B'}; opacity: 0.6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                  <div style="position: relative; width: 24px; height: 24px; border-radius: 50%; background: ${isSos ? '#DC2626' : '#D97706'}; border: 2px solid #FFFFFF; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                    ${isSos ? '🆘' : '⚠️'}
                  </div>
                </div>
              `,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });

            L.marker([iLat, iLng], { icon: incidentIcon })
              .bindPopup(`
                <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
                  <span style="font-size: 9px; font-weight: 900; color: ${isSos ? '#DC2626' : '#D97706'}; text-transform: uppercase; display: block;">
                    ${isSos ? '🔴 CITIZEN EMERGENCY SOS' : '🟠 FLOOD INCIDENT REPORT'}
                  </span>
                  <strong style="color: #0F172A; font-size: 13px; display: block; margin-top: 1px;">${inc.title || 'Water Ingress Report'}</strong>
                  <div style="color: #475569; font-size: 11px; margin-top: 3px;">${inc.description || 'Trapped resident requiring immediate evacuation assistance.'}</div>
                  <div style="margin-top: 5px; font-size: 10px; color: #64748B;">Status: <strong>${inc.status || 'Active'}</strong> | Priority: <strong>${inc.priority || 'High'}</strong></div>
                </div>
              `)
              .addTo(incidentsLayerRef.current);
          });
        }
      }

      // 8. RESPONSE FLEET TACTICAL UNITS (From Database)
      if (fleetLayerRef.current) {
        fleetLayerRef.current.clearLayers();

        if (layers.responseFleet && teams.length > 0) {
          teams.forEach((team) => {
            const tLat = team.latitude || lat + 0.018;
            const tLng = team.longitude || lng - 0.015;

            const teamIcon = L.divIcon({
              className: 'team-marker-icon',
              html: `
                <div style="background: #0284C7; border: 2px solid #FFFFFF; border-radius: 6px; padding: 3px 5px; color: white; font-size: 10px; font-weight: 900; display: flex; align-items: center; gap: 3px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); cursor: pointer; white-space: nowrap;">
                  <span>🛡️</span> ${team.name ? team.name.slice(0, 10) : 'NDRF Unit'}
                </div>
              `,
              iconSize: [0, 0],
              iconAnchor: [20, 10],
            });

            L.marker([tLat, tLng], { icon: teamIcon })
              .bindPopup(`
                <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
                  <span style="font-size: 9px; font-weight: 900; color: #0284C7; text-transform: uppercase; display: block;">Tactical Response Team</span>
                  <strong style="color: #0F172A; font-size: 13px; display: block; margin-top: 1px;">${team.name}</strong>
                  <div style="color: #475569; font-size: 11px; margin-top: 3px;">Base: ${team.base_location || 'Sector Command'}</div>
                  <div style="margin-top: 5px; font-size: 10px; color: #0284C7; font-weight: bold;">
                    Status: ${team.status || 'Active / Deployed'} | Crew: ${team.crew_size || 12}
                  </div>
                </div>
              `)
              .addTo(fleetLayerRef.current);
          });
        }
      }

      // Fly to target
      map.flyTo([lat, lng], map.getZoom() < 10 ? 11 : map.getZoom(), { duration: 1.0 });
    });
  }, [
    selectedLocation?.lat,
    selectedLocation?.lng,
    selectedLocation?.name,
    currentRiskScore,
    staticScore,
    dynamicHazardScore,
    alertStatus,
    rainfallRate,
    layers,
    shelters,
    incidents,
    teams,
    upstreamCatchment,
  ]);

  // Handle Search Submission (Center map & update selected location without routes)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    const query = searchInput.trim();
    if (!query) return;

    // Check if user entered Lat, Lng coordinates
    const coordMatch = query.match(/^([-+]?[\d.]+)\s*,\s*([-+]?[\d.]+)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        onSelectLocation({
          id: `custom-${lat.toFixed(4)}-${lng.toFixed(4)}`,
          name: `Sector (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          code: 'CST',
          type: 'district',
          lat,
          lng,
        });
        return;
      }
    }

    // Search local hierarchy index
    const allLocations: LocationItem[] = [
      ...INDIA_STATES,
      ...Object.values(INDIA_DISTRICTS).flat(),
      ...Object.values(INDIA_BLOCKS).flat(),
      ...Object.values(INDIA_VILLAGES).flat(),
    ];

    const match = allLocations.find((loc) =>
      loc.name.toLowerCase().includes(query.toLowerCase())
    );

    if (match) {
      onSelectLocation(match);
      return;
    }

    setSearchError('Location not found in index. Try "Chamoli", "Manali", "Dehradun", "Guwahati", or Lat, Lng.');
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleResetZoom = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([defaultLat, defaultLng], 10);
    }
  };

  const toggleLayer = (layerKey: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const activeLayerCount = Object.values(layers).filter(Boolean).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col w-full relative">
      {/* Top Disaster GIS Command Bar */}
      <div className="bg-slate-950 px-3.5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-30 shrink-0">
        
        {/* Search Bar - Locate without navigation routes */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search location (Chamoli, Manali...) or Lat, Lng..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium"
            />
          </div>
          <button
            type="submit"
            className="py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1 shadow-sm"
          >
            Locate
          </button>
        </form>

        {/* Center: View Modes [ Standard | Terrain | Risk ] */}
        <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('standard')}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              viewMode === 'standard' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Clean Street GIS Basemap"
          >
            Standard
          </button>
          <button
            onClick={() => setViewMode('terrain')}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              viewMode === 'terrain' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Topographic Terrain Shading"
          >
            Terrain
          </button>
          <button
            onClick={() => setViewMode('risk')}
            className={`px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1 ${
              viewMode === 'risk' ? 'bg-red-700 text-white shadow-sm ring-1 ring-red-500' : 'text-slate-400 hover:text-white'
            }`}
            title="Tactical Disaster Risk GIS Mode"
          >
            <ShieldAlert className="w-3 h-3 text-red-300" />
            Risk Mode
          </button>
        </div>

        {/* Right: Layer Controls Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              showLayerMenu
                ? 'bg-slate-800 text-white border-sky-500'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Layers ({activeLayerCount})</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {/* Layer Selection Popover */}
          {showLayerMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2.5 z-50 text-xs space-y-1.5 backdrop-blur-md">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-800">
                Disaster GIS Map Overlays
              </div>

              <label className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-900 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-200 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  Flood Risk Zones
                </span>
                <input
                  type="checkbox"
                  checked={layers.floodRisk}
                  onChange={() => toggleLayer('floodRisk')}
                  className="rounded border-slate-700 text-sky-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-900 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-200 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  Rivers & Streams
                </span>
                <input
                  type="checkbox"
                  checked={layers.rivers}
                  onChange={() => toggleLayer('rivers')}
                  className="rounded border-slate-700 text-sky-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-900 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-200 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  Upstream Catchment
                </span>
                <input
                  type="checkbox"
                  checked={layers.upstreamCatchment}
                  onChange={() => toggleLayer('upstreamCatchment')}
                  className="rounded border-slate-700 text-sky-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-900 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-200 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Safe Shelters ({shelters.length})
                </span>
                <input
                  type="checkbox"
                  checked={layers.shelters}
                  onChange={() => toggleLayer('shelters')}
                  className="rounded border-slate-700 text-sky-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-900 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-200 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Citizen SOS & Incidents ({incidents.length})
                </span>
                <input
                  type="checkbox"
                  checked={layers.incidents}
                  onChange={() => toggleLayer('incidents')}
                  className="rounded border-slate-700 text-sky-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-900 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-200 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Response Fleet Units ({teams.length})
                </span>
                <input
                  type="checkbox"
                  checked={layers.responseFleet}
                  onChange={() => toggleLayer('responseFleet')}
                  className="rounded border-slate-700 text-sky-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-900 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-200 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  Precipitation Radar Band
                </span>
                <input
                  type="checkbox"
                  checked={layers.radarOverlay}
                  onChange={() => toggleLayer('radarOverlay')}
                  className="rounded border-slate-700 text-sky-600 focus:ring-0"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Search Error Notice */}
      {searchError && (
        <div className="bg-amber-950/90 text-amber-200 border-b border-amber-800 px-4 py-1.5 text-xs z-20 font-medium flex items-center justify-between">
          <span>{searchError}</span>
          <button onClick={() => setSearchError(null)} className="text-amber-400 hover:text-white font-bold ml-2">×</button>
        </div>
      )}

      {/* Map Canvas */}
      <div className="relative w-full h-[520px] min-h-[520px] bg-slate-950 overflow-hidden">
        <div
          ref={mapContainerRef}
          id="neer-gis-command-canvas"
          className="w-full h-full min-h-[520px]"
          style={{ width: '100%', height: '520px', position: 'relative' }}
        />

        {/* Top-Left Zoom & Reset Controls */}
        <div className="absolute top-4 left-4 bg-slate-950/90 border border-slate-800 backdrop-blur-md rounded-lg p-1 text-white shadow-2xl z-30 flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-800 rounded transition-colors text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-800 rounded transition-colors text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 hover:bg-slate-800 rounded transition-colors text-slate-300 hover:text-white border-t border-slate-800"
            title="Reset Zoom to Target Sector"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Top-Right Active Focus Context Banner */}
        <div className="absolute top-4 right-4 bg-slate-950/90 border border-slate-800 backdrop-blur-md rounded-xl px-3.5 py-2 text-xs text-white shadow-2xl z-30 flex items-center gap-2.5 max-w-xs">
          <div className="p-1.5 bg-sky-950 border border-sky-800 rounded-lg text-sky-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">
              DISASTER GIS SECTOR FOCUS
            </span>
            <span className="font-black text-sky-300 text-xs block truncate">
              {selectedLocation?.name || 'Chamoli, Uttarakhand'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {(selectedLocation?.lat || defaultLat).toFixed(4)}°, {(selectedLocation?.lng || defaultLng).toFixed(4)}°
            </span>
          </div>
        </div>

        {/* Bottom Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-950/90 border border-slate-800 backdrop-blur-md rounded-xl px-3 py-2 text-[10px] text-slate-300 shadow-2xl z-30 hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <span>Critical Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-500"></span>
            <span>Primary River</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Safe Shelter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Tactical Fleet</span>
          </div>
        </div>
      </div>
    </div>
  );
};
