import { NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/recommendation-engine';
import type { SearchRequest } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body: SearchRequest = await req.json();

    // Validate essential inputs
    if (!body.originPlaceId || !body.budget || !body.travelers) {
      return NextResponse.json(
        { error: 'Missing required parameters: origin, budget, and travelers are required.' },
        { status: 400 }
      );
    }

    const results = await getRecommendations(body);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      query: {
        origin: body.originLabel || body.originPlaceId,
        travelers: body.travelers,
        budget: body.budget,
        durationDays: body.durationDays,
        style: body.style,
      },
      resultsCount: results.length,
      recommendations: results,
    });
  } catch (error: unknown) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal recommendation error' },
      { status: 500 }
    );
  }
}
