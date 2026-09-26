import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location_name = searchParams.get('location_name') || 'Chamoli';
    const district = searchParams.get('district');

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    const params = new URLSearchParams();
    params.set('location_name', location_name);
    if (district) params.set('district', district);

    const res = await fetch(`${backendUrl}/operations/summary?${params.toString()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({
      location_name,
      district: district || location_name,
      response_teams: { available: 0, assigned: 0, en_route: 0, on_scene: 0, total: 0 },
      ambulances: { available: 0, assigned: 0, en_route: 0, on_scene: 0, total: 0 },
      medical_teams: { available: 0, assigned: 0, en_route: 0, on_scene: 0, total: 0 },
      citizens: { registered: 0, risk_zone: 0, sos: 0, alert_sent: 0 },
      active_incidents: { critical: 0, high: 0, total: 0 }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
