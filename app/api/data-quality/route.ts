import { NextResponse } from 'next/server';

export async function GET() {
  try {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/data-quality`, { cache: 'no-store' });
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch (e) {
      // Offline fallback
    }

    return NextResponse.json({
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
          provider: 'European Space Agency (ESA) / Copernicus',
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
        },
        {
          source_id: 'src-lulc-isro-bhuvan',
          source_name: 'ISRO Bhuvan LULC 10m',
          provider: 'National Remote Sensing Centre (NRSC) / ISRO',
          dataset_name: 'Bhuvan Land Use Land Cover Map',
          data_type: 'raster',
          geographic_coverage: 'India National',
          spatial_resolution: '10m x 10m',
          temporal_resolution: 'Annual Update',
          format: 'GeoTIFF / GeoPackage',
          access_method: 'WMS_WFS',
          source_url: 'Source URL not configured.',
          license_info: 'Government of India Open Data',
          last_verified: null,
          status: 'awaiting_connection'
        },
        {
          source_id: 'src-hydro-osm-waterways',
          source_name: 'OpenStreetMap India Hydrography',
          provider: 'OpenStreetMap Contributors',
          dataset_name: 'India River & Stream Vector Network',
          data_type: 'vector',
          geographic_coverage: 'India National',
          spatial_resolution: 'Vector Lines & Polygons',
          temporal_resolution: 'Continuous Open Contribution',
          format: 'GeoJSON / Shapefile',
          access_method: 'DIRECT_DOWNLOAD',
          source_url: 'Source URL not configured.',
          license_info: 'Open Database License (ODbL)',
          last_verified: null,
          status: 'awaiting_connection'
        },
        {
          source_id: 'src-gauge-cwc-telemetry',
          source_name: 'CWC Hydro-Meteorological Gauge Network',
          provider: 'Central Water Commission (CWC)',
          dataset_name: 'River Water Level & Reservoir Storage Telemetry',
          data_type: 'telemetry',
          geographic_coverage: 'Major River Basins',
          spatial_resolution: 'Point Station Sensor Network',
          temporal_resolution: 'Hourly / 15-min Telemetry',
          format: 'CSV / JSON API',
          access_method: 'REST_API',
          source_url: 'Source URL not configured.',
          license_info: 'Central Water Commission Public Portal',
          last_verified: null,
          status: 'awaiting_connection'
        },
        {
          source_id: 'src-rain-imd-gridded',
          source_name: 'IMD High-Resolution Gridded Rainfall',
          provider: 'India Meteorological Department (IMD)',
          dataset_name: 'IMD 0.25° x 0.25° Daily Gridded Rainfall',
          data_type: 'grid',
          geographic_coverage: 'India Subcontinent',
          spatial_resolution: '25km x 25km (0.25°)',
          temporal_resolution: 'Daily / 3-Hourly',
          format: 'NetCDF / GeoTIFF',
          access_method: 'DIRECT_DOWNLOAD',
          source_url: 'Source URL not configured.',
          license_info: 'IMD Open Data Policy',
          last_verified: null,
          status: 'awaiting_connection'
        },
        {
          source_id: 'src-admin-soi-gadm',
          source_name: 'Survey of India / GADM Spatial Admin Boundaries',
          provider: 'Survey of India / GADM Project',
          dataset_name: 'India State, District, Block & Village Boundaries',
          data_type: 'vector',
          geographic_coverage: 'India National',
          spatial_resolution: 'Vector Polygons',
          temporal_resolution: '2026 Reference',
          format: 'GeoPackage / GeoJSON',
          access_method: 'LOCAL_FILE',
          source_url: 'Source URL not configured.',
          license_info: 'Official Administrative Reference',
          last_verified: new Date().toISOString(),
          status: 'available'
        }
      ]
    });
  } catch (error) {
    return NextResponse.json({ status: 'ERROR', message: 'Failed to fetch data quality report' }, { status: 500 });
  }
}
