import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location_name = searchParams.get('location_name') || 'Chamoli';
    const district = searchParams.get('district');
    const state = searchParams.get('state');

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    const params = new URLSearchParams();
    params.set('location_name', location_name);
    if (district) params.set('district', district);
    if (state) params.set('state', state);

    const res = await fetch(`${backendUrl}/targeting?${params.toString()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({
      target_location: location_name,
      primary_count: 0,
      primary_citizens: [],
      nearby_count: 0,
      nearby_citizens: [],
      total_recipients: 0,
      teams_count: 0,
      response_teams: [],
      active_sos_count: 0,
      active_incidents: []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
