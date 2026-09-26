import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const body = await request.json();
    const res = await fetch(`${backendUrl}/incidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch (e) {
    // Offline
  }

  return NextResponse.json(
    { status: 'ERROR', message: 'Backend database offline. Cannot update incident.' },
    { status: 503 }
  );
}
