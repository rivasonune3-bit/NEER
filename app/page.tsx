'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/common/Header';
import { SystemStatusBanner } from '@/components/common/SystemStatusBanner';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { LocationHierarchy } from '@/components/dashboard/LocationHierarchy';
import { IndiaMap } from '@/components/dashboard/IndiaMap';
import { FloodRiskFactorsSection } from '@/components/dashboard/FloodRiskFactorsSection';
import { DynamicHazardControl } from '@/components/dashboard/DynamicHazardControl';
import { UpstreamCatchmentCard } from '@/components/dashboard/UpstreamCatchmentCard';
import { MultiSourceDataCard } from '@/components/dashboard/MultiSourceDataCard';
import { NearbySheltersCard } from '@/components/dashboard/NearbySheltersCard';
import { RiskSummary } from '@/components/dashboard/RiskSummary';
import { EnvironmentalPanel } from '@/components/dashboard/EnvironmentalPanel';
import { AlertList } from '@/components/dashboard/AlertList';
import { IncidentList } from '@/components/dashboard/IncidentList';
import { CommandOperationsDrawer } from '@/components/dashboard/CommandOperationsDrawer';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LocationItem, LocationRiskDetail, GisFactors, AlertIncident, SosCall } from '@/lib/types';
import { 
  INDIA_STATES, 
  INDIA_DISTRICTS, 
  INDIA_BLOCKS, 
  INDIA_VILLAGES
} from '@/lib/data/indiaLocations';
import { calculateLocationRisk } from '@/lib/gis/syntheticProvider';
import { 
  calculate11FactorSusceptibility, 
  calculateDynamicHazard, 
  calculateCurrentRisk, 
  calculateUpstreamCatchment 
} from '@/lib/services/dynamicRiskService';
import { workflowService } from '@/lib/services/workflowService';
import { useRealtimeSync } from '@/lib/services/realtimeSync';

export default function AuthorityCommandDashboard() {
  // Cascading location selection state (Default: Uttarakhand -> Chamoli)
  const defaultState = INDIA_STATES.find(s => s.id === 'st-uk') || INDIA_STATES[0];
  const defaultDistrict = INDIA_DISTRICTS['st-uk']?.[0] || null;

  const [selectedState, setSelectedState] = useState<LocationItem | null>(defaultState);
  const [selectedDistrict, setSelectedDistrict] = useState<LocationItem | null>(defaultDistrict);
  const [selectedBlock, setSelectedBlock] = useState<LocationItem | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<LocationItem | null>(null);

  // Dynamic Meteorological State (Default: 14 mm/hr routine precipitation)
  const [rainfallRate, setRainfallRate] = useState<number>(14);
  const [isScenarioActive, setIsScenarioActive] = useState<boolean>(false);
  const [scenarioGisOverride, setScenarioGisOverride] = useState<GisFactors | null>(null);

  // Real SQLite Operational Feeds: Active Advisories & Citizen SOS Queue
  const [activeAlerts, setActiveAlerts] = useState<AlertIncident[]>([]);
  const [activeSosList, setActiveSosList] = useState<SosCall[]>([]);

  // Active focused location
  const currentFocusLocation: LocationItem = 
    selectedVillage || selectedBlock || selectedDistrict || selectedState || defaultState;

  // Dynamically calculate deterministic 11 factors & risk result for focused location
  const riskDetail: LocationRiskDetail = calculateLocationRisk(
    currentFocusLocation.lat,
    currentFocusLocation.lng,
    currentFocusLocation.name
  );

  // Active GIS factors (allows scenario simulation override)
  const activeGisFactors: GisFactors = scenarioGisOverride || riskDetail.factors;

  // 1. Static Susceptibility from 11 GIS factors
  const staticScore = calculate11FactorSusceptibility(activeGisFactors);

  // 2. Dynamic Hazard from Rainfall & River conditions
  const dynamicHazardResult = calculateDynamicHazard({ rainfallRate });

  // 3. Combined Current Flash-Flood Risk (0 - 100%)
  const currentRiskEvaluation = calculateCurrentRisk(
    staticScore,
    dynamicHazardResult.hazardScore,
    rainfallRate
  );

  // 4. Upstream Catchment & Surge Influx Metrics
  const upstreamCatchmentData = calculateUpstreamCatchment(
    currentFocusLocation,
    activeGisFactors.elevation,
    rainfallRate
  );

  // Phase 5: Controlled Judge Demo Scenario (Simulate Cloudburst)
  const handleSimulateCloudburst = () => {
    setIsScenarioActive(true);
    setRainfallRate(110); // Cloudburst threshold (> 100 mm/hr)
    setScenarioGisOverride({
      ...riskDetail.factors,
      distToRiver: 80, // Riverbank proximity
      slope: 28.5,
    });
  };

  const handleResetScenario = () => {
    setIsScenarioActive(false);
    setRainfallRate(14); // Baseline
    setScenarioGisOverride(null);
  };

  // Load real operational feeds (Advisories & Citizen SOS calls) from database
  const loadOperationalFeeds = useCallback(async () => {
    try {
      const [alertsData, incidentsData] = await Promise.all([
        workflowService.getAlerts(),
        workflowService.getIncidents()
      ]);

      const locClean = currentFocusLocation.name.toLowerCase();
      const distClean = (selectedDistrict?.name || currentFocusLocation.name).toLowerCase();

      // Transform and filter real active alerts
      if (Array.isArray(alertsData) && alertsData.length > 0) {
        const validAlerts = alertsData.filter(a => a.status === 'Active' || a.status === 'Approved');
        const sectorAlerts = validAlerts.filter(a => {
          const l = (a.location_name || '').toLowerCase();
          const d = (a.district_id || '').toLowerCase();
          const t = (a.target_area || '').toLowerCase();
          return l.includes(locClean) || l.includes(distClean) || d.includes(distClean) || t.includes(locClean);
        });

        const listToMap = sectorAlerts.length > 0 ? sectorAlerts : validAlerts;

        const mappedAlerts: AlertIncident[] = listToMap.map(a => {
          let sev: any = 'WARNING';
          const s = (a.severity || '').toUpperCase();
          if (s === 'CRITICAL' || s === 'EMERGENCY') sev = 'CRITICAL';
          else if (s === 'WARNING') sev = 'WARNING';
          else if (s === 'WATCH') sev = 'WATCH';
          else sev = 'ADVISORY';

          let timeStr = 'Just now';
          try {
            const d = new Date(a.created_at);
            timeStr = `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
          } catch (e) {}

          return {
            id: a.id,
            title: a.title,
            locationName: a.location_name,
            severity: sev,
            type: (a.alert_type as any) || 'FLASH_FLOOD_WARNING',
            timestamp: timeStr,
            affectedPopulationEstimate: a.recipient_count || 0,
            recommendedAction: a.recommended_action || 'Evacuate to high ground',
            status: a.status === 'Active' ? 'ACTIVE' : 'RESOLVED',
            isDemoData: false
          };
        });

        setActiveAlerts(mappedAlerts);
      } else {
        setActiveAlerts([]);
      }

      // Transform and filter real incidents
      if (Array.isArray(incidentsData) && incidentsData.length > 0) {
        const openIncidents = incidentsData.filter(i => 
          i.status !== 'Closed' && i.status !== 'Rejected'
        );

        const sectorIncidents = openIncidents.filter(i => {
          const l = (i.location_name || '').toLowerCase();
          return l.includes(locClean) || l.includes(distClean) || locClean.includes(l);
        });

        const listToMap = sectorIncidents.length > 0 ? sectorIncidents : openIncidents;

        const mappedSos: SosCall[] = listToMap.map(i => {
          let urg: any = 'HIGH';
          const p = (i.priority || '').toUpperCase();
          if (p === 'CRITICAL') urg = 'CRITICAL';
          else if (p === 'LOW') urg = 'MEDIUM';

          let timeStr = 'Active';
          try {
            const d = new Date(i.created_at);
            timeStr = `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          } catch (e) {}

          return {
            id: i.id,
            citizenName: i.reported_by || 'Resident Citizen',
            phone: i.reported_phone || '+91 98640 12345',
            lat: i.latitude || currentFocusLocation.lat,
            lng: i.longitude || currentFocusLocation.lng,
            address: i.location_name,
            peopleCount: 4,
            details: i.description,
            urgency: urg,
            timestamp: timeStr,
            status: i.status === 'Resolved' ? 'RESCUED' : 'PENDING',
            assignedUnitId: i.assigned_team_id,
            isDemoData: false
          };
        });

        setActiveSosList(mappedSos);
      } else {
        setActiveSosList([]);
      }
    } catch (err) {
      console.error('Failed to load operational feeds:', err);
    }
  }, [currentFocusLocation.name, selectedDistrict?.name]);

  useEffect(() => {
    loadOperationalFeeds();
  }, [loadOperationalFeeds]);

  // Real-time synchronization: refresh immediately on broadcasts or incident reports
  useRealtimeSync({
    onEvent: () => {
      loadOperationalFeeds();
    }
  });

  const handleResolveIncident = async (id: string) => {
    try {
      await workflowService.closeIncident(id);
      loadOperationalFeeds();
    } catch (err) {
      console.error('Error closing incident:', err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['AUTHORITY']}>
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      
      {/* System Data Transparency Banner */}
      <SystemStatusBanner />

      {/* 1. Dark Navy Top Header */}
      <Header currentRole="authority" />

      {/* Main Command Center Layout */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 py-5 space-y-5">
        
        {/* 2. Top Overview Summary Cards */}
        <SummaryCards />

        {/* 3. Main Three-Column Interactive GIS & Flash-Flood Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Panel (Col 1 - 4 cols): Location Hierarchy, Dynamic Hazard, 11 Static GIS Factors */}
          <div className="lg:col-span-4 space-y-4">
            {/* Location Hierarchy Drill-Down Selector */}
            <LocationHierarchy
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              selectedBlock={selectedBlock}
              selectedVillage={selectedVillage}
              onSelectState={(st) => {
                setSelectedState(st);
                setSelectedDistrict(INDIA_DISTRICTS[st.id]?.[0] || null);
                setSelectedBlock(null);
                setSelectedVillage(null);
              }}
              onSelectDistrict={(dt) => {
                setSelectedDistrict(dt);
                setSelectedBlock(INDIA_BLOCKS[dt.id]?.[0] || null);
                setSelectedVillage(null);
              }}
              onSelectBlock={(bl) => {
                setSelectedBlock(bl);
                setSelectedVillage(INDIA_VILLAGES[bl.id]?.[0] || null);
              }}
              onSelectVillage={(vl) => setSelectedVillage(vl)}
            />

            {/* Phase 1 & 5: Dynamic Rainfall / Cloudburst Hazard Control */}
            <DynamicHazardControl
              rainfallRate={rainfallRate}
              onRainfallChange={setRainfallRate}
              hazardResult={dynamicHazardResult}
              isScenarioActive={isScenarioActive}
              onSimulateCloudburst={handleSimulateCloudburst}
              onResetScenario={handleResetScenario}
            />

            {/* 11 Static GIS Factors & Combined Risk Recalculator */}
            <FloodRiskFactorsSection
              factors={activeGisFactors}
              locationName={currentFocusLocation.name}
              rainfallRate={rainfallRate}
              onRainfallChange={setRainfallRate}
              isScenarioActive={isScenarioActive}
              onResetScenario={handleResetScenario}
            />

          </div>

          {/* Center Panel (Col 2 - 5 cols): Interactive Map, Upstream Basin, Multi-Source Pillars */}
          <div className="lg:col-span-5 space-y-4">
            <IndiaMap
              selectedLocation={currentFocusLocation}
              onSelectLocation={(loc) => {
                if (loc.type === 'state') {
                  setSelectedState(loc);
                  setSelectedDistrict(INDIA_DISTRICTS[loc.id]?.[0] || null);
                  setSelectedBlock(null);
                  setSelectedVillage(null);
                } else if (loc.type === 'district') {
                  setSelectedDistrict(loc);
                  setSelectedBlock(null);
                  setSelectedVillage(null);
                } else if (loc.type === 'block') {
                  setSelectedBlock(loc);
                  setSelectedVillage(null);
                } else if (loc.type === 'village') {
                  setSelectedVillage(loc);
                } else {
                  setSelectedDistrict(loc);
                  setSelectedBlock(null);
                  setSelectedVillage(null);
                }
              }}
              currentRiskScore={currentRiskEvaluation.currentRiskScore}
              staticScore={currentRiskEvaluation.staticSusceptibility}
              dynamicHazardScore={currentRiskEvaluation.dynamicHazard}
              alertStatus={currentRiskEvaluation.alertStatus}
              rainfallRate={rainfallRate}
              upstreamCatchment={upstreamCatchmentData}
            />

            {/* Phase 2: Upstream Catchment & Surge Arrival ETA */}
            <UpstreamCatchmentCard
              data={upstreamCatchmentData}
              locationName={currentFocusLocation.name}
            />

            {/* Phase 3: Multi-Source Data Visibility (4 Pillars) */}
            <MultiSourceDataCard
              rainfallRate={rainfallRate}
              riverCondition={dynamicHazardResult.riverCondition}
            />
          </div>

          {/* Right Panel (Col 3 - 3 cols): Operational Risk Summary & Nearest Safe Shelters */}
          <div className="lg:col-span-3 space-y-4">
            <RiskSummary
              detail={riskDetail}
              currentRiskScore={currentRiskEvaluation.currentRiskScore}
              staticScore={currentRiskEvaluation.staticSusceptibility}
              dynamicHazardScore={currentRiskEvaluation.dynamicHazard}
              alertStatus={currentRiskEvaluation.alertStatus}
              rainfallRate={rainfallRate}
              upstreamRainfall={upstreamCatchmentData.cumulativeRainfall1h}
              riverCondition={dynamicHazardResult.riverCondition}
              surgeEtaMin={upstreamCatchmentData.estimatedSurgeArrivalMin}
              recommendation={currentRiskEvaluation.responseRecommendation}
              evacuationGuidance={currentRiskEvaluation.evacuationRouteGuidance}
            />

            {/* Phase 6: Nearest Safe Shelters & Evacuation Routes */}
            <NearbySheltersCard
              locationLat={currentFocusLocation.lat}
              locationLng={currentFocusLocation.lng}
              locationName={currentFocusLocation.name}
              state={selectedState?.name}
              district={selectedDistrict?.name}
              isCriticalAlert={currentRiskEvaluation.alertStatus === 'CRITICAL'}
            />
          </div>

        </div>

        {/* 4. Lower Dashboard Monitoring Section */}
        <div className="space-y-5">
          {/* Environmental Hydro & Rainfall Telemetry */}
          <EnvironmentalPanel
            data={riskDetail.environmental}
            locationName={currentFocusLocation.name}
          />

          {/* 2-Column Lower Grid: Active Alerts & Incident Queue */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AlertList alerts={activeAlerts} />
            <IncidentList incidents={activeSosList} onResolve={handleResolveIncident} />
          </div>
        </div>

      </main>

      {/* Tactical Operations Drawer: Citizen & Response Team Closed-Loop Coordination */}
      <CommandOperationsDrawer
        selectedLocation={currentFocusLocation}
        currentRiskScore={currentRiskEvaluation.currentRiskScore}
        alertStatus={currentRiskEvaluation.alertStatus}
        rainfallRate={rainfallRate}
      />

      {/* Command Center Footer */}
      <footer className="bg-[#0B192C] border-t border-slate-800 text-slate-400 text-xs py-4 px-6 mt-8">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">NEER — FlashFlood Prediction & Early-Warning System</span>
            <span>| National Disaster Management Authority (NDMA)</span>
          </div>
        </div>
      </footer>

    </div>
    </ProtectedRoute>
  );
}
