import { NextResponse } from 'next/server';

export async function GET() {
  try {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/incidents`, { cache: 'no-store' });
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch (e) {
      // Offline
    }

    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json({ status: 'ERROR', message: 'Failed to fetch incidents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/incidents`, {
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
      { status: 'ERROR', message: 'Backend database offline. Cannot record incident report.' },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json({ status: 'ERROR', message: 'Failed to report incident' }, { status: 500 });
  }
}
