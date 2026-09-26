import { NextResponse } from 'next/server';
import { DemoMlPredictionService } from '@/lib/ml/contract';

const mlService = new DemoMlPredictionService();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prediction = await mlService.predictSusceptibility(body);
    return NextResponse.json(prediction);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process susceptibility prediction' },
      { status: 500 }
    );
  }
}
