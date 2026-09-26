import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const authHeader = request.headers.get('Authorization') || '';
    const res = await fetch(`${backendUrl}/response-teams/me`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      },
      cache: 'no-store'
    });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
    return NextResponse.json(null, { status: 200 });
  } catch (error) {
    return NextResponse.json(null, { status: 200 });
  }
}
