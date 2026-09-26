import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'PREDICTION_SERVICE_STANDBY',
    modelVersion: 'NEER-Baseline-v1.0',
    predictionType: 'static_susceptibility',
    predictions: [
      { locationId: 'st-as', susceptibilityScore: 88, riskCategory: 'CRITICAL', confidence: 94.2 },
      { locationId: 'st-kl', susceptibilityScore: 81, riskCategory: 'HIGH', confidence: 91.5 },
    ]
  });
}
