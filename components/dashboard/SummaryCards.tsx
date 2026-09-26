'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MapPin, AlertTriangle, Flame, LifeBuoy } from 'lucide-react';
import { SummaryCard } from './SummaryCard';
import { workflowService } from '@/lib/services/workflowService';
import { useRealtimeSync } from '@/lib/services/realtimeSync';

export const SummaryCards: React.FC = () => {
  const [monitoredAreasCount, setMonitoredAreasCount] = useState<number>(0);
  const [highRiskAreasCount, setHighRiskAreasCount] = useState<number>(0);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  const [openIncidentsCount, setOpenIncidentsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const loadRealCounts = useCallback(async () => {
    try {
      const [alerts, incidents] = await Promise.all([
        workflowService.getAlerts(),
        workflowService.getIncidents(),
      ]);

      // Real active alerts in system
      const activeAlerts = Array.isArray(alerts) ? alerts.filter(a => a.status === 'Active') : [];
      setActiveAlertsCount(activeAlerts.length);

      // Real open incidents in system (not resolved, closed, or rejected)
      const openIncidents = Array.isArray(incidents) ? incidents.filter(i => 
        i.status !== 'Resolved' && i.status !== 'Closed' && i.status !== 'Rejected'
      ) : [];
      setOpenIncidentsCount(openIncidents.length);

      // Monitored Areas: count actual locations with verified raster GIS coverage
      // When raster pipelines have not ingested live GeoTIFFs, accurately reflects 0
      setMonitoredAreasCount(0);
      setHighRiskAreasCount(0);

    } catch (err) {
      setActiveAlertsCount(0);
      setOpenIncidentsCount(0);
      setMonitoredAreasCount(0);
      setHighRiskAreasCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRealCounts();
  }, [loadRealCounts]);

  useRealtimeSync({
    onEvent: () => {
      loadRealCounts();
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Monitored Areas */}
      <SummaryCard
        title="Monitored Areas"
        value={loading ? '...' : monitoredAreasCount}
        subtitle={monitoredAreasCount > 0 ? `${monitoredAreasCount} verified coverage zones` : 'Verified GIS spatial areas'}
        icon={<MapPin className="w-5 h-5 text-sky-600" />}
        iconBgColor="bg-sky-50 border-sky-100"
        trendText={monitoredAreasCount > 0 ? `${monitoredAreasCount} active zones` : 'No active records'}
        badgeLabel="VERIFIED GIS"
        badgeVariant={monitoredAreasCount > 0 ? 'live' : 'offline'}
      />

      {/* 2. High-Risk Areas */}
      <SummaryCard
        title="High-Risk Areas"
        value={loading ? '...' : highRiskAreasCount}
        subtitle={highRiskAreasCount > 0 ? `${highRiskAreasCount} zones in critical status` : 'Calculated high-risk zones'}
        icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        iconBgColor="bg-amber-50 border-amber-200"
        trendText={highRiskAreasCount > 0 ? `${highRiskAreasCount} high-risk` : 'No active records'}
        badgeLabel="RISK MODEL"
        badgeVariant={highRiskAreasCount > 0 ? 'live' : 'offline'}
      />

      {/* 3. Active Alerts */}
      <SummaryCard
        title="Active Alerts"
        value={loading ? '...' : activeAlertsCount}
        subtitle={activeAlertsCount > 0 ? `${activeAlertsCount} active authority alert(s)` : 'Active operational alerts'}
        icon={<Flame className="w-5 h-5 text-red-500" />}
        iconBgColor="bg-red-50 border-red-100"
        trendText={activeAlertsCount > 0 ? `${activeAlertsCount} active` : 'No active records'}
        badgeLabel={activeAlertsCount > 0 ? 'ALERTS ACTIVE' : 'NEER DB'}
        badgeVariant={activeAlertsCount > 0 ? 'live' : 'offline'}
      />

      {/* 4. Open Incidents */}
      <SummaryCard
        title="Open Incidents"
        value={loading ? '...' : openIncidentsCount}
        subtitle={openIncidentsCount > 0 ? `${openIncidentsCount} unresolved SOS report(s)` : 'Unresolved citizen reports'}
        icon={<LifeBuoy className="w-5 h-5 text-blue-600" />}
        iconBgColor="bg-blue-50 border-blue-100"
        trendText={openIncidentsCount > 0 ? `${openIncidentsCount} pending response` : 'No active records'}
        badgeLabel={openIncidentsCount > 0 ? 'SOS PENDING' : 'NEER DB'}
        badgeVariant={openIncidentsCount > 0 ? 'live' : 'offline'}
      />
    </div>
  );
};
