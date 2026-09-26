import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const incident_id = searchParams.get('incident_id');

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    let query = '';
    if (source) query += `?source=${source}`;
    if (incident_id) query += `${query ? '&' : '?'}incident_id=${incident_id}`;

    const res = await fetch(`${backendUrl}/evidence${query}`, { cache: 'no-store' });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const res = await fetch(`${backendUrl}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
    return NextResponse.json({ error: 'Failed to upload evidence' }, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 500 });
  }
}
