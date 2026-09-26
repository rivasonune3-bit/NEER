import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const { locationId } = await params;
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe');

    // Proxy to FastAPI if available
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const endpoint = timeframe
        ? `/environment/${locationId}/history?timeframe=${timeframe}`
        : `/environment/${locationId}`;

      const res = await fetch(`${backendUrl}${endpoint}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Backend offline fallback
    }

    if (timeframe) {
      return NextResponse.json({
        location_id: locationId,
        timeframe: timeframe,
        status: 'UNAVAILABLE',
        message: 'Historical observations unavailable.',
        observations: []
      });
    }

    return NextResponse.json({
      location_id: locationId,
      latitude: 26.185,
      longitude: 91.772,
      overall_monitoring_status: 'DATA_UNAVAILABLE',
      tier_1_susceptibility: {
        status: 'UNAVAILABLE',
        risk_category: null,
        susceptibility_score: null,
        model_version: 'NEER-RandomForest-v1.0',
        missing_gis_factors: [
          'elevation', 'slope', 'distance_to_river', 'distance_to_stream',
          'distance_to_road', 'land_cover', 'aspect', 'twi', 'spi',
          'profile_curvature', 'plan_curvature'
        ],
        message: 'GIS factors awaiting point raster sampler.'
      },
      tier_2_environmental_conditions: {
        status: 'DATA_UNAVAILABLE',
        condition: 'DATA_UNAVAILABLE',
        valid_observations_count: 0,
        stale_observations_count: 0,
        invalid_observations_count: 0,
        observations: {},
        data_source_notice: 'External data source not connected. Telemetry observations unavailable.'
      },
      tier_3_trigger_status: {
        overall_trigger_status: 'UNCONFIGURED',
        triggered_rules_count: 0,
        unconfigured_rules_count: 4,
        evaluations: [
          {
            rule_id: 'TR-RAIN-01',
            name: '24-Hour Heavy Rainfall Threshold',
            status: 'UNCONFIGURED',
            triggered: false,
            message: 'Trigger thresholds not configured. Awaiting scientific or official calibration.'
          },
          {
            rule_id: 'TR-RIVER-01',
            name: 'River Danger Level Breach',
            status: 'UNCONFIGURED',
            triggered: false,
            message: 'Trigger thresholds not configured. Awaiting scientific or official calibration.'
          }
        ],
        disclaimer: 'Flood trigger evaluation requires verified scientific thresholds configured by authorized hydrology agencies.'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { status: 'ERROR', message: 'Failed to fetch environmental data' },
      { status: 500 }
    );
  }
}
