import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const state_id = searchParams.get('state_id');
    const district_id = searchParams.get('district_id');

    // Proxy to FastAPI microservice if running
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const query = state_id ? `?state_id=${state_id}&district_id=${district_id || ''}` : '';
      const res = await fetch(`${backendUrl}/alerts${query}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Backend disconnected
    }

    // No verified fake alerts; return clean empty list
    return NextResponse.json([]);

  } catch (error) {
    return NextResponse.json(
      { status: 'ERROR', message: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store'
      });
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch (e) {
      // Offline
    }

    return NextResponse.json(
      { status: 'ERROR', message: 'Backend database offline. Cannot issue operational alert.' },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json({ status: 'ERROR', message: 'Failed to create alert' }, { status: 500 });
  }
}
