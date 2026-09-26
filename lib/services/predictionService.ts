import { fetchApi, ApiResponse } from './apiClient';
import { LocationRiskDetail, GisFactors } from '../types';

export interface MlPredictionResult {
  status: string;
  message: string;
  is_valid_input: boolean;
  missing_features: string[];
  invalid_features: string[];
  susceptibility_score: number | null;
  risk_category: string | null;
  confidence?: number;
  model_version: string;
  feature_importances: { key: string; name: string; importance_pct: number; unit: string }[];
  explainability: string;
}

export class PredictionService {
  async getRiskPrediction(locationId: string): Promise<ApiResponse<LocationRiskDetail>> {
    const apiRes = await fetchApi<LocationRiskDetail>(`/locations/${locationId}/risk`);
    if (apiRes.backendConnected && apiRes.data) return apiRes;

    return {
      data: null,
      error: 'Prediction unavailable — verified model/data required',
      backendConnected: false,
      status: 'BACKEND_NOT_CONNECTED',
    };
  }

  async predictMlSusceptibility(gisFactors: Partial<GisFactors>): Promise<MlPredictionResult> {
    try {
      const res = await fetch('/api/ml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'predict', gis_factors: gisFactors })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to call ML prediction service:', e);
    }

    return {
      status: 'UNAVAILABLE',
      message: 'Verified dataset and trained model required before displaying susceptibility scores.',
      is_valid_input: false,
      missing_features: [
        'Elevation', 'Slope', 'Distance to River', 'Distance to Stream',
        'Distance to Road', 'Land Cover/LULC', 'Aspect', 'Topographic Wetness Index (TWI)',
        'Stream Power Index (SPI)', 'Profile Curvature', 'Plan Curvature'
      ],
      invalid_features: [],
      susceptibility_score: null,
      risk_category: null,
      model_version: 'NEER-RandomForest-v1.0-UNAVAILABLE',
      feature_importances: [],
      explainability: 'Feature importance indicates model statistical sensitivity, not physical causation.'
    };
  }
}

export const predictionService = new PredictionService();
