import { NextResponse } from 'next/server';
import { getDestinationBySlug, getDestinationById } from '@/lib/destinations';
import { generateTransportOptions } from '@/lib/cost-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { origin = 'delhi_in', destSlug = 'goa-india', destId, travelers = 4 } = body;

    const destination = destId
      ? getDestinationById(destId)
      : getDestinationBySlug(destSlug);

    if (!destination) {
      return NextResponse.json(
        { error: `Destination '${destSlug || destId}' not found in catalog.` },
        { status: 404 }
      );
    }

    const isInternational = destination.countryCode !== 'IN';
    // Approximation distance based on destination
    const distanceKm = isInternational ? 3500 : 1200;

    const options = generateTransportOptions(
      distanceKm,
      travelers,
      isInternational,
      'IN',
      destination.countryCode
    );

    return NextResponse.json({
      success: true,
      origin,
      destination: {
        id: destination.id,
        city: destination.city,
        country: destination.country,
        countryCode: destination.countryCode,
      },
      travelers,
      distanceKm,
      options,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Compare route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to compare routes.' },
      { status: 500 },
    );
  }
}
