import { NextResponse } from 'next/server';
import { INDIA_STATES } from '@/lib/data/indiaLocations';

export async function GET() {
  return NextResponse.json(INDIA_STATES);
}
