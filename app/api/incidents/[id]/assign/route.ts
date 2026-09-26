import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const body = await request.json();
    const res = await fetch(`${backendUrl}/incidents/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
    const errData = await res.json().catch(() => ({ detail: 'Failed to assign team' }));
    return NextResponse.json({ error: errData.detail || 'Failed to assign team' }, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 500 });
  }
}
