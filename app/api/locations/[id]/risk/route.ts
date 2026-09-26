import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    {
      error: 'Location risk data unavailable — prediction service not connected',
      locationId: id,
      riskLevel: 'UNASSESSED',
      susceptibilityScore: null
    },
    { status: 503 }
  );
}
