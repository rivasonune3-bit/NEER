import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'REPORT_ENGINE_OFFLINE',
    generatedAt: new Date().toISOString(),
    summary: {
      totalMonitoredStates: 8,
      criticalInundationZones: 3,
      activeAdvisories: 3,
      openIncidents: 3,
      rescuersDeployed: 18,
    },
    isBackendExportConnected: false,
    message: 'Backend export engine offline. Awaiting report compiler service connection.'
  });
}
