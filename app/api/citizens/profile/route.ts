import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const authHeader = request.headers.get('Authorization') || '';
    const body = await request.json();
    const res = await fetch(`${backendUrl}/citizens/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
    return NextResponse.json({ error: 'Failed to update citizen profile' }, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 500 });
  }
}
