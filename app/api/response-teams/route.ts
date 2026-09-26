import { NextResponse } from 'next/server';

export async function GET() {
  try {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/response-teams`, { cache: 'no-store' });
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch (e) {
      // Offline
    }

    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json({ status: 'ERROR', message: 'Failed to fetch response teams' }, { status: 500 });
  }
}
