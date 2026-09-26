import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lat: string; lng: string }> }
) {
  try {
    const { lat, lng } = await params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { status: 'error', error_code: 'INVALID_COORDINATES', message: 'Latitude and Longitude must be valid numbers.' },
        { status: 400 }
      );
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/gis/location/${latitude}/${longitude}`, { cache: 'no-store' });
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch (e) {
      // Backend unavailable fallback
    }

    // Fallback compliant with ZERO-FABRICATED-DATA policy
    return NextResponse.json({
      status: 'unavailable',
      factor: 'elevation',
      reason: 'Required verified dataset is not available.',
      latitude,
      longitude,
      missing_factors: [
        'elevation',
        'slope',
        'distToRiver',
        'distToStream',
        'distToRoad',
        'lulc',
        'aspect',
        'twi',
        'spi',
        'profileCurvature',
        'planCurvature'
      ],
      available_factors_count: 0,
      total_required: 11,
      data_source_status: 'Source not connected — awaiting verified dataset.',
      message: 'Verified GIS data layers are not connected. Preprocessing required for target study area.'
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to extract GIS location factors' },
      { status: 500 }
    );
  }
}
