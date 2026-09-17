import { NextResponse } from 'next/server';
import { getOpenStreetMapRoadTransport } from '@/lib/openstreetmap';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const origin = typeof body.origin === 'string' ? body.origin.trim() : '';
    const destination = typeof body.destination === 'string' ? body.destination.trim() : '';
    const travelers = Number(body.travelers);

    if (!origin || !destination || !Number.isInteger(travelers) || travelers < 1 || travelers > 20) {
      return NextResponse.json(
        { error: 'origin, destination, and travelers (1–20) are required.' },
        { status: 400 },
      );
    }

    const options = await getOpenStreetMapRoadTransport(origin, destination, travelers);
    return NextResponse.json({ success: true, source: 'OPENSTREETMAP_OSRM', options });
  } catch (error) {
    console.error('OpenStreetMap road route error:', error);
    return NextResponse.json(
      { error: 'Live road data could not be loaded.', code: 'ROUTES_LOOKUP_FAILED' },
      { status: 502 },
    );
  }
}
