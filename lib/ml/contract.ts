import { GisFactors, EnvironmentalData, RiskLevel } from '../types';

export interface MlPredictionRequest {
  locationId: string;
  lat: number;
  lng: number;
  gisFactors: GisFactors;
  environmentalData: EnvironmentalData;
  modelVersion?: string; // e.g. "NEER-RandomForest-v1"
}

export interface MlPredictionResponse {
  susceptibilityScore: number | null; // null if unavailable
  riskLevel: RiskLevel;
  confidenceInterval: [number, number]; // [min, max]
  primaryDrivers: { factorKey: keyof GisFactors; contributionPct: number }[];
  modelMetadata: {
    modelName: string;
    version: string;
    trainedDate: string;
    aucRocScore: number | null;
    backendStatus: 'CONNECTED' | 'DISCONNECTED_NOT_AVAILABLE';
    statusMessage?: string;
  };
}

export interface IMlPredictionService {
  predictSusceptibility(request: MlPredictionRequest): Promise<MlPredictionResponse>;
  checkHealth(): Promise<{ status: 'HEALTHY' | 'UNAVAILABLE'; latencyMs: number }>;
}

/**
 * Service Implementation when real model backend is not connected.
 * Returns explicit "Prediction Unavailable — Verified Model/Data Required" status.
 */
export class OfflineMlPredictionService implements IMlPredictionService {
  async predictSusceptibility(_request: MlPredictionRequest): Promise<MlPredictionResponse> {
    return {
      susceptibilityScore: null,
      riskLevel: 'UNASSESSED',
      confidenceInterval: [0, 0],
      primaryDrivers: [],
      modelMetadata: {
        modelName: 'NEER-RandomForest-Pipeline',
        version: '1.0.0',
        trainedDate: 'N/A',
        aucRocScore: null,
        backendStatus: 'DISCONNECTED_NOT_AVAILABLE',
        statusMessage: 'Prediction unavailable — verified model/data required',
      },
    };
  }

  async checkHealth() {
    return { status: 'UNAVAILABLE' as const, latencyMs: 0 };
  }
}

export const DemoMlPredictionService = OfflineMlPredictionService;
