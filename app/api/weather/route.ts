import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    status: 'TELEMETRY_UNCONNECTED',
    provider: 'Central Water Commission & IMD Stub',
    telemetry: {
      rainfall1h: 42.5,
      rainfall24h: 185.0,
      waterLevel: 2.45,
      dangerMarkLevel: 1.80,
      dischargeRate: 14200,
      reservoirCapacityPct: 94.2,
      radarStormTrend: 'RISING',
    },
    isLiveTelemetry: false,
  });
}
