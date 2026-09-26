export const dynamic = 'force-dynamic';

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

  try {
    const response = await fetch(`${backendUrl}/events/stream`, {
      headers: {
        Accept: 'text/event-stream',
      },
      cache: 'no-store',
    });

    if (!response.ok || !response.body) {
      return new Response('Event stream error', { status: 500 });
    }

    return new Response(response.body as any, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
