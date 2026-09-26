export type UserRole = 'authority' | 'citizen' | 'response';

export type LanguageCode = 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr' | 'gu';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'UNASSESSED';

export interface LocationItem {
  id: string;
  name: string;
  code: string;
  type: 'state' | 'district' | 'block' | 'village';
  lat: number;
  lng: number;
  parentId?: string;
  riskLevel?: RiskLevel;
  susceptibilityScore?: number | null; // 0 - 100 or null if uncalculated
}

export interface GisFactors {
  elevation: number;        // Meters (m)
  slope: number;            // Degrees (°)
  distToRiver: number;      // Meters (m)
  distToStream: number;     // Meters (m)
  distToRoad: number;       // Meters (m)
  lulc: string;             // Land Use Land Cover category
  aspect: number;           // Degrees (°)
  twi: number;              // Topographic Wetness Index
  spi: number;              // Stream Power Index
  profileCurvature: number; // Curvature (-1 to +1)
  planCurvature: number;    // Curvature (-1 to +1)
}

export interface EnvironmentalData {
  rainfall1h: number;       // mm/hr
  rainfall24h: number;      // mm
  waterLevel: number;       // meters above danger mark
  dangerMarkLevel: number;  // meters
  dischargeRate: number;    // m^3/s
  reservoirCapacityPct: number; // %
  radarStormTrend: 'RISING' | 'STABLE' | 'RECEDING';
  lastMeasured: string;
}

export interface LocationRiskDetail {
  location: LocationItem;
  factors: GisFactors;
  environmental: EnvironmentalData;
  contributingFactors: { name: string; weightPct: number; impact: 'HIGH' | 'MEDIUM' | 'LOW' }[];
  evacuationStatus: 'READY' | 'ADVISORY_ISSUED' | 'EVACUATION_MANDATORY';
  historicalEventsCount: number;
  isDemoData: boolean;
}

export interface AlertIncident {
  id: string;
  title: string;
  locationName: string;
  targetState?: string;
  targetDistrict?: string;
  targetBlock?: string;
  targetVillage?: string;
  severity: RiskLevel;
  type: 'FLASH_FLOOD_WARNING' | 'RIVER_OVERFLOW' | 'DAM_DISCHARGE' | 'HEAVY_RAINFALL' | 'LANDSLIDE_RISK';
  timestamp: string;
  affectedPopulationEstimate: number;
  recommendedAction: string;
  status: 'ACTIVE' | 'DISPATCHED' | 'RESOLVED';
  isDemoData: boolean;
}

export interface FieldEvidence {
  id: string;
  source: 'CITIZEN' | 'RESPONSE_FLEET';
  uploaderName: string;
  incidentId?: string;
  locationName: string;
  lat: number;
  lng: number;
  timestamp: string;
  imageUrl?: string;
  photoData?: string;
  description: string;
}

export interface SosCall {
  id: string;
  citizenName: string;
  phone: string;
  lat: number;
  lng: number;
  address: string;
  peopleCount: number;
  details: string;
  urgency: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  timestamp: string;
  status: 'PENDING' | 'ASSIGNED' | 'RESCUED';
  assignedUnitId?: string;
  evidenceId?: string;
  isDemoData: boolean;
}

export interface ResponseUnit {
  id: string;
  name: string;
  type: 'NDRF_TEAM' | 'SDRF_BOAT_UNIT' | 'COAST_GUARD' | 'MEDICAL_HELICOPTER' | 'LOCAL_POLICE';
  status: 'AVAILABLE' | 'EN_ROUTE' | 'ON_SCENE' | 'OFF_DUTY';
  currentLat: number;
  currentLng: number;
  assignedIncidentId?: string;
  teamSize: number;
  contactNumber: string;
}
