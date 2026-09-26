/**
 * NEER Dynamic Flash-Flood Risk & Early-Warning Calculation Engine
 * 
 * Conceptual Model:
 * STATIC TERRAIN SUSCEPTIBILITY (11 GIS Factors)
 * +
 * DYNAMIC HYDRO-METEOROLOGICAL HAZARD (Precipitation Rate 0-150 mm/hr, Upstream Surge, River Stage)
 * ==============================================================================================
 * CURRENT FLASH-FLOOD RISK (0 - 100%)
 * 
 * Deterministic, transparent, and explainable hydro-geomorphic modeling for hilly/mountainous terrain.
 */

import { GisFactors, RiskLevel, LocationItem } from '@/lib/types';

export interface DynamicHazardInput {
  rainfallRate: number; // mm/hr (0 - 150)
  upstreamRainfall1h?: number; // mm
  upstreamRainfall3h?: number; // mm
  riverCondition?: 'NORMAL' | 'WARNING' | 'DANGER';
}

export interface DynamicHazardResult {
  hazardScore: number; // 0 - 100
  hazardLevel: 'NORMAL' | 'HEAVY_RAIN_SURGE' | 'CLOUDBURST_WARNING';
  rainfallThresholdLabel: string;
  riverCondition: 'NORMAL' | 'WARNING' | 'DANGER';
}

export interface CurrentRiskEvaluation {
  staticSusceptibility: number; // 0 - 100%
  dynamicHazard: number;        // 0 - 100%
  currentRiskScore: number;     // 0 - 100%
  riskLevel: RiskLevel;         // 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  alertStatus: 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
  statusTitle: string;
  responseRecommendation: string;
  evacuationRouteGuidance: string;
}

export interface UpstreamCatchmentData {
  drainageAreaKm2: number;
  cumulativeRainfall1h: number;
  cumulativeRainfall3h: number;
  estimatedSurgeArrivalMin: number;
  hydrologicalHeadKm: number;
  isModelEstimate: boolean;
  estimateDisclaimer: string;
}

export interface DataSourcePillar {
  id: string;
  name: string;
  provider: string;
  category: 'TERRAIN' | 'METEOROLOGICAL' | 'HYDROLOGICAL' | 'GROUND_EVIDENCE';
  status: 'CONNECTED' | 'ACTIVE' | 'NORMAL' | 'WARNING' | 'DANGER' | 'SIMULATION';
  metricLabel: string;
  metricValue: string;
  isLive: boolean;
}

// -------------------------------------------------------------
// 1. Static 11-Factor Terrain Susceptibility Calculator
// -------------------------------------------------------------
export function calculate11FactorSusceptibility(f: GisFactors): number {
  // Physical geomorphic sub-scores (0 - 100)
  const riverScore = Math.max(0, Math.min(100, 100 - (Number(f.distToRiver) / 2200) * 100));
  const elevScore = Math.max(0, Math.min(100, 100 - (Number(f.elevation) / 1000) * 100));
  const slopeScore = Math.max(0, Math.min(100, 100 - (Number(f.slope) / 28) * 100));
  const streamScore = Math.max(0, Math.min(100, 100 - (Number(f.distToStream) / 1200) * 100));
  const twiScore = Math.max(0, Math.min(100, (Number(f.twi) / 14) * 100));
  const spiScore = Math.max(0, Math.min(100, (Number(f.spi) / 18) * 100));

  // LULC weighting
  let lulcScore = 50;
  const lulcStr = String(f.lulc || '').toLowerCase();
  if (lulcStr.includes('water') || lulcStr.includes('wetland')) lulcScore = 95;
  else if (lulcStr.includes('built') || lulcStr.includes('urban')) lulcScore = 80;
  else if (lulcStr.includes('agri') || lulcStr.includes('floodplain')) lulcScore = 70;
  else if (lulcStr.includes('scrub') || lulcStr.includes('bare')) lulcScore = 40;
  else if (lulcStr.includes('forest')) lulcScore = 20;

  const roadScore = Math.max(0, Math.min(100, 100 - (Number(f.distToRoad) / 1200) * 100));
  const aspectScore = Math.min(100, Math.max(0, (Number(f.aspect) / 360) * 100));
  const profScore = Math.min(100, Math.max(0, 50 - Number(f.profileCurvature) * 12));
  const planScore = Math.min(100, Math.max(0, 50 - Number(f.planCurvature) * 12));

  // NEER Weighted Composite
  const weighted = Math.round(
    riverScore * 0.23 +
    elevScore * 0.20 +
    slopeScore * 0.18 +
    streamScore * 0.12 +
    twiScore * 0.10 +
    lulcScore * 0.07 +
    spiScore * 0.04 +
    roadScore * 0.02 +
    profScore * 0.02 +
    planScore * 0.01 +
    aspectScore * 0.01
  );

  return Math.min(99, Math.max(5, weighted));
}

// -------------------------------------------------------------
// 2. Dynamic Hydro-Meteorological Hazard Calculator
// -------------------------------------------------------------
export function calculateDynamicHazard(input: DynamicHazardInput): DynamicHazardResult {
  const rainfall = Math.max(0, Math.min(150, Number(input.rainfallRate) || 0));
  let riverCondition = input.riverCondition;

  // Auto-escalate river condition if rainfall reaches surge levels
  if (!riverCondition) {
    if (rainfall > 100) riverCondition = 'DANGER';
    else if (rainfall > 50) riverCondition = 'WARNING';
    else riverCondition = 'NORMAL';
  }

  let hazardScore: number;
  let hazardLevel: 'NORMAL' | 'HEAVY_RAIN_SURGE' | 'CLOUDBURST_WARNING';
  let rainfallThresholdLabel: string;

  if (rainfall > 100) {
    // Cloudburst Warning (> 100 mm/hr)
    hazardLevel = 'CLOUDBURST_WARNING';
    rainfallThresholdLabel = 'Cloudburst Warning (>100 mm/hr)';
    // Scale 100-150 mm/hr into 85-100 hazard score
    hazardScore = Math.round(85 + ((rainfall - 100) / 50) * 15);
  } else if (rainfall > 50) {
    // Heavy Rain Surge (50 - 100 mm/hr)
    hazardLevel = 'HEAVY_RAIN_SURGE';
    rainfallThresholdLabel = 'Heavy Rain Surge (50-100 mm/hr)';
    // Scale 50-100 mm/hr into 50-84 hazard score
    hazardScore = Math.round(50 + ((rainfall - 50) / 50) * 34);
  } else {
    // Normal / Monitored (0 - 50 mm/hr)
    hazardLevel = 'NORMAL';
    rainfallThresholdLabel = 'Normal / Monitored (0-50 mm/hr)';
    // Scale 0-50 mm/hr into 5-49 hazard score
    hazardScore = Math.round(5 + (rainfall / 50) * 44);
  }

  // River stage modifier (+5 for warning, +10 for danger)
  if (riverCondition === 'DANGER') {
    hazardScore = Math.min(100, hazardScore + 8);
  } else if (riverCondition === 'WARNING') {
    hazardScore = Math.min(100, hazardScore + 4);
  }

  return {
    hazardScore: Math.min(100, Math.max(0, hazardScore)),
    hazardLevel,
    rainfallThresholdLabel,
    riverCondition,
  };
}

// -------------------------------------------------------------
// 3. Combined Current Flash-Flood Risk Evaluator
// -------------------------------------------------------------
export function calculateCurrentRisk(
  staticSusceptibility: number,
  dynamicHazard: number,
  rainfallRate: number
): CurrentRiskEvaluation {
  // Mountain flash-flood coupling:
  // When rainfall is low (0-20 mm/hr), ambient terrain susceptibility dominates baseline risk.
  // When rainfall reaches surge (>50) or cloudburst (>100), dynamic hazard strongly governs flood impact.
  let dynamicWeight = 0.60;
  let staticWeight = 0.40;

  if (rainfallRate > 100) {
    // Cloudburst: Hydro-meteorological forcing is overwhelmingly dominant
    dynamicWeight = 0.75;
    staticWeight = 0.25;
  } else if (rainfallRate > 50) {
    dynamicWeight = 0.65;
    staticWeight = 0.35;
  }

  const rawScore = Math.round(staticSusceptibility * staticWeight + dynamicHazard * dynamicWeight);
  
  // Guarantee thresholds as mandated by requirements:
  // > 100 mm/hr -> Cloudburst / CRITICAL (score >= 75%)
  // > 50 mm/hr -> Heavy Rain Surge (score >= 55% if static susceptibility is >= 40%)
  let currentRiskScore = rawScore;
  if (rainfallRate > 100) {
    currentRiskScore = Math.max(76, rawScore);
  } else if (rainfallRate > 50) {
    currentRiskScore = Math.max(56, rawScore);
  }

  currentRiskScore = Math.min(100, Math.max(5, currentRiskScore));

  let riskLevel: RiskLevel = 'LOW';
  let alertStatus: 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL' = 'NORMAL';
  let statusTitle = 'Normal Conditions — Routine Monitoring';
  let responseRecommendation = 'Standard hydrological monitoring. Maintain regular gauge observations.';
  let evacuationRouteGuidance = 'Normal road corridors open. Routine transit permitted.';

  if (currentRiskScore >= 75) {
    riskLevel = 'CRITICAL';
    alertStatus = 'CRITICAL';
    statusTitle = rainfallRate > 100 
      ? 'CRITICAL ALERT: Cloudburst Flash-Flood Surge Imminent' 
      : 'CRITICAL ALERT: Severe Inundation Threat';
    responseRecommendation = 'MANDATORY EVACUATION: Immediate alert to District Magistrate, NDRF, and SDRF teams. Evacuate low-lying riverbank wards to designated high-ground shelters.';
    evacuationRouteGuidance = 'USE HIGH-GROUND RIDGE ROUTES ONLY. Avoid river-parallel roads and gorge crossings prone to debris flow.';
  } else if (currentRiskScore >= 55) {
    riskLevel = 'HIGH';
    alertStatus = 'WARNING';
    statusTitle = 'WARNING: Heavy Rain Surge & Stream Overtopping';
    responseRecommendation = 'ADVISORY ISSUED: Mobilize local emergency response teams. Stage rescue boats and high-clearance vehicles. Restrict movement along watercourses.';
    evacuationRouteGuidance = 'Caution on valley road links. Direct vulnerable populations toward higher tier shelters.';
  } else if (currentRiskScore >= 35) {
    riskLevel = 'MODERATE';
    alertStatus = 'WATCH';
    statusTitle = 'WATCH: Elevated Moisture & Streamflow';
    responseRecommendation = 'MONITORING ACTIVE: Verify automatic weather stations and gauge telemetries every 15 minutes.';
    evacuationRouteGuidance = 'All standard transport corridors operational.';
  }

  return {
    staticSusceptibility,
    dynamicHazard,
    currentRiskScore,
    riskLevel,
    alertStatus,
    statusTitle,
    responseRecommendation,
    evacuationRouteGuidance,
  };
}

// -------------------------------------------------------------
// 4. Upstream Catchment & Surge Arrival Calculator
// -------------------------------------------------------------
export function calculateUpstreamCatchment(
  location: LocationItem,
  elevation: number,
  rainfallRate: number
): UpstreamCatchmentData {
  // Deterministic basin characteristics based on mountain coordinates
  const latFactor = (location.lat % 1) * 10;
  const lngFactor = (location.lng % 1) * 10;
  
  // Drainage area in km² (typically 25 - 65 km² for mountain catchment headwaters)
  const drainageAreaKm2 = parseFloat((32.0 + (latFactor * 1.8 + lngFactor * 0.7)).toFixed(1));
  
  // Upstream hydrological distance (km) from catchment crest to focal point
  const hydrologicalHeadKm = parseFloat((9.5 + (lngFactor * 0.6)).toFixed(1));

  // Upstream precipitation is typically 15-25% higher at higher elevations (orographic effect)
  const orographicMultiplier = elevation > 1500 ? 1.25 : 1.12;
  const cumulativeRainfall1h = parseFloat((rainfallRate * orographicMultiplier).toFixed(1));
  const cumulativeRainfall3h = parseFloat((cumulativeRainfall1h * 1.85).toFixed(1));

  // Hydraulic flood wave celerity in steep mountain gorges:
  // V ≈ 2.8 - 4.5 m/s (approx 10 - 16 km/h)
  const torrentSpeedKmh = 14.2; // km/h
  const rawEtaMin = Math.round((hydrologicalHeadKm / torrentSpeedKmh) * 60);
  
  // High rainfall accelerates stream channel velocity
  const velocityAccelerationFactor = rainfallRate > 100 ? 0.75 : rainfallRate > 50 ? 0.88 : 1.0;
  const estimatedSurgeArrivalMin = Math.max(15, Math.min(90, Math.round(rawEtaMin * velocityAccelerationFactor)));

  return {
    drainageAreaKm2,
    cumulativeRainfall1h,
    cumulativeRainfall3h,
    estimatedSurgeArrivalMin,
    hydrologicalHeadKm,
    isModelEstimate: true,
    estimateDisclaimer: 'Hydrological Model Estimate (Simulation / Model Calculated — Not Official IMD/CWC Measurement)',
  };
}
