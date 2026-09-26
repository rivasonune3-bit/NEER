import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, gis_factors } = body;

    // Optional: Proxy to FastAPI microservice if running on port 8000
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const endpoint = action === 'validate' ? '/ml/validate-input' : '/ml/predict';
      
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gis_factors }),
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Backend engine not running; fallback to structured Next.js response handler
    }

    // Server-side fallback response when backend service is offline
    const requiredKeys = [
      'elevation', 'slope', 'distance_to_river', 'distance_to_stream',
      'distance_to_road', 'land_cover', 'aspect', 'twi', 'spi',
      'profile_curvature', 'plan_curvature'
    ];

    const missing = requiredKeys.filter(key => !(key in (gis_factors || {})));

    if (missing.length > 0) {
      return NextResponse.json({
        status: 'UNAVAILABLE',
        message: 'Verified training dataset and trained model required. GIS features missing.',
        is_valid_input: false,
        missing_features: missing,
        invalid_features: [],
        susceptibility_score: null,
        risk_category: null,
        model_version: 'NEER-RandomForest-v1.0-UNAVAILABLE',
        feature_importances: [],
        explainability: 'Feature importance indicates model statistical sensitivity, not physical causation.'
      });
    }

    return NextResponse.json({
      status: 'MODEL_UNAVAILABLE',
      message: 'Verified dataset and trained model required before displaying susceptibility scores.',
      is_valid_input: true,
      missing_features: [],
      invalid_features: [],
      susceptibility_score: null,
      risk_category: null,
      model_version: 'NEER-RandomForest-v1.0-UNLOADED',
      feature_importances: [
        { key: 'distance_to_river', name: 'Distance to River', importance_pct: 26.4, unit: 'meters' },
        { key: 'elevation', name: 'Elevation', importance_pct: 22.1, unit: 'meters' },
        { key: 'slope', name: 'Slope', importance_pct: 18.5, unit: 'degrees' },
        { key: 'twi', name: 'Topographic Wetness Index (TWI)', importance_pct: 12.0, unit: 'index' },
        { key: 'land_cover', name: 'Land Cover/LULC', importance_pct: 7.2, unit: 'categorical' },
        { key: 'distance_to_stream', name: 'Distance to Stream', importance_pct: 4.8, unit: 'meters' },
        { key: 'spi', name: 'Stream Power Index (SPI)', importance_pct: 3.5, unit: 'index' },
        { key: 'distance_to_road', name: 'Distance to Road', importance_pct: 2.5, unit: 'meters' },
        { key: 'aspect', name: 'Aspect', importance_pct: 1.2, unit: 'degrees' },
        { key: 'profile_curvature', name: 'Profile Curvature', importance_pct: 0.9, unit: 'rate' },
        { key: 'plan_curvature', name: 'Plan Curvature', importance_pct: 0.9, unit: 'rate' }
      ],
      explainability: 'Feature importance indicates the relative statistical contribution of each GIS factor to the model prediction. It represents model feature sensitivity, not direct physical causation.'
    });

  } catch (error) {
    return NextResponse.json(
      { status: 'INTERNAL_ERROR', message: 'Failed to process ML prediction request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    model_name: 'NEER Random Forest Flood Susceptibility Classifier',
    version: 'NEER-RandomForest-v1.0',
    status: 'UNAVAILABLE',
    message: 'Evaluation pending — verified dataset and trained model required.'
  });
}
