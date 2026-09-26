import { NextResponse } from 'next/server';
import { GIS_FACTOR_DEFINITIONS, calculateBaselineGisScore } from '@/lib/gis/factors';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId') || 'st-as';

  return NextResponse.json({
    status: 'success',
    locationId,
    definitions: GIS_FACTOR_DEFINITIONS,
    baselineWeights: {
      elevation: 15,
      slope: 14,
      distToRiver: 16,
      distToStream: 12,
      distToRoad: 7,
      lulc: 10,
      aspect: 4,
      twi: 11,
      spi: 6,
      profileCurvature: 2.5,
      planCurvature: 2.5,
    },
    isVerifiedRasterDataset: false,
    message: 'GIS processing service stub ready for DEM raster dataset integration.',
  });
}
