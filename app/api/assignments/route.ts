import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const incident_id = searchParams.get('incident_id');
    const team_id = searchParams.get('team_id');
    const status = searchParams.get('status');

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    const params = new URLSearchParams();
    if (incident_id) params.set('incident_id', incident_id);
    if (team_id) params.set('team_id', team_id);
    if (status) params.set('status', status);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${backendUrl}/assignments${qs}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json([], { status: 200 });
  } catch (err) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    const res = await fetch(`${backendUrl}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: 201 });
    }
    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: errData.detail || 'Failed to create assignment' },
      { status: res.status }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
