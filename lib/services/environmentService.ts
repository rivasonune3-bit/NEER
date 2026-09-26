export interface EnvironmentalObservationData {
  location_id: string;
  latitude: number;
  longitude: number;
  parameter: string;
  value: number | string;
  unit: string;
  observed_at: string;
  source: string;
  quality_status: 'valid' | 'warning' | 'invalid' | 'stale';
}

export interface TriggerRuleData {
  id: string;
  name: string;
  parameter: string;
  threshold: number | null;
  unit?: string;
  comparison_operator: string;
  duration_minutes?: number;
  geographic_scope: string;
  source: string;
  status: 'not_configured' | 'configured' | 'active' | 'disabled';
  conditions?: any[];
  message: string;
}

export interface LocationMonitoringStatusData {
  location_id: string;
  latitude: number;
  longitude: number;
  overall_monitoring_status: 'NORMAL' | 'MONITORING' | 'ELEVATED' | 'TRIGGERED' | 'DATA_UNAVAILABLE';
  tier_1_susceptibility: {
    status: string;
    risk_category: string | null;
    susceptibility_score: number | null;
    model_version: string;
    missing_gis_factors: string[];
    message: string;
  };
  tier_2_environmental_conditions: {
    status: string;
    condition: string;
    valid_observations_count: number;
    stale_observations_count: number;
    invalid_observations_count: number;
    observations: Record<string, EnvironmentalObservationData>;
    data_source_notice: string;
  };
  tier_3_trigger_status: {
    overall_trigger_status: string;
    triggered_rules_count: number;
    unconfigured_rules_count: number;
    evaluations: {
      rule_id: string;
      name: string;
      status: string;
      triggered: boolean;
      message: string;
    }[];
    disclaimer: string;
  };
  timestamp: string;
}

export class EnvironmentService {
  async getEnvironmentStatus(locationId: string): Promise<LocationMonitoringStatusData> {
    try {
      const res = await fetch(`/api/environment/${locationId}`, { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch environment status:', e);
    }

    return {
      location_id: locationId,
      latitude: 26.185,
      longitude: 91.772,
      overall_monitoring_status: 'DATA_UNAVAILABLE',
      tier_1_susceptibility: {
        status: 'UNAVAILABLE',
        risk_category: null,
        susceptibility_score: null,
        model_version: 'NEER-RandomForest-v1.0',
        missing_gis_factors: ['elevation', 'slope', 'distance_to_river'],
        message: 'GIS factors awaiting point sampler.'
      },
      tier_2_environmental_conditions: {
        status: 'DATA_UNAVAILABLE',
        condition: 'DATA_UNAVAILABLE',
        valid_observations_count: 0,
        stale_observations_count: 0,
        invalid_observations_count: 0,
        observations: {},
        data_source_notice: 'External data source not connected. Telemetry observations unavailable.'
      },
      tier_3_trigger_status: {
        overall_trigger_status: 'UNCONFIGURED',
        triggered_rules_count: 0,
        unconfigured_rules_count: 4,
        evaluations: [],
        disclaimer: 'Flood trigger evaluation requires verified scientific thresholds configured by authorized hydrology agencies.'
      },
      timestamp: new Date().toISOString()
    };
  }

  async getTriggerRules(): Promise<TriggerRuleData[]> {
    try {
      const res = await fetch('/api/triggers', { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch trigger rules:', e);
    }
    return [];
  }
}

export const environmentService = new EnvironmentService();
