import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    {
      error: 'Environmental data unavailable — sensor telemetry stream not connected',
      locationId: id,
      environmental: null
    },
    { status: 503 }
  );
}
