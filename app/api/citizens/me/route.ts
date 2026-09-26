import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const authHeader = request.headers.get('Authorization') || '';
    const res = await fetch(`${backendUrl}/citizens/me`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      },
      cache: 'no-store'
    });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
    return NextResponse.json({ error: 'Failed to fetch citizen profile' }, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 500 });
  }
}
