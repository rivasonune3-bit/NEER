import { NextResponse } from 'next/server';
import { INDIA_STATES } from '@/lib/data/indiaLocations';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const location = INDIA_STATES.find(s => s.id === id) || INDIA_STATES[0];
  return NextResponse.json(location);
}
