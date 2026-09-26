import { GisFactors } from '../types';

export interface GisFactorMetadata {
  key: keyof GisFactors;
  name: string;
  unit: string;
  description: string;
  category: 'Topographic' | 'Hydrological' | 'Infrastructural' | 'Environmental';
  typicalWeight: number; // Percentage weight in default susceptibility indexing
}

export const GIS_FACTOR_DEFINITIONS: GisFactorMetadata[] = [
  {
    key: 'elevation',
    name: 'Elevation',
    unit: 'm',
    description: 'Digital Elevation Model (DEM) height. Low elevation areas accumulate runoff rapidly.',
    category: 'Topographic',
    typicalWeight: 15,
  },
  {
    key: 'slope',
    name: 'Slope',
    unit: '°',
    description: 'Terrain steepness angle. Flat terrains (0°–5°) retain water and experience slow drainage.',
    category: 'Topographic',
    typicalWeight: 14,
  },
  {
    key: 'distToRiver',
    name: 'Distance to River',
    unit: 'm',
    description: 'Euclidean distance to primary river channels. Buffer zones < 500m face high inundation risk.',
    category: 'Hydrological',
    typicalWeight: 16,
  },
  {
    key: 'distToStream',
    name: 'Distance to Stream',
    unit: 'm',
    description: 'Proximity to secondary streams and drainage canals for localized surface surge.',
    category: 'Hydrological',
    typicalWeight: 12,
  },
  {
    key: 'distToRoad',
    name: 'Distance to Road',
    unit: 'm',
    description: 'Impervious transportation infrastructure blocking natural drainage networks.',
    category: 'Infrastructural',
    typicalWeight: 7,
  },
  {
    key: 'lulc',
    name: 'Land Cover / LULC',
    unit: 'Class',
    description: 'Land Use & Land Cover classification (Built-up, Waterbodies, Agriculture, Dense Forest).',
    category: 'Environmental',
    typicalWeight: 10,
  },
  {
    key: 'aspect',
    name: 'Aspect',
    unit: '°',
    description: 'Compass direction terrain slope faces, influencing solar exposure and soil moisture.',
    category: 'Topographic',
    typicalWeight: 4,
  },
  {
    key: 'twi',
    name: 'Topographic Wetness Index (TWI)',
    unit: 'index',
    description: 'twi = ln(a / tan b). Quantifies topographic control on hydrological processes and saturation.',
    category: 'Hydrological',
    typicalWeight: 11,
  },
  {
    key: 'spi',
    name: 'Stream Power Index (SPI)',
    unit: 'index',
    description: 'Measures erosive power of flowing water based on specific catchment area.',
    category: 'Hydrological',
    typicalWeight: 6,
  },
  {
    key: 'profileCurvature',
    name: 'Profile Curvature',
    unit: 'index',
    description: 'Curvature parallel to maximum slope direction. Governs acceleration/deceleration of flow.',
    category: 'Topographic',
    typicalWeight: 2.5,
  },
  {
    key: 'planCurvature',
    name: 'Plan Curvature',
    unit: 'index',
    description: 'Curvature perpendicular to maximum slope direction. Governs flow convergence/divergence.',
    category: 'Topographic',
    typicalWeight: 2.5,
  },
];

/**
 * Calculates a baseline GIS Susceptibility Score from 11 normalized factor values.
 * Note: This is an analytical baseline fallback algorithm; live AI predictions will override when ML backend connects.
 */
export function calculateBaselineGisScore(factors: GisFactors): number {
  // Elevation score: lower elevation -> higher risk (0-100m highest risk)
  const elevScore = Math.max(0, 100 - (factors.elevation / 500) * 100);
  
  // Slope score: flatter slope -> higher accumulation risk (< 5deg highest)
  const slopeScore = Math.max(0, 100 - (factors.slope / 45) * 100);
  
  // Dist to River score: closer -> higher risk (< 300m highest)
  const riverScore = Math.max(0, 100 - (factors.distToRiver / 3000) * 100);

  // Dist to Stream score
  const streamScore = Math.max(0, 100 - (factors.distToStream / 1500) * 100);

  // TWI score: higher TWI -> higher saturation
  const twiScore = Math.min(100, (factors.twi / 15) * 100);

  // SPI score
  const spiScore = Math.min(100, (factors.spi / 25) * 100);

  // Weighted composite score calculation
  const composite = 
    elevScore * 0.22 +
    slopeScore * 0.18 +
    riverScore * 0.25 +
    streamScore * 0.15 +
    twiScore * 0.12 +
    spiScore * 0.08;

  return Math.round(Math.min(99, Math.max(5, composite)));
}
