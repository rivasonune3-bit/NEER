import { fetchApi, ApiResponse } from './apiClient';

export interface DataSourceItem {
  source_id: string;
  source_name: string;
  provider: string;
  dataset_name: string;
  data_type: string;
  geographic_coverage: string;
  spatial_resolution: string;
  temporal_resolution: string;
  format: string;
  access_method: string;
  source_url: string;
  license_info: string;
  last_verified: string | null;
  status: 'connected' | 'available' | 'awaiting_connection' | 'unavailable' | 'validation_required';
}

export interface FactorReadinessItem {
  factor_name: string;
  category: string;
  parent_dataset: string;
  primary_source_id: string;
  status: 'READY' | 'MISSING_SOURCE';
  message: string;
}

export interface DataQualityReport {
  overall_status: string;
  total_sources: number;
  connected_sources: number;
  available_sources: number;
  missing_sources: number;
  invalid_sources: number;
  factor_readiness: Record<string, FactorReadinessItem>;
  dataset_sources: DataSourceItem[];
}

export interface GisLayerItem {
  layer_id: string;
  layer_name: string;
  data_type: string;
  source_id: string;
  source_name: string;
  crs: string;
  status: string;
  is_connected: boolean;
  version: string;
  last_updated: string;
  metadata: Record<string, any>;
}

export class DataQualityService {
  async getDataQualityReport(): Promise<DataQualityReport> {
    try {
      const res = await fetch('/api/data-quality', { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch data quality report:', e);
    }

    return {
      overall_status: 'AWAITING_CONNECTION',
      total_sources: 7,
      connected_sources: 0,
      available_sources: 1,
      missing_sources: 6,
      invalid_sources: 0,
      factor_readiness: {
        elevation: { factor_name: "Elevation", category: "Topographic", parent_dataset: "Digital Elevation Model (DEM)", primary_source_id: "src-dem-copernicus-30m", status: "MISSING_SOURCE", message: "Source dataset 'Digital Elevation Model (DEM)' not connected." },
        slope: { factor_name: "Slope", category: "Topographic", parent_dataset: "Digital Elevation Model (DEM)", primary_source_id: "src-dem-copernicus-30m", status: "MISSING_SOURCE", message: "Source dataset 'Digital Elevation Model (DEM)' not connected." },
        distance_to_river: { factor_name: "Distance to River", category: "Hydrological", parent_dataset: "River Vector Hydrography Network", primary_source_id: "src-hydro-osm-waterways", status: "MISSING_SOURCE", message: "Source dataset 'River Vector Hydrography Network' not connected." },
        distance_to_stream: { factor_name: "Distance to Stream", category: "Hydrological", parent_dataset: "Stream Vector Hydrography Network", primary_source_id: "src-hydro-osm-waterways", status: "MISSING_SOURCE", message: "Source dataset 'Stream Vector Hydrography Network' not connected." },
        distance_to_road: { factor_name: "Distance to Road", category: "Infrastructure", parent_dataset: "Road Network Vector Dataset", primary_source_id: "src-trans-osm-roads", status: "MISSING_SOURCE", message: "Source dataset 'Road Network Vector Dataset' not connected." },
        land_cover: { factor_name: "Land Cover (LULC)", category: "Environmental", parent_dataset: "LULC Land Use Classification Layer", primary_source_id: "src-lulc-isro-bhuvan", status: "MISSING_SOURCE", message: "Source dataset 'LULC Land Use Classification Layer' not connected." }
      },
      dataset_sources: [
        {
          source_id: 'src-dem-copernicus-30m',
          source_name: 'Copernicus DEM GLO-30',
          provider: 'European Space Agency (ESA)',
          dataset_name: 'Copernicus Digital Elevation Model 30m',
          data_type: 'raster',
          geographic_coverage: 'India National / Regional',
          spatial_resolution: '30m x 30m',
          temporal_resolution: 'Static (2026 Reference)',
          format: 'GeoTIFF',
          access_method: 'REST_API',
          source_url: 'Source URL not configured.',
          license_info: 'Copernicus Open Access License',
          last_verified: null,
          status: 'awaiting_connection'
        }
      ]
    };
  }

  async getGisLayers(): Promise<GisLayerItem[]> {
    try {
      const res = await fetch('/api/gis/layers', { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch GIS layers:', e);
    }
    return [];
  }
}

export const dataQualityService = new DataQualityService();
