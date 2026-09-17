import { NextResponse } from 'next/server';
import { searchOpenStreetMapIndia, searchRedditTravelSignals } from '@/lib/destination-research';
import type { IndiaResearchResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = typeof body.query === 'string' ? body.query.trim().slice(0, 180) : '';
    if (query.length < 2) {
      return NextResponse.json({ error: 'A research query of at least 2 characters is required.' }, { status: 400 });
    }
    const [placesResult, redditResult] = await Promise.allSettled([
      searchOpenStreetMapIndia(query),
      searchRedditTravelSignals(query),
    ]);
    if (placesResult.status === 'rejected') throw placesResult.reason;

    const redditConfigured = Boolean(
      process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET && process.env.REDDIT_USER_AGENT,
    );
    const response: IndiaResearchResponse = {
      query,
      generatedAt: new Date().toISOString(),
      places: placesResult.value,
      redditSignals: redditResult.status === 'fulfilled' ? (redditResult.value ?? []) : [],
      sources: {
        openStreetMap: 'LIVE',
        reddit: !redditConfigured ? 'NOT_CONFIGURED' : redditResult.status === 'fulfilled' ? 'LIVE' : 'UNAVAILABLE',
      },
      warnings: [
        'OpenStreetMap provides geographic data, not ratings, reviews, live prices, or safety guarantees.',
        ...(redditResult.status === 'rejected' ? ['Reddit evidence could not be loaded for this search.'] : []),
      ],
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('India destination research error:', error);
    return NextResponse.json(
      { error: 'Live destination research failed. No unverified recommendations were generated.' },
      { status: 502 },
    );
  }
}
