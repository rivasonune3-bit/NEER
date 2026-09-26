import { NextResponse } from 'next/server';

export async function GET() {
  try {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/triggers`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Offline fallback
    }

    return NextResponse.json([
      {
        id: 'TR-RAIN-01',
        name: '24-Hour Heavy Rainfall Threshold',
        parameter: 'rainfall',
        threshold: null,
        unit: 'mm',
        comparison_operator: '>=',
        duration_minutes: 1440,
        geographic_scope: 'district',
        source: 'awaiting_verified_threshold',
        status: 'not_configured',
        conditions: [],
        message: 'Trigger thresholds not configured.'
      },
      {
        id: 'TR-RIVER-01',
        name: 'River Danger Level Breach',
        parameter: 'river_level',
        threshold: null,
        unit: 'm',
        comparison_operator: '>=',
        duration_minutes: 60,
        geographic_scope: 'district',
        source: 'awaiting_verified_threshold',
        status: 'not_configured',
        conditions: [],
        message: 'Trigger thresholds not configured.'
      },
      {
        id: 'TR-MULTI-01',
        name: 'Combined Torrential Rain & River Level Rise',
        parameter: 'multi_condition',
        threshold: null,
        source: 'awaiting_verified_threshold',
        status: 'not_configured',
        conditions: [
          { parameter: 'rainfall', operator: '>=', threshold: null },
          { parameter: 'river_level', operator: '>=', threshold: null }
        ],
        message: 'Trigger thresholds not configured.'
      }
    ]);

  } catch (error) {
    return NextResponse.json(
      { status: 'ERROR', message: 'Failed to fetch trigger rules' },
      { status: 500 }
    );
  }
}
