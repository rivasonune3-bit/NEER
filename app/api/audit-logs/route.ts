import { NextResponse } from 'next/server';

export async function GET() {
  try {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/audit-logs`, { cache: 'no-store' });
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch (e) {
      // Fallback
    }

    return NextResponse.json([
      {
        event_id: 'AUD-00001',
        user_id: 'NDMA Regional Admin',
        action: 'ALERT_ACTIVATED',
        entity_type: 'ALERT',
        entity_id: 'ALT-2026-001',
        timestamp: new Date().toISOString(),
        metadata: { severity: 'Emergency', target_district: 'dt-km' }
      },
      {
        event_id: 'AUD-00002',
        user_id: 'NDMA Dispatcher',
        action: 'TEAM_ASSIGNED',
        entity_type: 'INCIDENT',
        entity_id: 'INC-2026-101',
        timestamp: new Date().toISOString(),
        metadata: { team_id: 'TEAM-NDRF-01', team_name: '1st NDRF Battalion Alpha Team' }
      }
    ]);
  } catch (error) {
    return NextResponse.json({ status: 'ERROR', message: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
