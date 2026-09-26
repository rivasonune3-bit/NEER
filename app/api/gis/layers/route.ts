import { NextResponse } from 'next/server';

export async function GET() {
  try {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/gis/layers`, { cache: 'no-store' });
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch (e) {
      // Fallback
    }

    return NextResponse.json([
      {
        layer_id: 'lyr-dem-copernicus-30m',
        layer_name: 'Copernicus DEM 30m Raster',
        data_type: 'raster',
        source_id: 'src-dem-copernicus-30m',
        source_name: 'European Space Agency (ESA)',
        crs: 'EPSG:4326',
        status: 'awaiting_connection',
        is_connected: false,
        version: '2026.1',
        last_updated: 'Not Verified',
        metadata: { format: 'GeoTIFF', coverage: 'India National', resolution: '30m x 30m' }
      },
      {
        layer_id: 'lyr-hydro-osm-waterways',
        layer_name: 'OpenStreetMap River & Stream Vector Network',
        data_type: 'vector',
        source_id: 'src-hydro-osm-waterways',
        source_name: 'OpenStreetMap Contributors',
        crs: 'EPSG:4326',
        status: 'awaiting_connection',
        is_connected: false,
        version: '2026.1',
        last_updated: 'Not Verified',
        metadata: { format: 'GeoJSON / Shapefile', coverage: 'India National', resolution: 'Vector' }
      },
      {
        layer_id: 'lyr-admin-soi-gadm',
        layer_name: 'Survey of India Spatial Admin Boundaries',
        data_type: 'vector',
        source_id: 'src-admin-soi-gadm',
        source_name: 'Survey of India / GADM',
        crs: 'EPSG:4326',
        status: 'available',
        is_connected: true,
        version: '2026.1',
        last_updated: new Date().toISOString(),
        metadata: { format: 'GeoPackage / GeoJSON', coverage: 'India National', resolution: 'Vector' }
      }
    ]);
  } catch (error) {
    return NextResponse.json({ status: 'ERROR', message: 'Failed to fetch GIS layers' }, { status: 500 });
  }
}
