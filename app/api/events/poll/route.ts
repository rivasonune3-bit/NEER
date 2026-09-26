import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since') || '0';
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

    const res = await fetch(`${backendUrl}/events/poll?since=${encodeURIComponent(since)}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({ events: [], current_version: parseInt(since, 10) || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error', events: [], current_version: 0 }, { status: 500 });
  }
}
