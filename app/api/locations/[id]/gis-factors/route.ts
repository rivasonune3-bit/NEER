import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    {
      error: 'GIS factors unavailable — raster layer sampling pipeline required',
      locationId: id,
      factors: null
    },
    { status: 503 }
  );
}
